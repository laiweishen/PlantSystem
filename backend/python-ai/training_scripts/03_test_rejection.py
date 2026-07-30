import requests
import cv2
import numpy as np
import os

def test_rejection_system():
    """Test the two-stage pipeline with various images"""
    
    test_cases = [
        {'name': 'Clear plant image', 'path': 'test_plants/clear_leaf.jpg', 'should_be_plant': True},
        {'name': 'Cat image', 'path': 'test_plants/cat.jpg', 'should_be_plant': False},
        {'name': 'Car image', 'path': 'test_plants/car.jpg', 'should_be_plant': False},
        {'name': 'Person image', 'path': 'test_plants/person.jpg', 'should_be_plant': False},
        {'name': 'Blurry plant', 'path': 'test_plants/blurry_leaf.jpg', 'should_be_plant': True},
    ]
    
    print("🧪 Testing Two-Stage Pipeline...")
    
    for test in test_cases:
        if not os.path.exists(test['path']):
            print(f"❌ Skip: {test['path']} not found")
            continue
            
        print(f"\n🔍 Testing: {test['name']}")
        
        # Send to API
        with open(test['path'], 'rb') as f:
            files = {'image': f}
            response = requests.post('http://localhost:5000/api/smart-predict', files=files)
            
        result = response.json()
        
        if result.get('success'):
            print(f"   ✅ Accepted as plant: {result['prediction']['plant']}")
            print(f"   📊 Confidence: {result['prediction']['confidence']:.3f}")
        else:
            print(f"   ❌ Rejected: {result.get('message', 'Unknown reason')}")
            print(f"   📊 Plant confidence: {result.get('plant_confidence', 0):.3f}")
            
        # Verify expected vs actual
        expected_plant = test['should_be_plant']
        actual_plant = result.get('is_plant', False)
        
        if expected_plant == actual_plant:
            print("   🎯 TEST PASSED")
        else:
            print("   💥 TEST FAILED")

if __name__ == "__main__":
    test_rejection_system()