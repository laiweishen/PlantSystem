import requests

# Use ANY image file you have
image_path = "0d7395d3-2b93-4a2e-92c1-3af256792956___Rut._Bact.S 1132.JPG"  # Put any disease image in the same folder as your script

url = "http://localhost:5000/api/debug-disease"
files = {'image': open(image_path, 'rb')}
response = requests.post(url, files=files)
print("📊 Response:", response.json())