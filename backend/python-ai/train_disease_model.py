import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight
import os
import json
import matplotlib.pyplot as plt
import numpy as np

print("=" * 60)
print("🦠 Training Disease Detection Model")
print("=" * 60)

# Configuration
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 25
LEARNING_RATE = 0.001

# Paths
DATASET_DIR = 'datasets/diseases'
TRAIN_DIR = os.path.join(DATASET_DIR, 'train')
VAL_DIR = os.path.join(DATASET_DIR, 'validation')
OUTPUT_DIR = 'ml_models/disease_model'
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"📂 Training data: {TRAIN_DIR}")
print(f"📂 Validation data: {VAL_DIR}")

# Enhanced data augmentation for diseases
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=40,
    width_shift_range=0.3,
    height_shift_range=0.3,
    shear_range=0.3,
    zoom_range=0.3,
    horizontal_flip=True,
    vertical_flip=True,
    brightness_range=[0.7, 1.3],
    channel_shift_range=0.2,
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1./255)

# Load data
print("📥 Loading training data...")
train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=True
)

print("📥 Loading validation data...")
validation_generator = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

# ⭐ CRITICAL: Save the correct class order RIGHT AFTER flow_from_directory
print("💾 Saving correct class order...")
class_names = sorted([d for d in os.listdir(TRAIN_DIR) if os.path.isdir(os.path.join(TRAIN_DIR, d))])
with open(os.path.join(OUTPUT_DIR, 'disease_classes.json'), 'w') as f:
    json.dump(class_names, f, indent=2)

print(f"✅ Classes saved: {class_names}")
print(f"📊 Training samples: {train_generator.samples}")
print(f"📊 Validation samples: {validation_generator.samples}")

# ⭐ ADDED: Class weights for disease data imbalance
print("\n⚖️ Calculating class weights for diseases...")
class_counts = {}
for disease in class_names:
    disease_path = os.path.join(TRAIN_DIR, disease)
    images = [f for f in os.listdir(disease_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    class_counts[disease] = len(images)

print(f"📊 Disease distribution: {class_counts}")

# Calculate class weights
class_weights = compute_class_weight(
    'balanced',
    classes=np.arange(len(class_names)),
    y=train_generator.classes
)

class_weight_dict = {i: weight for i, weight in enumerate(class_weights)}
print(f"⚖️ Class weights applied")

# Build disease-specific model
print("\n🏗️ Building disease detection model...")
base_model = MobileNetV2(
    weights='imagenet',
    include_top=False,
    input_shape=(224, 224, 3)
)

# Freeze base model initially
base_model.trainable = False

# Enhanced classification head for diseases
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(512, activation='relu')(x)
x = BatchNormalization()(x)
x = Dropout(0.5)(x)  # Higher dropout for diseases
x = Dense(256, activation='relu')(x)
x = Dropout(0.3)(x)
predictions = Dense(len(class_names), activation='softmax', name='disease_type')(x)

model = Model(inputs=base_model.input, outputs=predictions)

# Compile
model.compile(
    optimizer=Adam(learning_rate=LEARNING_RATE),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print(f"✅ Model built: {model.count_params():,} parameters")

# Callbacks
callbacks = [
    EarlyStopping(
        monitor='val_accuracy',  # ⭐ Monitor accuracy instead of loss
        patience=8,
        restore_best_weights=True,
        verbose=1
    ),
    ModelCheckpoint(
        os.path.join(OUTPUT_DIR, 'best_disease_model.h5'),
        save_best_only=True,
        monitor='val_accuracy',
        verbose=1
    ),
    ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.2,
        patience=4,
        min_lr=1e-7,
        verbose=1
    )
]

# Train with CLASS WEIGHTS
print("\n🎯 Starting disease model training...")
history = model.fit(
    train_generator,
    validation_data=validation_generator,
    epochs=EPOCHS,
    callbacks=callbacks,
    class_weight=class_weight_dict,  # ⭐ ADDED: Class weights for balancing
    verbose=1
)

# Save final model
model.save(os.path.join(OUTPUT_DIR, 'disease_model.h5'))

# ⭐ ADDED: Test the model to verify class order
print("\n🔍 Testing disease model predictions...")
test_img = np.ones((1, 224, 224, 3)) * 0.5
predictions = model.predict(test_img, verbose=0)[0]
top_3 = np.argsort(predictions)[-3:][::-1]

print("📊 Test prediction distribution:")
for idx in top_3:
    print(f"   {class_names[idx]}: {predictions[idx]:.4f}")

# Plot results
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Train Accuracy')
plt.plot(history.history['val_accuracy'], label='Val Accuracy')
plt.title('Disease Model Accuracy')
plt.ylabel('Accuracy')
plt.xlabel('Epoch')
plt.legend()
plt.grid(True)

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.title('Disease Model Loss')
plt.ylabel('Loss')
plt.xlabel('Epoch')
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'disease_training_history.png'), dpi=100)

print("\n" + "=" * 60)
print("✅ DISEASE MODEL TRAINING COMPLETE!")
print("=" * 60)
print(f"📁 Model saved to: {os.path.abspath(OUTPUT_DIR)}")
print(f"🦠 Disease classes: {len(class_names)}")
print(f"🎯 Final validation accuracy: {history.history['val_accuracy'][-1]:.4f}")
print("💾 Class order saved to: disease_classes.json")