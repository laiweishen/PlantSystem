from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import load_model
import cv2
import numpy as np
import json
import os
import re

# ===== Use for Quiz =====
import random
import mysql.connector
from datetime import datetime

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',     
    'password': 'root123', 
    'database': 'plantiq'         
}

app = Flask(__name__)
CORS(app)

# Load your current mixed model
MODEL_PATH = 'ml_models/plant_species/plant_model.h5'
CLASS_NAMES_PATH = 'ml_models/plant_species/class_names.json'

model = load_model(MODEL_PATH)

with open(CLASS_NAMES_PATH, 'r') as f:
    class_names = json.load(f)


# Enhanced parser for your specific class names
def parse_plant_disease(full_name):
    """
    Parse full class name into plant and disease components
    Handles special cases like 'Cherry_(including_sour)' and 'Corn_(maize)'
    """
    if '___' in full_name:
        plant, disease = full_name.split('___', 1)

        # Clean up plant names
        plant = clean_plant_name(plant)

        # Check if healthy
        is_healthy = disease.lower() == 'healthy'

        # Format disease name for display
        disease_display = clean_disease_name(disease)

        return plant, disease_display, is_healthy
    else:
        # If no disease info, assume it's a healthy plant
        return clean_plant_name(full_name), "Healthy", True


def clean_plant_name(plant):
    """Clean and format plant names"""
    # Remove parentheses content for display
    plant = re.sub(r'\([^)]*\)', '', plant).strip()
    # Remove trailing underscores and commas
    plant = plant.rstrip('_, ').strip()
    # Capitalize properly
    return plant.title()


def clean_disease_name(disease):
    """Clean and format disease names"""
    if disease.lower() == 'healthy':
        return 'Healthy'

    # Replace underscores with spaces and title case
    disease = disease.replace('_', ' ').title()
    # Fix specific cases
    disease = disease.replace('Leaf Blight', 'Leaf Blight')
    disease = disease.replace('Leaf Spot', 'Leaf Spot')
    disease = disease.replace('Bacterial Spot', 'Bacterial Spot')
    disease = disease.replace('Powdery Mildew', 'Powdery Mildew')
    disease = disease.replace('Common Rust', 'Common Rust')
    disease = disease.replace('Black Rot', 'Black Rot')

    return disease


