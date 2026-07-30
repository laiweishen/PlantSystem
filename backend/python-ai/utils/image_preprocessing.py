import cv2
import numpy as np
from tensorflow.keras.preprocessing import image


def preprocess_image(img_path, target_size=(224, 224)):
    """
    Preprocess image for model prediction
    """
    # Read image
    img = cv2.imread(img_path)
    if img is None:
        raise ValueError("Could not read image")

    # Resize
    img = cv2.resize(img, target_size)

    # Convert BGR to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Optional: Denoise
    img = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)

    # Normalize
    img = img / 255.0

    # Add batch dimension
    img = np.expand_dims(img, axis=0)

    return img


def preprocess_uploaded_file(file_stream, target_size=(224, 224)):
    """
    Preprocess uploaded file from Flask request
    """
    # Read image from file stream
    file_bytes = np.asarray(bytearray(file_stream.read()), dtype=np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    # Resize and preprocess
    img = cv2.resize(img, target_size)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img / 255.0
    img = np.expand_dims(img, axis=0)

    return img
