import re
import joblib
import numpy as np
from urllib.parse import urlparse

# ---------- URL Feature Extractor (must match training order) ----------
def extract_url_features(url):
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

# Load trained URL model (if exists)
try:
    url_model = joblib.load('url_classifier.pkl')
    print("URL model loaded successfully")
except:
    url_model = None
    print("URL model not found, using fallback heuristics")

# ---------- Text‑based scam detector (rule‑based) ----------
class TextScamDetector:
    KEYWORDS = {
        'urgency': ['urgent', 'immediately', 'asap', 'act now', 'limited time', 'deadline', 'expire'],
        'authority': ['bank', 'official', 'government', 'irs', 'police', 'ceo', 'manager', 'support'],
        'greed': ['money', 'prize', 'win', 'free', 'reward', 'cash', 'credit', 'refund', 'inheritance'],
        'links': ['click here', 'bit.ly', 'tinyurl', 'http', 'www.']
    }
    weights = {'urgency': 0.3, 'authority': 0.25, 'greed': 0.3, 'links': 0.15}

    def _score_text(self, text, keywords):
        text_lower = text.lower()
        count = sum(1 for kw in keywords if kw in text_lower)
        return min(count / len(keywords), 1.0)

    def analyze(self, message):
        scores = {}
        for cat, kw_list in self.KEYWORDS.items():
            scores[cat] = self._score_text(message, kw_list)
        risk = sum(scores[cat] * self.weights[cat] for cat in self.KEYWORDS) * 100
        classification = "Scam" if risk > 40 else "Safe"
        indicators = {}
        for cat, score in scores.items():
            if score >= 0.7:
                indicators[cat] = "high"
            elif score >= 0.3:
                indicators[cat] = "medium"
            else:
                indicators[cat] = "low"
        return {
            "classification": classification,
            "risk_score": round(risk, 1),
            "indicators": indicators
        }

# ---------- URL scam detector (ML or fallback) ----------
class URLScamDetector:
    def __init__(self, model=None):
        self.model = model
        self.feature_order = ['length', 'dot_count', 'hyphen_count', 'contains_ip', 'https',
                              'shortener', 'special_char_count', 'has_at', 'suspicious_word_count',
                              'domain_length', 'subdomain_count', 'risky_tld']

    def analyze(self, url):
        if self.model is None:
            # Fallback heuristics
            risk = 0
            if any(short in url for short in ['bit.ly', 'tinyurl']):
                risk += 30
            if re.search(r'\d+\.\d+\.\d+\.\d+', url):
                risk += 40
            if url.count('.') > 3:
                risk += 20
            classification = "Scam" if risk > 50 else "Safe"
            indicators = {
                'url_structure': 'high' if url.count('.') > 3 else 'low',
                'shortener': 'high' if any(short in url for short in ['bit.ly', 'tinyurl']) else 'low',
                'ip_address': 'high' if re.search(r'\d+\.\d+\.\d+\.\d+', url) else 'low',
            }
            return {
                "classification": classification,
                "risk_score": min(risk, 100),
                "indicators": indicators
            }
        # Use ML model
        features = extract_url_features(url)
        X = np.array([features[f] for f in self.feature_order]).reshape(1, -1)
        proba = self.model.predict_proba(X)[0]
        scam_prob = proba[1]  # assuming label 1 = scam
        risk = int(scam_prob * 100)
        classification = "Scam" if risk > 50 else "Safe"
        # Generate indicator levels from features
        indicators = {
            'ip_address': 'high' if features['contains_ip'] else 'low',
            'shortener': 'high' if features['shortener'] else 'low',
            'suspicious_words': 'high' if features['suspicious_word_count'] > 0 else 'low',
            'risky_tld': 'high' if features['risky_tld'] else 'low',
            'url_length': 'high' if features['length'] > 75 else 'low'
        }
        return {
            "classification": classification,
            "risk_score": risk,
            "indicators": indicators
        }

# ---------- Combined detector (routes to appropriate sub‑detector) ----------
class ScamDetector:
    def __init__(self):
        self.text_detector = TextScamDetector()
        self.url_detector = URLScamDetector(model=url_model)

    def analyze(self, message):
        # Check if message contains a URL
        urls = re.findall(r'(https?://[^\s]+)', message)
        if urls:
            # Use the first URL for analysis
            url = urls[0]
            result = self.url_detector.analyze(url)
            # Map 'shortener' to 'links' for consistency with frontend
            result['indicators']['links'] = result['indicators'].get('shortener', 'low')
            return result
        else:
            return self.text_detector.analyze(message)