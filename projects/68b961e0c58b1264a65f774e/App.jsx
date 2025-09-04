import React, { useState } from 'react';
import './styles/App.css';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [convertedImage, setConvertedImage] = useState(null);
  const [conversionType, setConversionType] = useState('jpeg');

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
  };

  const handleConversion = async () => {
    if (!selectedImage) {
      alert('Please select an image first.');
      return;
    }

    try {
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const file = new File([blob], 'image.' + conversionType, { type: blob.type });

      const reader = new FileReader();
      reader.onloadend = () => {
        setConvertedImage(reader.result);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error converting image:', error);
      alert('Error converting image.');
    }
  };

  const handleDownload = () => {
    if (!convertedImage) {
      alert('Please convert an image first.');
      return;
    }

    const link = document.createElement('a');
    link.href = convertedImage;
    link.download = `converted_image.${conversionType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Image Converter</h1>
      </header>

      <main className="app-main">
        <section className="upload-section">
          <label htmlFor="image-upload" className="upload-label">
            Select Image
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          {selectedImage && (
            <div className="image-preview">
              <img src={selectedImage} alt="Selected" />
            </div>
          )}
        </section>

        <section className="conversion-section">
          <div className="conversion-options">
            <label htmlFor="conversion-type">Convert to:</label>
            <select
              id="conversion-type"
              value={conversionType}
              onChange={(e) => setConversionType(e.target.value)}
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WEBP</option>
              <option value="gif">GIF</option>
            </select>
          </div>

          <button className="convert-button" onClick={handleConversion}>
            Convert
          </button>
        </section>

        {convertedImage && (
          <section className="download-section">
            <div className="converted-image-preview">
              <img src={convertedImage} alt="Converted" />
            </div>
            <button className="download-button" onClick={handleDownload}>
              Download
            </button>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 Image Converter</p>
      </footer>
    </div>
  );
}

export default App;