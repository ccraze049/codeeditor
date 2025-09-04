import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import './styles/App.css';

function App() {
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setImages(prevImages => [...prevImages, ...imageFiles]);
    } else {
      alert("Please select only image files.");
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleConvertToPdf = () => {
    if (images.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    const doc = new jsPDF();
    let yOffset = 10;

    const addImageToPdf = (index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgData = event.target.result;
        const img = new Image();
        img.onload = () => {
          const imgWidth = img.width;
          const imgHeight = img.height;
          const pageWidth = doc.internal.pageSize.getWidth() - 20;
          const pageHeight = doc.internal.pageSize.getHeight() - 20;

          let width = pageWidth;
          let height = (imgHeight / imgWidth) * pageWidth;

          if (height > pageHeight) {
            height = pageHeight;
            width = (imgWidth / imgHeight) * pageHeight;
          }

          if (yOffset + height > pageHeight) {
            doc.addPage();
            yOffset = 10;
          }

          doc.addImage(imgData, 'JPEG', 10, yOffset, width, height);
          yOffset += height + 10;

          if (index < images.length - 1) {
            addImageToPdf(index + 1);
          } else {
            doc.save("images.pdf");
          }
        };
        img.src = imgData;
      };
      reader.readAsDataURL(images[index]);
    };

    addImageToPdf(0);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>IMG to PDF Converter</h1>
        <p>Easily convert your images to PDF documents.</p>
      </header>

      <section className="upload-section">
        <button className="upload-button" onClick={handleButtonClick}>
          Upload Images
        </button>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
      </section>

      {images.length > 0 && (
        <section className="image-preview-section">
          <h2>Image Preview</h2>
          <div className="image-grid">
            {images.map((image, index) => (
              <div key={index} className="image-item">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Uploaded Image ${index + 1}`}
                  className="preview-image"
                />
                <button className="remove-button" onClick={() => handleRemoveImage(index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {images.length > 0 && (
        <section className="convert-section">
          <button className="convert-button" onClick={handleConvertToPdf}>
            Convert to PDF
          </button>
        </section>
      )}

      <footer className="app-footer">
        <p>&copy; 2025 IMG to PDF Converter</p>
      </footer>
    </div>
  );
}

export default App;