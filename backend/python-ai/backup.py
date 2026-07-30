import shutil
import os
from datetime import datetime

# Timestamp for backup
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

# Backup plant model
plant_original = "ml_models/plant_species/plant_species_model.h5"
plant_backup = f"ml_models/plant_species/plant_species_model_BACKUP_{timestamp}.h5"
shutil.copy(plant_original, plant_backup)

# Backup disease model  
disease_original = "ml_models/disease_model/disease_model.h5"
disease_backup = f"ml_models/disease_model/disease_model_BACKUP_{timestamp}.h5"
shutil.copy(disease_original, disease_backup)

print(f"✅ Plant model backed up: {plant_backup}")
print(f"✅ Disease model backed up: {disease_backup}")
print("🎯 Safe to add Rose now!")