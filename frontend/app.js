
const imageInput = document.getElementById('imageInput');
const resultDiv = document.getElementById('result');
const resultText = document.getElementById('resultText');
const preview = document.createElement('img');
preview.id = 'imagePreview';
preview.className = 'mt-4 rounded-lg shadow-lg max-h-64 mx-auto';
preview.style.display = 'none';
imageInput.parentNode.insertBefore(preview, imageInput.nextSibling);

imageInput.addEventListener('change', function() {
  if (imageInput.files && imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    preview.style.display = 'none';
  }
});

document.getElementById('uploadForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  if (!imageInput.files.length) {
    resultText.textContent = 'Please select an image.';
    resultDiv.classList.remove('hidden');
    return;
  }
  const formData = new FormData();
  formData.append('file', imageInput.files[0]);
  resultText.textContent = 'Classifying...';
  resultDiv.classList.remove('hidden');
  try {
    const response = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      body: formData
    });
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      resultText.textContent = 'Invalid response from backend.';
      return;
    }
    if (response.ok && data && data.prediction) {
      resultText.innerHTML = `<span class='font-bold text-xl'>Prediction:</span> <span class='text-blue-300 font-semibold'>${data.prediction.replace(/\b\w/g, c => c.toUpperCase())}</span><br><span class='font-bold'>Confidence:</span> <span class='text-green-300'>${(data.confidence * 100).toFixed(2)}%</span>`;
    } else if (data && data.detail) {
      resultText.textContent = 'Error: ' + data.detail;
    } else {
      resultText.textContent = 'Could not classify the image.';
    }
  } catch (error) {
    resultText.textContent = 'Error connecting to backend.';
  }
});
