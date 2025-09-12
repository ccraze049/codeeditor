import React, { useState, useEffect } from 'react';
import './styles/App.css';

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch('/api')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => {
        console.error("Error fetching data: ", error);
        setMessage('Error fetching data.');
      });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Express Server Response</h1>
      </header>
      <main className="app-main">
        <p className="message">{message}</p>
      </main>
      <footer className="app-footer">
        <p>&copy; 2025 Example Corp.</p>
      </footer>
    </div>
  );
}

export default App;