def get_treatment_advice(plant, disease, is_healthy):
    """Get treatment advice based on plant and disease"""
    if is_healthy:
        return {
            'treatment': 'No treatment needed - plant is healthy and thriving',
            'prevention': 'Continue proper watering, fertilization, and regular monitoring',
            'care_tips': [
                'Water regularly based on plant needs',
                'Provide adequate sunlight exposure',
                'Monitor for any changes in plant health',
                'Fertilize according to plant requirements'
            ]
        }

    # Enhanced treatment database for your specific plants
    treatment_db = {
        'Apple': {
            'Apple Scab': {
                'treatment': 'Apply fungicide in early spring (sulfur or myclobutanil), remove infected leaves and fruit, improve air circulation',
                'prevention': 'Plant resistant varieties, rake and destroy fallen leaves, prune for better air flow',
                'care_tips': [
                    'Apply fungicide before rainy periods',
                    'Prune trees to allow sunlight penetration',
                    'Remove infected fruit from ground',
                    'Avoid overhead watering'
                ],
                'urgency': 'medium'
            },
            'Black Rot': {
                'treatment': 'Prune infected branches 6-8 inches below cankers, apply copper-based fungicide, remove mummified fruit',
                'prevention': 'Practice good sanitation, remove dead wood, avoid wounding trees',
                'care_tips': [
                    'Disinfect pruning tools between cuts',
                    'Remove all infected plant material',
                    'Apply fungicide during bloom period',
                    'Monitor for fire blight symptoms'
                ],
                'urgency': 'high'
            },
            'Cedar Apple Rust': {
                'treatment': 'Apply fungicide (myclobutanil or triadimefon), remove galls from nearby junipers if possible',
                'prevention': 'Remove nearby juniper plants (within 2 miles if practical), plant resistant varieties',
                'care_tips': [
                    'Apply fungicide in early spring before symptoms appear',
                    'Monitor juniper plants nearby for orange gelatinous growth',
                    'Plant resistant apple varieties like "Freedom" or "Liberty"',
                    'Time fungicide applications with spring rainfall'
                ],
                'urgency': 'medium'
            }
        },
        'Blueberry': {
            'Healthy': {
                'treatment': 'No treatment needed',
                'prevention': 'Maintain acidic soil (pH 4.5-5.5), provide adequate moisture',
                'care_tips': [
                    'Test soil pH regularly',
                    'Use acidic mulch like pine needles',
                    'Prune old canes annually',
                    'Protect fruit from birds with netting'
                ],
                'urgency': 'none'
            }
        },
        'Cherry': {
            'Powdery Mildew': {
                'treatment': 'Apply sulfur or potassium bicarbonate fungicide, improve air circulation, remove severely infected leaves',
                'prevention': 'Plant in full sun, ensure good air circulation, avoid overhead watering',
                'care_tips': [
                    'Prune to open canopy for better air flow',
                    'Apply fungicide at first sign of white powder',
                    'Water at base of plant early in day',
                    'Remove fallen leaves in autumn'
                ],
                'urgency': 'medium'
            }
        },
        'Corn': {
            'Cercospora Leaf Spot Gray Leaf Spot': {
                'treatment': 'Apply fungicide (azoxystrobin or pyraclostrobin), remove crop debris after harvest',
                'prevention': 'Rotate crops, plant resistant hybrids, ensure proper spacing',
                'care_tips': [
                    'Rotate with non-grass crops for 2 years',
                    'Use resistant hybrids',
                    'Avoid working in field when plants are wet',
                    'Destroy infected crop residue after harvest'
                ],
                'urgency': 'medium'
            },
            'Common Rust': {
                'treatment': 'Apply fungicide if detected early (before silking), remove severely infected leaves if practical',
                'prevention': 'Plant resistant hybrids, avoid late planting, ensure proper nutrition',
                'care_tips': [
                    'Monitor plants regularly during humid weather',
                    'Remove volunteer corn plants',
                    'Ensure adequate potassium levels in soil',
                    'Plant early-maturing varieties'
                ],
                'urgency': 'low'
            },
            'Northern Leaf Blight': {
                'treatment': 'Apply fungicide, remove crop debris, improve air circulation',
                'prevention': 'Rotate crops, till soil after harvest, use resistant varieties',
                'care_tips': [
                    'Destroy infected crop residue',
                    'Use resistant hybrids',
                    'Avoid high nitrogen fertilization',
                    'Ensure proper plant spacing'
                ],
                'urgency': 'medium'
            }
        },
        'Grape': {
            'Black Rot': {
                'treatment': 'Apply fungicide (mancozeb or captan), remove infected fruit and leaves, improve air circulation',
                'prevention': 'Prune properly, remove mummies, position rows with prevailing winds',
                'care_tips': [
                    'Prune to open canopy for better air flow',
                    'Remove and destroy all infected fruit',
                    'Apply fungicide from pre-bloom through 4-6 weeks after bloom',
                    'Train vines on trellis for better air circulation'
                ],
                'urgency': 'high'
            },
            'Esca Black Measles': {
                'treatment': 'Prune infected wood well below symptoms, protect pruning wounds, maintain plant vigor',
                'prevention': 'Avoid mechanical injury, disinfect pruning tools, maintain balanced nutrition',
                'care_tips': [
                    'Make clean pruning cuts',
                    'Protect large wounds with pruning sealant',
                    'Avoid stress from drought or waterlogging',
                    'Remove and destroy severely infected vines'
                ],
                'urgency': 'high'
            },
            'Leaf Blight Isariopsis Leaf Spot': {
                'treatment': 'Apply copper-based fungicide, remove severely infected leaves, improve air circulation',
                'prevention': 'Prune properly, avoid overhead irrigation, remove fallen leaves',
                'care_tips': [
                    'Prune to improve air movement through canopy',
                    'Remove basal leaves early in season',
                    'Apply fungicide before expected rainfall',
                    'Monitor lower leaves regularly'
                ],
                'urgency': 'medium'
            }
        },
        'Orange': {
            'Haunglongbing Citrus Greening': {
                'treatment': 'Remove infected trees, control Asian citrus psyllid vector, provide optimal nutrition',
                'prevention': 'Use certified disease-free plants, monitor for psyllids, remove infected trees promptly',
                'care_tips': [
                    'Monitor for yellow shoots and mottled leaves',
                    'Control psyllids with approved insecticides',
                    'Provide balanced nutrition to maintain tree health',
                    'Remove infected trees to prevent spread'
                ],
                'urgency': 'critical'
            }
        },
        'Peach': {
            'Bacterial Spot': {
                'treatment': 'Apply copper bactericide, improve air circulation, remove severely infected leaves',
                'prevention': 'Plant resistant varieties, avoid overhead irrigation, ensure proper spacing',
                'care_tips': [
                    'Plant in full sun with good air movement',
                    'Avoid working with trees when wet',
                    'Apply dormant copper spray before bud swell',
                    'Use drip irrigation instead of overhead'
                ],
                'urgency': 'medium'
            }
        },
        'Pepper': {
            'Bacterial Spot': {
                'treatment': 'Apply copper-based bactericide, remove infected plants if severe, avoid working when wet',
                'prevention': 'Use disease-free seed, rotate crops, avoid overhead watering',
                'care_tips': [
                    'Water at base of plants early in day',
                    'Space plants for good air circulation',
                    'Remove and destroy severely infected plants',
                    'Disinfect tools between plants'
                ],
                'urgency': 'medium'
            }
        }
    }

    # Default response if plant/disease not found
    default_advice = {
        'treatment': f'Remove affected parts and apply appropriate treatment. For {disease} on {plant}, consult local agricultural extension for specific recommendations.',
        'prevention': 'Maintain plant health, improve air circulation, practice crop rotation, monitor regularly',
        'care_tips': [
            'Remove and destroy infected plant material',
            'Avoid overhead watering to reduce leaf wetness',
            'Ensure proper plant spacing for air flow',
            'Monitor plants weekly for early detection'
        ],
        'urgency': 'medium'
    }

    plant_advice = treatment_db.get(plant, {})
    return plant_advice.get(disease, default_advice)


