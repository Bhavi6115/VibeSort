from flask import Flask, request, jsonify
from flask_cors import CORS
from ai import ScamDetector

app = Flask(__name__)
CORS(app)  # allow cross‑origin requests from React

detector = ScamDetector()
history = []  # simple in‑memory storage (replace with DB in production)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    message = data.get('message', '')
    if not message:
        return jsonify({'error': 'No message provided'}), 400

    result = detector.analyze(message)
    # store in history (last 20 entries)
    history.append({
        'message': message,
        'result': result
    })
    if len(history) > 20:
        history.pop(0)
    return jsonify(result)

@app.route('/history', methods=['GET'])
def get_history():
    return jsonify(history)

if __name__ == '__main__':
    app.run(debug=True, port=5000)