from flask import Blueprint, request, jsonify
from utils.image_preprocessing import preprocess_uploaded_file
from utils.model_loader import model_loader
import os
from werkzeug.utils import secure_filename

species_bp = Blueprint('species', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@species_bp.route('/classify', methods=['POST'])
def classify_species():
    """
    Endpoint to classify plant species
    POST /api/ai/species/classify
    Form-data: file (image)
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        # Preprocess image
        preprocessed_img = preprocess_uploaded_file(file.stream)

        # Predict
        result = model_loader.predict_species(preprocessed_img)

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@species_bp.route('/health', methods=['GET'])
def health_check():
    """Check if species model is loaded"""
    return jsonify({
        'status': 'ok' if model_loader.species_model is not None else 'not loaded',
        'model_loaded': model_loader.species_model is not None
    }), 200
