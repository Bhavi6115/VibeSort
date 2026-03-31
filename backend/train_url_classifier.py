import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import re
from urllib.parse import urlparse

# Feature extraction function
def extract_features(url):
    features = {}
    features['length'] = len(url)
    features['dot_count'] = url.count('.')
    features['hyphen_count'] = url.count('-')
    features['contains_ip'] = 1 if re.search(r'\d+\.\d+\.\d+\.\d+', url) else 0
    features['https'] = 1 if url.startswith('https') else 0
    features['shortener'] = 1 if any(short in url for short in ['bit.ly', 'tinyurl', 'goo.gl', 'ow.ly', 'is.gd', 'shorturl']) else 0
    features['special_char_count'] = len(re.findall(r'[^a-zA-Z0-9\.\-]', url))
    features['has_at'] = 1 if '@' in url else 0
    suspicious_words = ['secure', 'verify', 'account', 'login', 'update', 'confirm', 'bank', 'paypal', 'signin']
    features['suspicious_word_count'] = sum(1 for word in suspicious_words if word in url.lower())
    try:
        parsed = urlparse(url if '://' in url else 'http://' + url)
        domain = parsed.netloc or parsed.path.split('/')[0]
        features['domain_length'] = len(domain)
        features['subdomain_count'] = domain.count('.')
        tld = domain.split('.')[-1] if '.' in domain else ''
        risky_tlds = ['tk', 'ml', 'ga', 'cf', 'xyz', 'top', 'club', 'work', 'online', 'site', 'pw']
        features['risky_tld'] = 1 if tld in risky_tlds else 0
    except:
        features['domain_length'] = 0
        features['subdomain_count'] = 0
        features['risky_tld'] = 0
    return features

# Load dataset (handle filename with space)
df = pd.read_csv('Phishing URL.csv')   # ensure file name matches exactly

# Find URL and label columns
url_col = None
label_col = None
for col in df.columns:
    if col.lower() in ['url', 'address', 'domain']:
        url_col = col
    if col.lower() in ['label', 'result', 'class', 'type']:
        label_col = col

if url_col is None or label_col is None:
    raise ValueError("Could not find URL or label column. Check CSV headers.")

print(f"Using URL column: '{url_col}', label column: '{label_col}'")

urls = df[url_col].astype(str).tolist()
labels = df[label_col]

# Convert labels to binary if needed
if labels.dtype == 'object':
    label_map = {'phishing': 1, 'legitimate': 0, 'safe': 0, 'scam': 1, 'fraud': 1}
    labels = labels.map(label_map).fillna(0).astype(int)
else:
    labels = labels.astype(int)

# Extract features
feature_list = []
for url in urls:
    feature_list.append(extract_features(url))

X = pd.DataFrame(feature_list)
y = labels

# Ensure feature order (must match ai.py)
feature_order = ['length', 'dot_count', 'hyphen_count', 'contains_ip', 'https',
                 'shortener', 'special_char_count', 'has_at', 'suspicious_word_count',
                 'domain_length', 'subdomain_count', 'risky_tld']
X = X[feature_order]

print("Features extracted. Shape:", X.shape)

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Train Random Forest
clf = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
clf.fit(X_train, y_train)

# Evaluate
y_pred = clf.predict(X_test)
print("\nClassification Report:")
print(classification_report(y_test, y_pred))
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")

# Save model as PKL (for backend)
joblib.dump(clf, 'url_classifier.pkl')
print("Model saved as 'url_classifier.pkl'")

# (Optional) Save feature importances as CSV
importance_df = pd.DataFrame({
    'feature': feature_order,
    'importance': clf.feature_importances_
}).sort_values('importance', ascending=False)
importance_df.to_csv('feature_importance.csv', index=False)
print("Feature importances saved to 'feature_importance.csv'")