from flask import Flask, jsonify
from flask_cors import CORS
from routes.species_routes import species_bp
from routes.disease_routes import disease_bp
from utils.model_loader import model_loader
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create upload folder if not exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load models on startup
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'ml_models')

try:
    model_loader.load_species_model(
        os.path.join(MODELS_DIR, 'plant_species', 'best_model.h5'),
        os.path.join(MODELS_DIR, 'plant_species', 'class_names.json')
    )
    model_loader.load_disease_model(
        os.path.join(MODELS_DIR, 'plant_disease', 'best_model.h5'),
        os.path.join(MODELS_DIR, 'plant_disease', 'class_names.json')
    )
except Exception as e:
    print(f"Warning: Could not load models - {str(e)}")

# Register blueprints
app.register_blueprint(species_bp, url_prefix='/api/ai/species')
app.register_blueprint(disease_bp, url_prefix='/api/ai/disease')

@app.route('/api/ai/health', methods=['GET'])
def health():
    """Overall health check"""
    return jsonify({
        'status': 'ok',
        'service': 'Plant AI API',
        'version': '1.0.0'
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
