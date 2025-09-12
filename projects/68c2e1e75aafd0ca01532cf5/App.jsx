import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to R!</h1>
        <p>This is your React application built with CodeSpace IDE.</p>
        
        <div className="counter-section">
          <h2>Counter Example</h2>
          <p className="counter-display">Count: {count}</p>
          
          <div className="button-group">
            <button onClick={() => setCount(count + 1)}>
              Increment
            </button>
            <button onClick={() => setCount(count - 1)}>
              Decrement  
            </button>
            <button onClick={() => setCount(0)}>
              Reset
            </button>
          </div>
        </div>
        
        <div className="info-section">
          <p>
            Edit <code>App.jsx</code> to customize this application.
          </p>
          <p>
            Your React app is ready to use! 🚀
          </p>
        </div>
      </header>
    </div>
  );
}

export default App;