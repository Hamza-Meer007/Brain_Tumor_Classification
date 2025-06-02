import cv2
import numpy as np
import tensorflow as tf
import imutils
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import io
from PIL import Image
import matplotlib.pyplot as plt

# Initialize FastAPI app
app = FastAPI(title="Brain Tumor Classification API", 
              description="API for classifying brain MRI images as tumorous or non-tumorous",
              version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
try:
    model = tf.keras.models.load_model("brain_tumor_model.h5")
    print("Model loaded successfully!")
    
    # Define class names
    class_name = {0: 'no', 1: 'yes'}  # 0: non-tumorous, 1: tumorous
    
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Image preprocessing function
def crop_brain_tumor(image_bytes):
    """
    Crops the brain tumor region from an image.
    
    Args:
        image_bytes: Image bytes data
        
    Returns:
        Cropped image focusing on the tumor region
    """
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Preprocess the image
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)  # Convert to grayscale
    gray = cv2.GaussianBlur(gray, (5, 5), 0)  # Apply Gaussian blur
    
    # Threshold the image
    thres = cv2.threshold(gray, thresh=45, maxval=255, type=cv2.THRESH_BINARY)[1]
    thres = cv2.erode(thres, None, iterations=2)  # Erode to remove small irregularities
    thres = cv2.dilate(thres, None, iterations=2)  # Dilate to fill gaps
    
    # Find contours
    cnts = cv2.findContours(thres.copy(), mode=cv2.RETR_EXTERNAL, method=cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)
    
    # If no contours found, return the original image
    if not cnts:
        return image
    
    # Get the largest contour
    c = max(cnts, key=cv2.contourArea)
    
    # Find extreme points
    extleft = tuple(c[c[:, :, 0].argmin()][0])
    extright = tuple(c[c[:, :, 0].argmax()][0])
    exttop = tuple(c[c[:, :, 1].argmin()][0])
    extbottom = tuple(c[c[:, :, 1].argmax()][0])
    
    # Crop the image
    new_image = image[exttop[1]:extbottom[1], extleft[0]:extright[0]]
    
    # If cropping failed, return the original image
    if new_image.size == 0:
        return image
    
    return new_image

# Prediction function
def make_prediction(image_bytes):
    """
    Makes a prediction on an image using the trained model.
    
    Args:
        image_bytes: Image bytes data
        
    Returns:
        Dictionary with prediction results
    """
    try:
        # Preprocess the image
        img = crop_brain_tumor(image_bytes)
        
        # Resize to the expected input size
        img = cv2.resize(img, dsize=(240, 240), interpolation=cv2.INTER_CUBIC)
        
        # Normalize pixel values
        img = img / 255.0
        
        # Add batch dimension
        img = np.expand_dims(img, axis=0)
        
        # Make prediction
        predictions = model.predict(img)
        predicted_class_index = np.argmax(predictions)
        predicted_class_name = class_name[predicted_class_index]
        confidence = float(predictions[0][predicted_class_index])  # Convert to float for JSON serialization
        
        # Map class name to a more descriptive label
        result = "tumorous" if predicted_class_name == "yes" else "non-tumorous"
        
        return {"prediction": result, "confidence": confidence}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Brain Tumor Classification API"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Endpoint to predict whether a brain MRI image contains a tumor.
    
    Args:
        file: Uploaded image file
        
    Returns:
        Prediction result with confidence score
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Check if the model is loaded
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded. Please check server logs.")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not an image")
    
    try:
        # Read the file
        contents = await file.read()
        
        # Make prediction
        result = make_prediction(contents)
        
        return JSONResponse(content=result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)