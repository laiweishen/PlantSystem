from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import load_model
import cv2
import numpy as np
import json
import os
import re

# ===== Database Config =====
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',     
    'password': 'root123', 
    'database': 'plantiq'         
}

app = Flask(__name__)
CORS(app)

# ===== LOAD BOTH MODELS =====
# Stage 1: Plant Detector
PLANT_DETECTOR_PATH = 'ml_models/plant_detector/plant_detector.h5'

# Stage 2: Species Classifier  
SPECIES_MODEL_PATH = 'ml_models/plant_species/plant_species_fixed.h5' 
CLASS_NAMES_PATH = 'ml_models/plant_species/class_names.json'

DISEASE_MODEL_PATH = 'ml_models/disease_model/disease_model.h5' 
DISEASE_CLASSES_PATH = 'ml_models/disease_model/disease_classes.json'

print("📥 Loading Plant Detector (Stage 1)...")
plant_detector = load_model(PLANT_DETECTOR_PATH)

print("📥 Loading Species Model (Stage 2)...")
species_model = load_model(SPECIES_MODEL_PATH)

print(f"✅ Species model input shape: {species_model.input_shape}")
print(f"✅ Species model output shape: {species_model.output_shape}")



print("🦠 Loading Disease Model (Stage 3)...")
disease_model = load_model(DISEASE_MODEL_PATH)

with open(CLASS_NAMES_PATH, 'r') as f:
    class_names = json.load(f)

with open(DISEASE_CLASSES_PATH, 'r') as f:
    disease_classes = json.load(f)

print(f"✅ Models loaded successfully!")
print(f"🌿 Plant detector ready - will reject non-plant images")
print(f"🔍 Species classifier ready - {len(class_names)} plant classes")
print(f"🦠 Disease detector ready - {len(disease_classes)} disease classes") 

# ===== PLANT DETECTION CONFIG =====
PLANT_CONFIDENCE_THRESHOLD = 0.6  # 60% confidence to be considered a plant
SPECIES_CONFIDENCE_THRESHOLD = 0.1  # 40% confidence for species identification


print(f"🔍 Checking model file: {os.path.exists(SPECIES_MODEL_PATH)}")

