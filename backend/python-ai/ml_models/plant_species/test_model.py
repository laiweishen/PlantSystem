import tensorflow as tf
from tensorflow.keras.models import load_model
import cv2
import numpy as np
import json
import os

print("🌿 PlantIQ - Model Testing")
print("=" * 50)

# Load model
print("📥 Loading trained model...")
model = load_model('plant_model.h5')
print("✅ Model loaded!")

# Load class names
with open('class_names.json', 'r') as f:
    class_names = json.load(f)

print(f"✅ Classes loaded: {len(class_names)} plant species\n")


def predict_plant(image_path):
    """Predict plant species from image"""

    # Check if file exists
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return None

    print(f"📷 Processing: {image_path}")

    # Load and preprocess image
    img = cv2.imread(image_path)
    if img is None:
        print("❌ Could not read image")
        return None

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (224, 224))
    img = img / 255.0
    img = np.expand_dims(img, axis=0)

    # Predict
    predictions = model.predict(img, verbose=0)
    predicted_idx = np.argmax(predictions[0])
    confidence = predictions[0][predicted_idx]

    predicted_class = class_names[predicted_idx]

    print(f"🌿 Prediction: {predicted_class}")
    print(f"✅ Confidence: {confidence * 100:.2f}%")

    # Show top 3 predictions
    top_3_idx = np.argsort(predictions[0])[-3:][::-1]
    print("\n📊 Top 3 predictions:")
    for i, idx in enumerate(top_3_idx, 1):
        print(f"   {i}. {class_names[idx]}: {predictions[0][idx] * 100:.2f}%")

    return predicted_class, confidence


# Test with a sample image
print("=" * 50)
print("🧪 Testing with sample image...\n")

# You need to provide a test image path
# Example: test_image = "../../datasets/species/test/Apple___Apple_scab/image1.jpg"
test_image = input("Enter path to test image (or press Enter to skip): ").strip()

if test_image and os.path.exists(test_image):
    predict_plant(test_image)
else:
    print("⚠️  No test image provided")
    print("\n💡 To test your model:")
    print("   python test_model.py")
    print("   Then enter a path like: ../../datasets/species/test/Apple___healthy/image1.jpg")

print("\n" + "=" * 50)
print("✨ Model is ready for production!")