def get_symptoms(disease, is_healthy):
    """Get symptoms description for disease"""
    if is_healthy:
        return "No symptoms - plant appears healthy with normal growth and coloration"

    symptoms_db = {
        'Apple Scab': 'Olive-green to black spots on leaves and fruit, leaves may yellow and drop prematurely, corky lesions on fruit',
        'Black Rot': 'Brown spots on leaves with concentric rings, purple to black cankers on branches, mummified fruit that remains on tree',
        'Cedar Apple Rust': 'Yellow-orange spots on upper leaf surfaces, gelatinous orange horns on junipers in spring',
        'Powdery Mildew': 'White powdery coating on leaves and stems, leaf distortion and curling, reduced plant vigor',
        'Cercospora Leaf Spot Gray Leaf Spot': 'Rectangular, gray to tan lesions on leaves bounded by leaf veins, may cause significant defoliation',
        'Common Rust': 'Reddish-brown pustules on both leaf surfaces that break through epidermis, may turn black later in season',
        'Northern Leaf Blight': 'Long, gray-green lesions on leaves that turn brown and may coalesce, starting on lower leaves',
        'Black Rot': 'Brown spots on leaves with black pycnidia, shrinking and mummifying of berries, can affect entire clusters',
        'Esca Black Measles': 'Tiger-striping pattern on leaves, wood decay inside trunks and arms, reduced vigor and yield',
        'Leaf Blight Isariopsis Leaf Spot': 'Angular red-brown spots on leaves with yellow halos, may cause severe defoliation',
        'Haunglongbing Citrus Greening': 'Yellow shoots, blotchy mottled leaves, small misshapen fruit, bitter taste',
        'Bacterial Spot': 'Water-soaked lesions on leaves that become angular and brown, raised scabby spots on fruit',
    }

    return symptoms_db.get(disease,
                           'Abnormal discoloration, spots, or growth patterns on leaves, stems, or fruit. Monitor plant for changes in appearance or vigor.')

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

