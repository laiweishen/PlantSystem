import tensorflow as tf
from tensorflow.keras.models import load_model, Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import os
import json
import numpy as np

print("🔄 REBUILDING DISEASE MODEL FOR 30 CLASSES")
print("=" * 50)

# CONFIG
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 30
LEARNING_RATE = 1e-4

MODEL_PATH = "ml_models/disease_model/disease_model.h5"
TRAIN_DIR = "datasets/diseases/train"
VAL_DIR = "datasets/diseases/validation"
CLASSES_PATH = "ml_models/disease_model/disease_classes.json"

print("📥 Loading model...")
old_model = load_model(MODEL_PATH, compile=False)

# Get number of classes from data
train_gen = ImageDataGenerator(rescale=1./255).flow_from_directory(
    TRAIN_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE
)
NUM_CLASSES = len(train_gen.class_indices)

print(f"🎯 Rebuilding for {NUM_CLASSES} disease classes")

# ⭐ REBUILD model with correct output shape
# Get the base layers from old model (excluding last layer)
base_output = old_model.layers[-2].output  # Get layer before the output

# Add new output layer with correct number of classes
new_output = Dense(NUM_CLASSES, activation='softmax', name='new_disease_output')(base_output)

# Create new model
model = Model(inputs=old_model.input, outputs=new_output)

# Unfreeze all layers
for layer in model.layers:
    layer.trainable = True

print(f"✅ Model rebuilt for {NUM_CLASSES} classes")

# Save correct class names
class_names = sorted(list(train_gen.class_indices.keys()))
with open(CLASSES_PATH, 'w') as f:
    json.dump(class_names, f, indent=2)
print(f"✅ Classes saved: {class_names}")

# Data augmentation
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1./255)

train_gen = train_datagen.flow_from_directory(TRAIN_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE)
val_gen = val_datagen.flow_from_directory(VAL_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE)

# Compile
model.compile(
    optimizer=Adam(learning_rate=LEARNING_RATE),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

callbacks = [
    EarlyStopping(monitor="val_accuracy", patience=10, restore_best_weights=True),
    ModelCheckpoint("ml_models/disease_model/disease_rebuilt.h5", save_best_only=True, monitor="val_accuracy")
]

print("🎯 Starting retraining with rebuilt model...")
history = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS,
    callbacks=callbacks,
    verbose=1
)

model.save(MODEL_PATH)
print(f"🎯 Final accuracy: {history.history['val_accuracy'][-1]:.4f}")