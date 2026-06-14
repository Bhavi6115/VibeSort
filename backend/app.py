from flask import Flask, request, jsonify
from flask_cors import CORS
from ai import ScamDetector
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

detector = ScamDetector()

history = []


@app.route("/")
def home():
    return jsonify({
        "message": "ScamShield AI Backend Running 🚀"
    })


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No data received"
        }), 400

    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "error": "No message provided"
        }), 400

    try:
        result = detector.analyze(message)

        history.append({
            "message": message,
            "result": result
        })

        if len(history) > 50:
            history.pop(0)

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/history", methods=["GET"])
def get_history():
    return jsonify(history[::-1])


@app.route("/clear-history", methods=["POST"])
def clear_history():
    history.clear()

    return jsonify({
        "message": "History cleared successfully"
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )