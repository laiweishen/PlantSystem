import os
import shutil
import random
from sklearn.model_selection import train_test_split

def prepare_binary_data():
    """Prepare plant vs non-plant dataset"""
    
    print("🌿 Preparing binary classification dataset...")
    
    # Source directories
    PLANT_SOURCE = '../datasets/species'  # Your existing plant data
    OUTPUT_DIR = '../datasets/binary_classification'
    
    # Step 1: Copy all plant images to 'plant' folder
    print("📥 Copying plant images...")
    plant_count = 0
    
    for split in ['train', 'validation']:
        source_dir = os.path.join(PLANT_SOURCE, split)
        dest_dir = os.path.join(OUTPUT_DIR, split, 'plant')
        
        os.makedirs(dest_dir, exist_ok=True)
        
        if os.path.exists(source_dir):
            for class_name in os.listdir(source_dir):
                class_dir = os.path.join(source_dir, class_name)
                if os.path.isdir(class_dir):
                    for img_file in os.listdir(class_dir):
                        if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                            src_path = os.path.join(class_dir, img_file)
                            dest_path = os.path.join(dest_dir, f"{class_name}_{img_file}")
                            shutil.copy2(src_path, dest_path)
                            plant_count += 1
    
    print(f"✅ Copied {plant_count} plant images")
    
    # Step 2: Provide instructions for non-plant images
    print("\n📝 NEXT STEPS for non-plant images:")
    print("1. Add non-plant images to these folders:")
    print(f"   - {OUTPUT_DIR}/train/not_plant/")
    print(f"   - {OUTPUT_DIR}/validation/not_plant/")
    print("\n2. Sources for non-plant images:")
    print("   - Animals (cats, dogs, birds)")
    print("   - Everyday objects (cars, furniture, electronics)")
    print("   - People (faces, hands)")
    print("   - Food (non-plant items)")
    print("   - Textures (fabric, wood, metal)")
    print("\3. Aim for similar number of non-plant images as plant images")
    
    return plant_count

if __name__ == "__main__":
    prepare_binary_data()