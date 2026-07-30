import tensorflow as tf
from tensorflow.keras.models import load_model, Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
import os
import json
import numpy as np
import matplotlib.pyplot as plt
from sklearn.utils.class_weight import compute_class_weight
import shutil

print("=" * 60)
print("🌿 SAFE INCREMENTAL TRAINING - ADDING NEW PLANTS")
print("=" * 60)

# Configuration
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 25  # More epochs for new plants
LEARNING_RATE = 1e-5  # Lower learning rate

# Paths
EXISTING_MODEL_PATH = 'ml_models/plant_species/plant_species_fixed.h5'
EXISTING_CLASSES_PATH = 'ml_models/plant_species/class_names.json'
DATASET_DIR = 'datasets/plant_species'
OUTPUT_DIR = 'ml_models/plant_species'

print("📥 Loading existing model and classes...")
existing_model = load_model(EXISTING_MODEL_PATH)

with open(EXISTING_CLASSES_PATH, 'r') as f:
    existing_classes = json.load(f)

print(f"✅ Loaded model with {len(existing_classes)} existing plants")

# Discover new plant classes
print("\n🔍 Discovering new plants...")
train_dir = os.path.join(DATASET_DIR, 'train')
new_classes = []

for class_name in os.listdir(train_dir):
    class_path = os.path.join(train_dir, class_name)
    if os.path.isdir(class_path) and class_name not in existing_classes:
        new_classes.append(class_name)

print(f"🎯 Found {len(new_classes)} new plants: {new_classes}")

if len(new_classes) == 0:
    print("❌ No new plants found. Please add new plant folders to datasets/plant_species/train/")
    exit()

# Update class names
updated_classes = existing_classes + new_classes
num_total_classes = len(updated_classes)

print(f"🔄 Updating from {len(existing_classes)} to {num_total_classes} total plants")

# Get the base model and modify last layer
base_model = existing_model
x = base_model.layers[-2].output  # Get the layer before the output
new_output = Dense(num_total_classes, activation='softmax', name='new_output')(x)

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
    rotation_range=15,
    width_shift_range=0.1,
    height_shift_range=0.1,
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

validation_generator = val_datagen.flow_from_directory(
    os.path.join(DATASET_DIR, 'validation'),
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

print("💾 Saving correct class order...")
class_names = sorted([d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))])
with open(EXISTING_CLASSES_PATH, 'w') as f:
    json.dump(class_names, f, indent=2)

print(f"✅ Classes saved: {class_names}")
print(f"📊 Training samples: {train_generator.samples}")
print(f"📊 Validation samples: {validation_generator.samples}")

# Calculate class weights for balancing
print("\n⚖️ Calculating class weights for balancing...")
class_counts = []
for class_name in class_names:
    class_dir = os.path.join(DATASET_DIR, 'train', class_name)
    count = len([f for f in os.listdir(class_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    class_counts.append(count)

print(f"📊 Class distribution: {dict(zip(class_names, class_counts))}")

# Calculate class weights
class_weights = compute_class_weight(
    'balanced',
    classes=np.arange(len(class_names)),
    y=train_generator.classes
)
class_weight_dict = {i: weight for i, weight in enumerate(class_weights)}
print(f"⚖️ Class weights applied")

# Compile with lower learning rate
updated_model.compile(
    optimizer=Adam(learning_rate=LEARNING_RATE),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)
# Callbacks
callbacks = [
    EarlyStopping(
        monitor='val_accuracy',
        patience=8,
        restore_best_weights=True,
        verbose=1
    ),
    ModelCheckpoint(
        os.path.join(OUTPUT_DIR, 'best_updated_model.h5'),
        save_best_only=True,
        monitor='val_accuracy',
        verbose=1
    ),
    ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=4,
        min_lr=1e-7,
        verbose=1
    )
]

# Train with CLASS WEIGHTS
print("\n🎯 Starting SAFE incremental training for new plants...")
history = updated_model.fit(
    train_generator,
    steps_per_epoch=train_generator.samples // BATCH_SIZE,
    validation_data=validation_generator,
    validation_steps=validation_generator.samples // BATCH_SIZE,
    epochs=EPOCHS,
    callbacks=callbacks,
    class_weight=class_weight_dict,
    verbose=1
)

# 1. Backup current working model
backup_path = os.path.join(OUTPUT_DIR, 'plant_species_fixed_backup.h5')
shutil.copy(EXISTING_MODEL_PATH, backup_path)
print(f"📦 Backed up current model to: plant_species_fixed_backup.h5")

# 2. Save updated model as main model
updated_model.save(EXISTING_MODEL_PATH)
print(f"✅ Updated plant_species_fixed.h5 with new plants")

# 3. Clean up temporary file
temp_model_path = os.path.join(OUTPUT_DIR, 'best_updated_model.h5')
if os.path.exists(temp_model_path):
    os.remove(temp_model_path)

print("\n" + "=" * 60)
print("✅ SAFE INCREMENTAL TRAINING COMPLETE!")
print("=" * 60)
print(f"🌿 Previous plants: {len(existing_classes)}")
print(f"🌿 New plants added: {len(new_classes)}")
print(f"🌿 Total plants now: {num_total_classes}")
print(f"📦 Backup created: plant_species_model_backup.h5")
print(f"🎯 Final validation accuracy: {history.history['val_accuracy'][-1]:.4f}")
print("🔄 Restart your Flask app to use the updated model!")