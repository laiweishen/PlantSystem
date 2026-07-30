from flask import Blueprint, request, jsonify
from utils.image_preprocessing import preprocess_uploaded_file
from utils.model_loader import model_loader

disease_bp = Blueprint('disease', __name__)


@disease_bp.route('/detect', methods=['POST'])
def detect_disease():
    """
    Endpoint to detect plant disease
    POST /api/ai/disease/detect
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        preprocessed_img = preprocess_uploaded_file(file.stream)
        result = model_loader.predict_disease(preprocessed_img)

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
