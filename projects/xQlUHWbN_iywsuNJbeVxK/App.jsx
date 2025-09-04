import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('Hello World!');
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>{message}</h1>
        <p>Generated from prompt: "Create a React component for: Simple tudo website "</p>
        <div className="counter">
          <button onClick={() => setCount(count - 1)}>-</button>
          <span>Count: {count}</span>
          <button onClick={() => setCount(count + 1)}>+</button>
        </div>
        <button onClick={() => setMessage('Hello from React!')}>
          Click me!
        </button>
      </header>
    </div>
  );
}

export default App;