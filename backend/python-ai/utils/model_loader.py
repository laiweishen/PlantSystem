import tensorflow as tf
import json
import os


class ModelLoader:
    def __init__(self):
        self.species_model = None
        self.disease_model = None
        self.species_classes = None
        self.disease_classes = None

    def load_species_model(self, model_path, classes_path):
        """Load species classification model"""
        try:
            self.species_model = tf.keras.models.load_model(model_path)
            with open(classes_path, 'r') as f:
                self.species_classes = json.load(f)
            print("Species model loaded successfully")
        except Exception as e:
            print(f"Error loading species model: {str(e)}")

    def load_disease_model(self, model_path, classes_path):
        """Load disease detection model"""
        try:
            self.disease_model = tf.keras.models.load_model(model_path)
            with open(classes_path, 'r') as f:
                self.disease_classes = json.load(f)
            print("Disease model loaded successfully")
        except Exception as e:
            print(f"Error loading disease model: {str(e)}")

    def predict_species(self, preprocessed_image):
        """Predict plant species"""
        if self.species_model is None:
            raise ValueError("Species model not loaded")

        predictions = self.species_model.predict(preprocessed_image)
        predicted_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_idx])

        return {
            'species': self.species_classes[predicted_idx],
            'confidence': confidence,
            'all_predictions': {
                self.species_classes[i]: float(predictions[0][i])
                for i in range(len(self.species_classes))
            }
        }

    def predict_disease(self, preprocessed_image):
        """Predict plant disease"""
        if self.disease_model is None:
            raise ValueError("Disease model not loaded")

        predictions = self.disease_model.predict(preprocessed_image)
        predicted_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_idx])

        return {
            'disease': self.disease_classes[predicted_idx],
            'confidence': confidence,
            'is_healthy': 'healthy' in self.disease_classes[predicted_idx].lower()
        }


# Global model loader instance
model_loader = ModelLoader()
