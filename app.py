from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/candidates')
def candidates():
    return [
        {
            "_id": "1",
            "name": "Rahul",
            "party": "ABC Party",
            "votes": 0,
            "symbol": "https://via.placeholder.com/50"
        }
    ]

app.run(debug=True)