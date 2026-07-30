from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

@app.route('/')
def home():
    return {'message': 'PlantSystem Backend is running!', 'status': 'success'}

@app.route('/api/test')
def test():
    return {'data': 'Backend API is working!'}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)