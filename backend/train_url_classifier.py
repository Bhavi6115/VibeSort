import pandas as pd
import numpy as np
import re
import joblib

from urllib.parse import urlparse

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    accuracy_score
)

# ----------------------------------------
# URL FEATURE EXTRACTION
# ----------------------------------------

def extract_features(url):
    features = {}

    features['length'] = len(url)

    features['dot_count'] = url.count('.')

    features['hyphen_count'] = url.count('-')

    features['contains_ip'] = 1 if re.search(
        r'\d+\.\d+\.\d+\.\d+',
        url
    ) else 0

    features['https'] = 1 if url.startswith(
        'https'
    ) else 0

    features['shortener'] = 1 if any(
        short in url
        for short in [
            'bit.ly',
            'tinyurl',
            'goo.gl',
            'ow.ly',
            'is.gd',
            'shorturl'
        ]
    ) else 0

    features['special_char_count'] = len(
        re.findall(
            r'[^a-zA-Z0-9\.\-]',
            url
        )
    )

    features['has_at'] = 1 if '@' in url else 0

    suspicious_words = [
        'secure',
        'verify',
        'account',
        'login',
        'update',
        'confirm',
        'bank',
        'paypal',
        'signin'
    ]

    features['suspicious_word_count'] = sum(
        1 for word in suspicious_words
        if word in url.lower()
    )

    try:
        parsed = urlparse(
            url if '://' in url
            else 'http://' + url
        )

        domain = parsed.netloc

        if not domain:
            domain = parsed.path.split('/')[0]

        features['domain_length'] = len(domain)

        features['subdomain_count'] = domain.count('.')

        tld = domain.split('.')[-1]

        risky_tlds = [
            'tk',
            'ml',
            'ga',
            'cf',
            'xyz',
            'top',
            'club',
            'work',
            'online',
            'site',
            'pw'
        ]

        features['risky_tld'] = (
            1 if tld in risky_tlds else 0
        )

    except:
        features['domain_length'] = 0
        features['subdomain_count'] = 0
        features['risky_tld'] = 0

    return features


# ----------------------------------------
# LOAD DATASET
# ----------------------------------------

print("\nLoading Dataset...\n")

df = pd.read_csv("Phishing URL.csv")

print("Dataset Shape:", df.shape)

# ----------------------------------------
# FIND URL + LABEL COLUMNS
# ----------------------------------------

url_col = None
label_col = None

for col in df.columns:

    lower = col.lower()

    if lower in [
        'url',
        'address',
        'domain'
    ]:
        url_col = col

    if lower in [
        'label',
        'result',
        'class',
        'type'
    ]:
        label_col = col

if url_col is None:
    raise ValueError(
        "Could not find URL column"
    )

if label_col is None:
    raise ValueError(
        "Could not find Label column"
    )

print("URL Column:", url_col)
print("Label Column:", label_col)

# ----------------------------------------
# LABEL PROCESSING
# ----------------------------------------

urls = df[url_col].astype(str)

labels = df[label_col]

if labels.dtype == object:

    label_map = {
        'phishing': 1,
        'malicious': 1,
        'fraud': 1,
        'scam': 1,
        'legitimate': 0,
        'safe': 0,
        'benign': 0
    }

    labels = (
        labels
        .astype(str)
        .str.lower()
        .map(label_map)
        .fillna(0)
        .astype(int)
    )

else:
    labels = labels.astype(int)

# ----------------------------------------
# FEATURE EXTRACTION
# ----------------------------------------

print("\nExtracting Features...\n")

feature_rows = []

for url in urls:
    feature_rows.append(
        extract_features(url)
    )

X = pd.DataFrame(feature_rows)

feature_order = [
    'length',
    'dot_count',
    'hyphen_count',
    'contains_ip',
    'https',
    'shortener',
    'special_char_count',
    'has_at',
    'suspicious_word_count',
    'domain_length',
    'subdomain_count',
    'risky_tld'
]

X = X[feature_order]

y = labels

print("Features Shape:", X.shape)

# ----------------------------------------
# SPLIT DATA
# ----------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# ----------------------------------------
# TRAIN MODEL
# ----------------------------------------

print("\nTraining Random Forest...\n")

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight='balanced'
)

model.fit(
    X_train,
    y_train
)

# ----------------------------------------
# EVALUATION
# ----------------------------------------

predictions = model.predict(
    X_test
)

accuracy = accuracy_score(
    y_test,
    predictions
)

print("\nAccuracy:", accuracy)

print("\nClassification Report:\n")

print(
    classification_report(
        y_test,
        predictions
    )
)

# ----------------------------------------
# SAVE MODEL
# ----------------------------------------

joblib.dump(
    model,
    'url_classifier.pkl'
)

print(
    "\nModel saved successfully as url_classifier.pkl"
)

# ----------------------------------------
# FEATURE IMPORTANCE
# ----------------------------------------

importance_df = pd.DataFrame({
    "feature": feature_order,
    "importance": model.feature_importances_
})

importance_df = importance_df.sort_values(
    by='importance',
    ascending=False
)

importance_df.to_csv(
    "feature_importance.csv",
    index=False
)

print(
    "Feature Importance saved."
)