# ===== TEST ENDPOINT FOR PLANT DETECTION =====
@app.route('/api/check-plant', methods=['POST'])
def check_plant_only():
    """Test endpoint: Only check if image is a plant"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400

        file = request.files['image']
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({'error': 'Invalid image file'}), 400

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_for_model = cv2.resize(img_rgb, (224, 224))
        img_for_model = img_for_model / 255.0
        img_for_model = np.expand_dims(img_for_model, axis=0)

        # Only stage 1
        plant_confidence = plant_detector.predict(img_for_model, verbose=0)[0][0]
        is_plant = plant_confidence >= PLANT_CONFIDENCE_THRESHOLD

        return jsonify({
            'success': True,
            'is_plant': bool(is_plant),
            'confidence': float(plant_confidence),
            'threshold': PLANT_CONFIDENCE_THRESHOLD,
            'message': 'This is a plant' if is_plant else 'This is not a plant'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Plant Recognition
@app.route('/api/recognize-plant', methods=['POST'])
def recognize_plant():
    """
    PLANT RECOGNITION ONLY:
    1. Check if image is a plant
    2. Identify plant species only
    """
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Read and preprocess image
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({'error': 'Invalid image file'}), 400

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_for_model = cv2.resize(img_rgb, (224, 224))
        img_for_model = img_for_model / 255.0
        img_for_model = np.expand_dims(img_for_model, axis=0)

        # ===== STAGE 1: PLANT DETECTION =====
        plant_confidence = plant_detector.predict(img_for_model, verbose=0)[0][0]
        is_plant = plant_confidence >= PLANT_CONFIDENCE_THRESHOLD

        print(f"🌿 Plant Recognition - Plant confidence: {plant_confidence:.3f}")

        if not is_plant:
            return jsonify({
                'success': False,
                'is_plant': False,
                'plant_confidence': float(plant_confidence),
                'message': 'This does not appear to be a plant image',
                'rejection_reason': 'low_plant_confidence'
            }), 400

        # ===== STAGE 2: SPECIES IDENTIFICATION ONLY =====
        print("🔍 Identifying plant species...")
        species_predictions = species_model.predict(img_for_model, verbose=0)
        species_idx = np.argmax(species_predictions[0])
        species_confidence = float(species_predictions[0][species_idx])
        plant = class_names[species_idx]

        # Check species confidence
        if species_confidence < SPECIES_CONFIDENCE_THRESHOLD:
            return jsonify({
                'success': False,
                'is_plant': True,
                'plant_confidence': float(plant_confidence),
                'species_confidence': species_confidence,
                'message': 'Plant detected but species not confidently identified',
                'detected_as': plant,
                'rejection_reason': 'low_species_confidence'
            }), 400

        # Get top 3 plant predictions
        top_3_species_idx = np.argsort(species_predictions[0])[-3:][::-1]
        top_species_predictions = []

        for idx in top_3_species_idx:
            top_species_predictions.append({
                'plant': class_names[idx],
                'confidence': float(species_predictions[0][idx])
            })

        # Get plant information (you can enhance this)
        plant_info = {
            'scientific_name': 'Not available',
            'family': 'Not specified', 
            'category': 'Not specified',
            'description': 'Plant information not available in database'
        }

        return jsonify({
            'success': True,
            'is_plant': True,
            'pipeline': 'plant_recognition_only',
            'plant_confidence': float(plant_confidence),
            'species_confidence': species_confidence,
            'prediction': {
                'plant': plant,
                'confidence': species_confidence,
            },
            'plant_information': plant_info,
            'alternative_predictions': top_species_predictions,
            'model_info': {
                'plant_species_classes': len(class_names),
                'pipeline_version': 'plant_recognition_1.0'
            }
        })

    except Exception as e:
        print(f"❌ Plant recognition error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict-disease', methods=['POST'])
def predict_disease():

    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400

        # Read and preprocess image
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return jsonify({'success': False, 'error': 'Invalid image file'}), 400

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_for_model = cv2.resize(img_rgb, (224, 224))
        img_for_model = img_for_model / 255.0
        img_for_model = np.expand_dims(img_for_model, axis=0)

        # === STEP 1: PLANT DETECTION ===
        plant_confidence = plant_detector.predict(img_for_model, verbose=0)[0][0]
        print(f"[DEBUG] Plant confidence: {plant_confidence:.3f}")

        is_plant = plant_confidence >= PLANT_CONFIDENCE_THRESHOLD
        print(f"[DEBUG] Is plant: {is_plant} (Threshold: {PLANT_CONFIDENCE_THRESHOLD})")

        print(f"🌱 Plant confidence: {plant_confidence:.3f}")

        if not is_plant:
            return jsonify({
                'success': False,
                'is_plant': False,
                'plant_confidence': float(plant_confidence),
                'message': 'This image does not appear to be a plant (or confidence too low).',
                'rejection_reason': 'not_a_plant'
            }), 400

        # === STEP 2: DISEASE DETECTION ===
        print("🦠 Plant detected, running disease detection...")
        disease_preds = disease_model.predict(img_for_model, verbose=0)
        print(f"[DEBUG] Disease model raw output: {disease_preds[0]}")

        disease_idx = np.argmax(disease_preds[0])
        disease_confidence = float(disease_preds[0][disease_idx])
        detected_disease = disease_classes[disease_idx]
        print(f"[DEBUG] Disease index: {disease_idx}, confidence: {disease_confidence:.3f}")

        print(f"[DEBUG] Disease classes list: {disease_classes}")
        detected_disease = disease_classes[disease_idx]
        print(f"[DEBUG] Predicted disease: {detected_disease}")

        result = {
            'success': True,
            'is_plant': True,
            'plant_confidence': float(plant_confidence),
            'prediction': {
                'disease': detected_disease,
                'confidence': disease_confidence,
                'plant': "Unknown",   # real value if your model predicts plant
                'is_healthy': detected_disease.lower() in ['healthy', 'no disease'],
                'symptoms': '',   # Fill with model info if available
                'severity': '',   # Or derive from confidence
                'treatment': '',
                'prevention': '',
                'pathogen': ''
            },
            'model_info': {
                'disease_classes': len(disease_classes),
                'pipeline_version': 'plant_check_first'
            }
        }
        return jsonify(result)

    except Exception as e:
        print(f"❌ Disease detection error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/debug-disease', methods=['POST'])
def debug_disease():
    """Debug disease model predictions"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400

        file = request.files['image']
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_for_model = cv2.resize(img_rgb, (224, 224))
        img_for_model = img_for_model / 255.0
        img_for_model = np.expand_dims(img_for_model, axis=0)

        # Get raw predictions
        disease_predictions = disease_model.predict(img_for_model, verbose=0)[0]
        
        # Get all predictions with details
        all_predictions = []
        for i, confidence in enumerate(disease_predictions):
            all_predictions.append({
                'disease': disease_classes[i],
                'confidence': float(confidence),
                'class_index': i
            })
        
        # Sort by confidence
        all_predictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        return jsonify({
            'success': True,
            'top_predictions': all_predictions[:5],
            'model_used': 'disease_model.h5 (85.68% trained)'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# All function together
@app.route('/api/full-analysis', methods=['POST'])
def full_analysis():
    """
    THREE-STAGE PREDICTION:
    1. First check if image is a plant
    2. Identify plant species
    3. Detect disease
    """
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Read and preprocess image
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({'error': 'Invalid image file'}), 400

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_for_model = cv2.resize(img_rgb, (224, 224))
        img_for_model = img_for_model / 255.0
        img_for_model = np.expand_dims(img_for_model, axis=0)

        # ===== STAGE 1: PLANT DETECTION =====
        plant_confidence = plant_detector.predict(img_for_model, verbose=0)[0][0]
        is_plant = plant_confidence >= PLANT_CONFIDENCE_THRESHOLD

        print(f"🔍 Stage 1 - Plant confidence: {plant_confidence:.3f} (Threshold: {PLANT_CONFIDENCE_THRESHOLD})")

        if not is_plant:
            return jsonify({
                'success': False,
                'is_plant': False,
                'plant_confidence': float(plant_confidence),
                'message': 'This does not appear to be a plant image',
                'suggestions': [
                    'Upload a clear photo of plant leaves',
                    'Ensure the plant is the main focus of the image',
                    'Avoid photos of animals, people, or objects',
                    'Try taking a closer photo of the leaves'
                ],
                'rejection_reason': 'low_plant_confidence'
            }), 400

        # ===== STAGE 2: SPECIES IDENTIFICATION =====
        print("🌿 Stage 2 - Identifying plant species...")
        species_predictions = species_model.predict(img_for_model, verbose=0)
        species_idx = np.argmax(species_predictions[0])
        species_confidence = float(species_predictions[0][species_idx])
        plant = class_names[species_idx]  # ⭐ DIRECT clean name like "Apple"

        # Check species confidence
        if species_confidence < SPECIES_CONFIDENCE_THRESHOLD:
            return jsonify({
                'success': False,
                'is_plant': True,
                'plant_confidence': float(plant_confidence),
                'species_confidence': species_confidence,
                'message': 'This appears to be a plant, but species could not be confidently identified',
                'suggestions': [
                    'Try a clearer photo of the leaves',
                    'Ensure good lighting',
                    'Focus on leaves with visible characteristics',
                    'Avoid blurry or distant photos'
                ],
                'detected_as': plant,
                'rejection_reason': 'low_species_confidence'
            }), 400

        # ===== STAGE 3: DISEASE DETECTION =====
        print("🦠 Stage 3 - Detecting diseases...")
        disease_predictions = disease_model.predict(img_for_model, verbose=0)
        disease_idx = np.argmax(disease_predictions[0])
        disease_confidence = float(disease_predictions[0][disease_idx])
        detected_disease = disease_classes[disease_idx]  # ⭐ DIRECT disease name

        is_healthy = detected_disease.lower() == 'healthy'
        disease_name = detected_disease

        # Get treatment and symptoms
        treatment_info = get_treatment_advice(plant, disease_name, is_healthy)
        symptoms = get_symptoms(disease_name, is_healthy)

        # Get top 3 predictions for both models
        top_3_species_idx = np.argsort(species_predictions[0])[-3:][::-1]
        top_species_predictions = []

        for idx in top_3_species_idx:
            top_species_predictions.append({
                'plant': class_names[idx],
                'confidence': float(species_predictions[0][idx])
            })

        top_3_disease_idx = np.argsort(disease_predictions[0])[-3:][::-1]
        top_disease_predictions = []

        for idx in top_3_disease_idx:
            top_disease_predictions.append({
                'disease': disease_classes[idx],
                'confidence': float(disease_predictions[0][idx])
            })

        # Determine severity based on disease confidence
        if disease_confidence > 0.85:
            severity = 'low' if is_healthy else 'high'
            confidence_level = 'very_high'
        elif disease_confidence > 0.70:
            severity = 'low' if is_healthy else 'medium'
            confidence_level = 'high'
        else:
            severity = 'low' if is_healthy else 'medium'
            confidence_level = 'medium'

        return jsonify({
            'success': True,
            'is_plant': True,
            'pipeline': 'three_stage_separate_models',  # ⭐ UPDATED
            'stage1_plant_confidence': float(plant_confidence),
            'stage2_species_confidence': species_confidence,  # ⭐ ADDED
            'stage3_disease_confidence': disease_confidence,  # ⭐ ADDED
            'prediction': {
                'plant': plant,
                'disease': disease_name,
                'is_healthy': is_healthy,
                'species_confidence': species_confidence,  # ⭐ SEPARATE
                'disease_confidence': disease_confidence,   # ⭐ SEPARATE
            },
            'health_assessment': {
                'status': 'healthy' if is_healthy else 'diseased',
                'severity': severity,
                'symptoms': symptoms,
                'confidence_level': confidence_level,
                'recommendation': 'Continue current care' if is_healthy else 'Treatment recommended'
            },
            'treatment_advice': treatment_info,
            'alternative_predictions': {
                'plant_species': top_species_predictions,   # ⭐ SEPARATE
                'diseases': top_disease_predictions         # ⭐ SEPARATE
            },
            'model_info': {
                'plant_species_classes': len(class_names),
                'disease_classes': len(disease_classes),
                'pipeline_version': '3.0_three_stage_separate',
                'plant_detector_used': True
            }
        })

    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        return jsonify({'error': 'Server busy, please try again'}), 503

@app.route('/api/health', methods=['GET'])
def health():
    """Enhanced health check"""
    return jsonify({
        'status': 'ok',
        'models_loaded': True,
        'pipeline': 'two_stage',
        'plant_detector': True,
        'species_classifier': True,
        'total_species_classes': len(class_names),
        'thresholds': {
            'plant_confidence': PLANT_CONFIDENCE_THRESHOLD,
            'species_confidence': SPECIES_CONFIDENCE_THRESHOLD
        }
    })


if __name__ == '__main__':
    print("🚀 Starting Enhanced PlantIQ Server with Two-Stage Pipeline...")
    app.run(host='0.0.0.0', port=5000, debug=True)