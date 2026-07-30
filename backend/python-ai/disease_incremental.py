import tensorflow as tf
from tensorflow.keras.models import load_model, Model
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight
import os
import json
import numpy as np
import shutil

print("=" * 60)
print("🦠 ADDING NEW DISEASES to Existing Model")
print("=" * 60)

# Configuration
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 30
LEARNING_RATE = 1e-5

# Paths
EXISTING_MODEL_PATH = 'ml_models/disease_model/disease_model.h5'
EXISTING_CLASSES_PATH = 'ml_models/disease_model/disease_classes.json'
DATASET_DIR = 'datasets/diseases'
OUTPUT_DIR = 'ml_models/disease_model'

print("📥 Loading existing disease model and classes...")
existing_model = load_model(EXISTING_MODEL_PATH)

with open(EXISTING_CLASSES_PATH, 'r') as f:
    existing_classes = json.load(f)

print(f"✅ Loaded model with {len(existing_classes)} existing diseases")

# Discover NEW disease classes
print("\n🔍 Discovering new diseases...")
train_dir = os.path.join(DATASET_DIR, 'train')
new_diseases = []

for disease_name in os.listdir(train_dir):
    disease_path = os.path.join(train_dir, disease_name)
    if os.path.isdir(disease_path) and disease_name not in existing_classes:
        new_diseases.append(disease_name)

print(f"🎯 Found {len(new_diseases)} new diseases: {new_diseases}")

if len(new_diseases) == 0:
    print("❌ No new diseases found. Please add new disease folders to datasets/diseases/train/")
    exit()

# Update disease classes
updated_classes = existing_classes + new_diseases
num_total_classes = len(updated_classes)

print(f"🔄 Updating from {len(existing_classes)} to {num_total_classes} total diseases")

# 🛠️ MODIFY existing model for new diseases
print("\n🛠️ Updating model for new diseases...")

# Get the base model and modify last layer for new number of classes
base_model = existing_model
x = base_model.layers[-2].output  # Layer before output
new_output = Dense(num_total_classes, activation='softmax', name='disease_output')(x)

# Create updated model
updated_model = Model(inputs=base_model.input, outputs=new_output)

# Freeze most layers, only unfreeze last few for fine-tuning
for layer in updated_model.layers[:-5]:
    layer.trainable = False

print("🔧 Trainable layers:")
for layer in updated_model.layers[-5:]:
    print(f"   {layer.name} - Trainable: {layer.trainable}")

# Data augmentation
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1./255)

# Load data
print("📥 Loading training data...")
train_generator = train_datagen.flow_from_directory(
    os.path.join(DATASET_DIR, 'train'),
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=True
)

# ⭐ CRITICAL: Save the correct disease class order
print("💾 Saving correct disease class order...")
class_names = sorted([d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))])
with open(EXISTING_CLASSES_PATH, 'w') as f:
    json.dump(class_names, f, indent=2)

print(f"✅ Disease classes saved: {class_names}")

# Calculate class weights
class_weights = compute_class_weight(
    'balanced',
    classes=np.arange(len(class_names)),
    y=train_generator.classes
)
class_weight_dict = {i: weight for i, weight in enumerate(class_weights)}

# Compile
updated_model.compile(
    optimizer=Adam(learning_rate=LEARNING_RATE),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Callbacks
callbacks = [
    EarlyStopping(monitor='val_accuracy', patience=8, restore_best_weights=True),
    ModelCheckpoint(os.path.join(OUTPUT_DIR, 'best_updated_disease.h5'), save_best_only=True, monitor='val_accuracy')
]

# Train
print("\n🎯 Training with new diseases...")
history = updated_model.fit(
    train_generator,
    steps_per_epoch=train_generator.samples // BATCH_SIZE,
    validation_data=val_datagen.flow_from_directory(
        os.path.join(DATASET_DIR, 'validation'),
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical'
    ),
    validation_steps=50,
    epochs=EPOCHS,
    callbacks=callbacks,
    class_weight=class_weight_dict,
    verbose=1
)

# Save updated model
updated_model.save(EXISTING_MODEL_PATH)

print("\n" + "=" * 60)
print("✅ NEW DISEASES ADDED SUCCESSFULLY!")
print("=" * 60)
print(f"🦠 Previous diseases: {len(existing_classes)}")
print(f"🦠 New diseases added: {len(new_diseases)}")
print(f"🦠 Total diseases now: {num_total_classes}")
print(f"🎯 Final accuracy: {history.history['val_accuracy'][-1]:.4f}")