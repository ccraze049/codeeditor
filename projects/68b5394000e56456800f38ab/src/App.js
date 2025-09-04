import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello World!</h1>
        <p>Welcome to your React app!</p>
        <button onClick={() => setCount(count + 1)}>
          Count: {count}
        </button>
        <p>You clicked {count} times</p>
      </header>
    </div>
  );
}

export default App;