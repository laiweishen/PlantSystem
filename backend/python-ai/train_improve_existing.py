import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight
import os
import numpy as np
import json

print("🔄 RETRAINING WITH BETTER SETTINGS...")

# CONFIG
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 25  # Reduced
BASE_LR = 1e-5  # Much lower learning rate
PATIENCE = 8

MODEL_PATH = "ml_models/plant_species/plant_species_model.h5"  # Start from original
CLASSES_PATH = "ml_models/plant_species/class_names.json"
TRAIN_DIR = "datasets/plant_species/train"
VAL_DIR = "datasets/plant_species/validation"
OUTPUT_DIR = "ml_models/plant_species"

# Load FRESH model (don't use the broken one)
print("📥 Loading FRESH model...")
model = load_model(MODEL_PATH, compile=False)

# ⭐ BETTER FINE-TUNING: Unfreeze last 3 layers only
for layer in model.layers[:-3]:
    layer.trainable = False
for layer in model.layers[-3:]:
    layer.trainable = True

print("🔧 Trainable layers:")
for layer in model.layers[-5:]:
    print(f"   {layer.name} - Trainable: {layer.trainable}")

# Data generators (less augmentation)
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=15,
    width_shift_range=0.1,
    height_shift_range=0.1,
    horizontal_flip=True,
    fill_mode="nearest"
)

val_datagen = ImageDataGenerator(rescale=1./255)

train_gen = train_datagen.flow_from_directory(TRAIN_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE)
val_gen = val_datagen.flow_from_directory(VAL_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE)

# ⭐ CRITICAL: Save the correct class order RIGHT AFTER flow_from_directory
print("💾 Saving correct class order...")
class_names = sorted([d for d in os.listdir(TRAIN_DIR) if os.path.isdir(os.path.join(TRAIN_DIR, d))])
with open(CLASSES_PATH, 'w') as f:
    json.dump(class_names, f, indent=2)

print(f"✅ Classes saved in correct order: {class_names}")

# ⭐ BETTER CLASS WEIGHTS - Less aggressive
class_counts = {}
for plant in os.listdir(TRAIN_DIR):
    plant_path = os.path.join(TRAIN_DIR, plant)
    if os.path.isdir(plant_path):
        images = [f for f in os.listdir(plant_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        class_counts[plant] = len(images)

class_weight_dict = {}
total_images = sum(class_counts.values())

print("⚖️ BETTER CLASS WEIGHTS:")
for class_name, idx in train_gen.class_indices.items():
    count = class_counts[class_name]
    # Less aggressive weighting
    weight = np.sqrt(total_images / (len(class_counts) * count))  # Square root method
    class_weight_dict[idx] = min(weight, 3.0)  # Cap at 3.0x max
    print(f"   🌿 {class_name:15}: {count:4} images → weight: {class_weight_dict[idx]:.2f}x")

# Compile with lower LR
model.compile(
    optimizer=Adam(learning_rate=BASE_LR),  # Very low LR
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

callbacks = [
    EarlyStopping(monitor="val_accuracy", patience=PATIENCE, restore_best_weights=True),
    ReduceLROnPlateau(monitor="val_loss", patience=3, factor=0.5, min_lr=1e-7),
    ModelCheckpoint(
        os.path.join(OUTPUT_DIR, "plant_species_fixed.h5"),  # NEW filename
        monitor="val_accuracy", save_best_only=True
    )
]

print("🎯 Starting balanced training with better settings...")
history = model.fit(
    train_gen,
    steps_per_epoch=train_gen.samples // BATCH_SIZE,
    validation_data=val_gen,
    validation_steps=val_gen.samples // BATCH_SIZE,
    class_weight=class_weight_dict,
    epochs=EPOCHS,
    callbacks=callbacks,
    verbose=1
)

with open(CLASSES_PATH, 'r') as f:
    class_names = json.load(f)

# Test the model
print("🔍 Testing model predictions...")
test_img = np.ones((1, 224, 224, 3)) * 0.5  # Gray test image
predictions = model.predict(test_img, verbose=0)[0]
top_3 = np.argsort(predictions)[-3:][::-1]

print("📊 Test prediction distribution:")
for idx in top_3:
    print(f"   {class_names[idx]}: {predictions[idx]:.4f}")

model.save(os.path.join(OUTPUT_DIR, "plant_species_fixed.h5"))
print("✅ Fixed model saved as: plant_species_fixed.h5")

print("🔄 Renaming to main model...")
import shutil

fixed_model_path = os.path.join(OUTPUT_DIR, "plant_species_fixed.h5")
main_model_path = os.path.join(OUTPUT_DIR, "plant_species_model.h5")

# Backup old model
if os.path.exists(main_model_path):
    backup_path = os.path.join(OUTPUT_DIR, "plant_species_model_backup.h5")
    shutil.copy(main_model_path, backup_path)
    print(f"📦 Backed up old model to: plant_species_model_backup.h5")

# Replace with new model
shutil.copy(fixed_model_path, main_model_path)
print(f"✅ Replaced main model with fixed version")

# Optional: Remove the temporary fixed file
os.remove(fixed_model_path)
print(f"🧹 Cleaned up temporary file")

print("🎉 Model update complete! Your Flask app will now use the fixed model automatically.")