@app.route('/api/smart-predict', methods=['POST'])
def smart_predict():
    """
    Smart prediction that returns both plant and disease information
    from your mixed model
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

        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (224, 224))
        img = img / 255.0
        img = np.expand_dims(img, axis=0)

        # Get predictions
        predictions = model.predict(img, verbose=0)
        predicted_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_idx]) * 100

        # Parse the main prediction
        full_prediction = class_names[predicted_idx]
        plant, disease, is_healthy = parse_plant_disease(full_prediction)

        # Get top 3 predictions with parsed information
        top_3_idx = np.argsort(predictions[0])[-3:][::-1]
        top_predictions = []

        for idx in top_3_idx:
            top_full_name = class_names[idx]
            top_plant, top_disease, top_healthy = parse_plant_disease(top_full_name)
            top_confidence = float(predictions[0][idx]) * 100

            top_predictions.append({
                'plant': top_plant,
                'disease': top_disease,
                'is_healthy': top_healthy,
                'confidence': top_confidence,
                'full_prediction': top_full_name
            })

        # Get additional information
        treatment_info = get_treatment_advice(plant, disease, is_healthy)
        symptoms = get_symptoms(disease, is_healthy)

        # Determine severity and confidence level
        if confidence > 85:
            severity = 'low' if is_healthy else 'high'
            confidence_level = 'very_high'
        elif confidence > 70:
            severity = 'low' if is_healthy else 'medium'
            confidence_level = 'high'
        elif confidence > 50:
            severity = 'low' if is_healthy else 'medium'
            confidence_level = 'medium'
        else:
            severity = 'unknown'
            confidence_level = 'low'

        return jsonify({
            'success': True,
            'prediction': {
                'plant': plant,
                'disease': disease,
                'is_healthy': is_healthy,
                'confidence': confidence,
                'full_prediction': full_prediction
            },
            'health_assessment': {
                'status': 'healthy' if is_healthy else 'diseased',
                'severity': severity,
                'symptoms': symptoms,
                'confidence_level': confidence_level,
                'recommendation': 'Continue current care' if is_healthy else 'Treatment recommended'
            },
            'treatment_advice': treatment_info,
            'alternative_predictions': top_predictions,
            'model_info': {
                'total_classes': len(class_names),
                'api_version': '1.1'
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/plant-disease-info', methods=['GET'])
def get_plant_disease_info():
    """Get information about all available plant-disease combinations"""
    plants = {}

    for full_name in class_names:
        plant, disease, is_healthy = parse_plant_disease(full_name)

        if plant not in plants:
            plants[plant] = {
                'diseases': [],
                'healthy_available': False,
                'total_variants': 0
            }

        disease_info = {
            'name': disease,
            'is_healthy': is_healthy,
            'full_class_name': full_name
        }

        plants[plant]['diseases'].append(disease_info)
        plants[plant]['total_variants'] += 1

        if is_healthy:
            plants[plant]['healthy_available'] = True

    # Sort plants and their diseases
    sorted_plants = {}
    for plant in sorted(plants.keys()):
        plants[plant]['diseases'] = sorted(plants[plant]['diseases'], key=lambda x: (not x['is_healthy'], x['name']))
        sorted_plants[plant] = plants[plant]

    return jsonify({
        'success': True,
        'total_combinations': len(class_names),
        'plants': sorted_plants
    })

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model_loaded': True,
        'total_classes': len(class_names),
        'api_type': 'smart_mixed_model',
        'description': 'Using mixed plant-disease model with enhanced parsing',
        'supported_plants': ['Apple', 'Blueberry', 'Cherry', 'Corn', 'Grape', 'Orange', 'Peach', 'Pepper']
    })

@app.route('/api/classes', methods=['GET'])
def get_classes():
    """Get all available classes (for backward compatibility)"""
    return jsonify({
        'success': True,
        'classes': class_names,
        'total': len(class_names)
    })


@app.route('/api/quiz/generate-auto', methods=['POST'])
def generate_auto_quiz():
    """Generate automatic quiz from plant/disease data"""
    try:
        data = request.json
        quiz_type = data.get('quizType', 'plant')
        num_questions = data.get('numQuestions', 10)
        
        # Extract unique plants or diseases based on quiz type
        if quiz_type == 'plant':
            unique_items = extract_unique_plants(class_names)
            question_text_template = "Identify this plant:"
        else:
            unique_items = extract_unique_diseases(class_names)
            question_text_template = "Identify this plant disease:"
        
        questions = []
        
        for i in range(num_questions):
            if len(unique_items) < 4:
                break  # Need at least 4 items for multiple choice
                
            correct_answer = random.choice(unique_items)
            wrong_options = [item for item in unique_items if item != correct_answer]
            selected_wrong = random.sample(wrong_options, min(3, len(wrong_options)))
            
            all_options = [correct_answer] + selected_wrong
            random.shuffle(all_options)
            
            # Create options object with letters A, B, C, D
            options_dict = {
                'A': all_options[0],
                'B': all_options[1], 
                'C': all_options[2],
                'D': all_options[3]
            }
            
            # Find the correct answer letter
            correct_letter = None
            for letter, option_text in options_dict.items():
                if option_text == correct_answer:
                    correct_letter = letter
                    break
            
            questions.append({
                'id': i + 1,
                'questionText': question_text_template,
                'imageUrl': f'/api/quiz/image/{quiz_type}/{correct_answer.lower().replace(" ", "-")}',
                'options': options_dict,  # Changed to object format
                'correctAnswer': correct_answer,
                'correctAnswerLetter': correct_letter,  # Store the letter
                'difficulty': random.randint(1, 3)
            })
        
        return jsonify({
            'success': True,
            'quizType': quiz_type,
            'questions': questions,
            'total': len(questions)
        })
        
    except Exception as e:
        print(f"❌ Auto quiz generation error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/quiz/submit', methods=['POST'])
def submit_quiz():
    """Submit quiz answers and calculate score"""
    try:
        data = request.json
        quiz_type = data.get('quizType')
        answers = data.get('answers', [])
        user_id = get_user_id_from_token(request)  # You'll need to implement this
        
        print(f"📊 Processing quiz submission: {quiz_type}")
        print(f"📝 Answers received: {len(answers)}")
        
        # Calculate score
        correct_count = 0
        results = []
        
        for answer in answers:
            question_id = answer.get('questionId')
            user_answer = answer.get('userAnswer')
            correct_answer = answer.get('correctAnswer')
            
            is_correct = user_answer == correct_answer
            
            if is_correct:
                correct_count += 1
                
            results.append({
                'questionId': question_id,
                'userAnswer': user_answer,
                'correctAnswer': correct_answer,
                'isCorrect': is_correct
            })
        
        total_questions = len(answers)
        percentage = round((correct_count / total_questions) * 100) if total_questions > 0 else 0
        
        print(f"🎯 Score: {correct_count}/{total_questions} ({percentage}%)")
        
        # Save to database
        quiz_result_id = save_quiz_results(user_id, quiz_type, correct_count, total_questions)
        save_quiz_result_details(quiz_result_id, results)
        
        return jsonify({
            'success': True,
            'score': correct_count,
            'total': total_questions,
            'percentage': percentage,
            'results': results,
            'quizResultId': quiz_result_id,
            'message': f'You scored {correct_count}/{total_questions} ({percentage}%)'
        })
        
    except Exception as e:
        print(f"❌ Quiz submission error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

def extract_unique_plants(class_names):
    """Extract unique plant names from class names"""
    plants = set()
    for name in class_names:
        if '___' in name:
            plant = name.split('___')[0]
            plant = clean_plant_name(plant)
            plants.add(plant)
    return list(plants)

def extract_unique_diseases(class_names):
    """Extract unique disease names from class names"""
    diseases = set()
    for name in class_names:
        if '___' in name:
            disease = name.split('___')[1]
            if disease.lower() != 'healthy':
                disease = clean_disease_name(disease)
                diseases.add(disease)
    return list(diseases)

def save_quiz_results(user_id, quiz_type, score, total_questions):
    """Save quiz results to database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        INSERT INTO quizresults (UserId, QuizType, Score, TotalQuestions, CompletedAt)
        VALUES (%s, %s, %s, %s, %s)
        """
        completed_at = datetime.now()
        
        cursor.execute(query, (user_id, quiz_type, score, total_questions, completed_at))
        conn.commit()
        
        quiz_result_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        print(f"✅ Quiz results saved with ID: {quiz_result_id}")
        return quiz_result_id
        
    except Exception as e:
        print(f"❌ Error saving quiz results: {str(e)}")
        raise e

def save_quiz_result_details(quiz_result_id, results):
    """Save individual question results to database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        INSERT INTO quizresultdetails (QuizResultId, QuestionId, QuestionText, ImageUrl, UserAnswer, CorrectAnswer, IsCorrect)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        for result in results:
            cursor.execute(query, (
                quiz_result_id,
                result['questionId'],
                "Identify this plant/disease",  # You might want to store the actual question text
                "",  # Image URL if available
                result['userAnswer'],
                result['correctAnswer'],
                1 if result['isCorrect'] else 0
            ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Saved {len(results)} quiz result details")
        
    except Exception as e:
        print(f"❌ Error saving quiz result details: {str(e)}")
        raise e

def get_user_id_from_token(request):
    """Extract user ID from JWT token (you'll need to implement this based on your auth system)"""
    # This is a placeholder - implement based on your authentication system
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    # For now, return a dummy user ID
    # In production, decode the JWT token and extract user_id
    return 1  # Replace with actual user ID extraction

@app.route('/api/quiz/history', methods=['GET'])
def get_quiz_history():
    """Get quiz history for a user"""
    try:
        user_id = get_user_id_from_token(request)
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT qr.Id, qr.QuizType, qr.Score, qr.TotalQuestions, qr.CompletedAt,
               COUNT(qrd.Id) as TotalAnswered
        FROM quizresults qr
        LEFT JOIN quizresultdetails qrd ON qr.Id = qrd.QuizResultId
        WHERE qr.UserId = %s
        GROUP BY qr.Id
        ORDER BY qr.CompletedAt DESC
        LIMIT 20
        """
        
        cursor.execute(query, (user_id,))
        history = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'history': history
        })
        
    except Exception as e:
        print(f"❌ Error fetching quiz history: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/quiz/results/<int:quiz_result_id>', methods=['GET'])
def get_quiz_result_details(quiz_result_id):
    """Get detailed results for a specific quiz"""
    try:
        user_id = get_user_id_from_token(request)
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get main quiz result
        cursor.execute("""
        SELECT * FROM quizresults 
        WHERE Id = %s AND UserId = %s
        """, (quiz_result_id, user_id))
        
        quiz_result = cursor.fetchone()
        
        if not quiz_result:
            return jsonify({'success': False, 'error': 'Quiz result not found'}), 404
        
        # Get detailed results
        cursor.execute("""
        SELECT * FROM quizresultdetails 
        WHERE QuizResultId = %s
        ORDER BY Id
        """, (quiz_result_id,))
        
        details = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'quizResult': quiz_result,
            'details': details
        })
        
    except Exception as e:
        print(f"❌ Error fetching quiz details: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


