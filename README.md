# Brain Tumor Classification System

This project implements a Convolutional Neural Network (CNN) for classifying brain MRI images as tumorous or non-tumorous. The system includes a complete pipeline from data preprocessing to model training and a FastAPI backend for making predictions.

## Features

- Image preprocessing with tumor region extraction
- CNN model with 5 convolutional layers for binary classification
- FastAPI backend for real-time predictions
- Simple API endpoint for uploading and analyzing brain MRI images
- Modern web-based user interface for easy interaction

## Requirements

First, install the required dependencies:

```
pip install -r requirements.txt
```

## Project Structure

- Brain_Tumor_Classification.ipynb : Jupyter notebook containing the complete model training pipeline
- main.py : FastAPI backend for image prediction
- requirements.txt : List of required Python packages
- brain_tumor_model.h5 : Trained model file
- frontend/ : Modern web-based user interface (HTML, Tailwind CSS, JS)

## How to Use

### Training the Model

1. Run the Jupyter notebook Brain_Tumor_Classification.ipynb to train the model
2. The trained model will be saved as brain_tumor_model.h5 in the project directory

### Running the API

1. Start the FastAPI server:

```
uvicorn main:app --reload
```

* Access the API documentation at **http://localhost:8000/docs**
* Use the /predict endpoint to upload an MRI image and get prediction results

### Using the Frontend

1. Open `frontend/index.html` in your web browser.
2. Upload an MRI image using the sleek, modern UI.
3. The frontend will preview your image and send it to the backend for classification.
4. Results (tumorous/non-tumorous and confidence score) are displayed instantly with a premium look.

**Note:** Ensure the FastAPI backend is running and accessible at `http://localhost:8000` for the frontend to work.

#### Frontend Features
- Beautiful, responsive design using Tailwind CSS
- Image upload with instant preview
- Real-time classification results with confidence score
- Error handling and user feedback

## API Endpoints

- POST /predict : Upload an image file and receive prediction results
  - Returns: JSON with `prediction` (tumorous/non-tumorous) and `confidence` score

## Contributing

Contributions are welcome! Here's how you can contribute to this project:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature-name`)
6. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style and conventions
- Write clear, commented code
- Ensure your code works properly before submitting a PR
- Update documentation as needed
- Add tests for new features when possible

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Special thanks to the medical imaging community for providing datasets and research
- Inspired by various research papers on brain tumor detection using deep learning

## Contact

If you have any questions or suggestions about this project, please open an issue or contact the repository owner.

## Future Improvements

- Implement more advanced preprocessing techniques
- Add support for multi-class tumor classification
- Improve model accuracy with transfer learning
- Create a web-based user interface for easier interaction
- Add batch processing capabilities for multiple images
