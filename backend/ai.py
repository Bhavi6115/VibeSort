import re
import numpy as numpy
from urllib.parse import urlparse

# ---------------- URL Feature Extractor ---------------- #

def extract_url_features(url):
    features = {}

    features['length'] = len(url)
    features['dot_count'] = url.count('.')
    features['hyphen_count'] = url.count('-')
    features['contains_ip'] = 1 if re.search(r'\d+\.\d+\.\d+\.\d+', url) else 0
    features['https'] = 1 if url.startswith('https') else 0

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
        re.findall(r'[^a-zA-Z0-9\.\-]', url)
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
            url if '://' in url else 'http://' + url
        )

        domain = parsed.netloc or parsed.path.split('/')[0]

        features['domain_length'] = len(domain)
        features['subdomain_count'] = domain.count('.')

        tld = domain.split('.')[-1] if '.' in domain else ''

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

        features['risky_tld'] = 1 if tld in risky_tlds else 0

    except:
        features['domain_length'] = 0
        features['subdomain_count'] = 0
        features['risky_tld'] = 0

    return features


# Disable broken model temporarily
url_model = None

print("Using heuristic URL detector")


# ---------------- Text Detector ---------------- #

class TextScamDetector:

    KEYWORDS = {
        'urgency': [
            'urgent',
            'immediately',
            'asap',
            'act now',
            'limited time',
            'deadline',
            'expire'
        ],
        'authority': [
            'bank',
            'official',
            'government',
            'irs',
            'police',
            'ceo',
            'manager',
            'support'
        ],
        'greed': [
            'money',
            'prize',
            'win',
            'free',
            'reward',
            'cash',
            'credit',
            'refund',
            'inheritance'
        ],
        'links': [
            'click here',
            'bit.ly',
            'tinyurl',
            'http',
            'www.'
        ]
    }

    weights = {
        'urgency': 0.3,
        'authority': 0.25,
        'greed': 0.3,
        'links': 0.15
    }

    def _score_text(self, text, keywords):
        text = text.lower()

        count = sum(
            1 for keyword in keywords
            if keyword in text
        )

        return min(count / len(keywords), 1)

    def analyze(self, message):

        scores = {}

        for category, words in self.KEYWORDS.items():
            scores[category] = self._score_text(
                message,
                words
            )

        risk = (
            sum(
                scores[c] * self.weights[c]
                for c in self.KEYWORDS
            ) * 100
        )

        classification = (
            "Scam" if risk >= 40 else "Safe"
        )

        indicators = {}

        for category, score in scores.items():

            if score >= 0.7:
                indicators[category] = "high"

            elif score >= 0.3:
                indicators[category] = "medium"

            else:
                indicators[category] = "low"

        return {
            "classification": classification,
            "risk_score": round(risk, 1),
            "indicators": indicators
        }


# ---------------- URL Detector ---------------- #

class URLScamDetector:

    def analyze(self, url):

        risk = 0

        if any(
            short in url
            for short in ['bit.ly', 'tinyurl']
        ):
            risk += 40

        if re.search(
            r'\d+\.\d+\.\d+\.\d+',
            url
        ):
            risk += 40

        if url.count('.') > 3:
            risk += 20

        classification = (
            "Scam" if risk >= 50 else "Safe"
        )

        return {
            "classification": classification,
            "risk_score": min(risk, 100),
            "indicators": {
                "urgency": "low",
                "authority": "low",
                "greed": "low",
                "links": "high" if risk > 0 else "low"
            }
        }


# ---------------- Main Detector ---------------- #

class ScamDetector:

    def __init__(self):
        self.text_detector = TextScamDetector()
        self.url_detector = URLScamDetector()

    def analyze(self, message):

        urls = re.findall(
            r'(https?://[^\s]+)',
            message
        )

        if urls:
            return self.url_detector.analyze(urls[0])

        return self.text_detector.analyze(message)