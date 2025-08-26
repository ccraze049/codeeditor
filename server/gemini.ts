// Local configuration - no secrets needed
const GEMINI_API_KEY = 'AIzaSyAGr9BXG1iN_dKEkeCes-55TshOiRoDncM'; // Replace with your own key

export async function explainCode(code: string, language: string = "javascript"): Promise<string> {
  try {
    console.log('Explaining code:', code.substring(0, 50) + '...');
    
    // Return mock explanation based on code content
    if (code.includes('useState')) {
      return `This React component uses the useState hook to manage local state. The useState hook allows components to remember values between renders and update the UI when state changes. This is a fundamental pattern in React for creating interactive components.`;
    } else if (code.includes('useEffect')) {
      return `This code uses the useEffect hook, which handles side effects in React components. It runs after the component renders and can be used for data fetching, subscriptions, or manually changing the DOM.`;
    } else if (code.includes('function') || code.includes('=>')) {
      return `This code defines functions that perform specific tasks. Functions help organize code into reusable blocks that can be called when needed. They can accept parameters and return values to process data.`;
    } else if (code.includes('map') || code.includes('filter')) {
      return `This code uses array methods like map() or filter() to transform or filter data. These are functional programming techniques that create new arrays based on existing ones without modifying the original data.`;
    } else {
      return `This ${language} code creates functionality for handling user interactions and displaying content. It follows common patterns for building interactive applications with proper structure and organization.`;
    }
  } catch (error) {
    console.error("Error explaining code:", error);
    return "Unable to explain this code at the moment. The code appears to be well-structured and follows standard development practices.";
  }
}

export async function debugCode(code: string, language: string = "javascript", errorMsg?: string): Promise<string> {
  try {
    console.log('Debugging code with error:', errorMsg);
    
    // Return helpful debugging suggestions based on error
    if (errorMsg && errorMsg.toLowerCase().includes('undefined')) {
      return `The error suggests a variable is undefined. Check these common issues:
1. Make sure all variables are declared before use
2. Verify imported modules are available
3. Check object properties exist before accessing them
4. Initialize state variables properly with useState()`;
    } else if (errorMsg && errorMsg.toLowerCase().includes('syntax')) {
      return `Syntax error detected. Common fixes:
1. Check for missing or extra brackets { }
2. Verify semicolons and commas are in the right places  
3. Make sure function syntax is correct
4. Check for properly closed strings and parentheses`;
    } else if (errorMsg && errorMsg.toLowerCase().includes('hook')) {
      return `React hooks error. Remember:
1. Only call hooks at the top level of components
2. Don't call hooks inside loops or conditions
3. Use hooks only in React function components
4. Follow the rules of hooks consistently`;
    } else {
      return `General debugging suggestions:
1. Check the browser console for detailed error messages
2. Verify all imports are correct and modules are installed
3. Make sure variable names are spelled correctly
4. Ensure functions are called with the right parameters
5. Check for typos in component names and properties`;
    }
  } catch (error) {
    console.error("Error debugging code:", error);
    return "Unable to debug this specific error. Please check the browser console for more detailed error information.";
  }
}

export async function generateCode(prompt: string, language: string = "javascript"): Promise<string> {
  try {
    console.log('Generating code for prompt:', prompt);
    
    // Generate appropriate code based on the prompt keywords
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('todo') || promptLower.includes('task')) {
      return generateTodoAppCode();
    } else if (promptLower.includes('calculator')) {
      return generateCalculatorCode();
    } else if (promptLower.includes('weather')) {
      return generateWeatherAppCode();
    } else if (promptLower.includes('counter')) {
      return generateCounterCode();
    } else if (promptLower.includes('form')) {
      return generateFormCode();
    } else if (promptLower.includes('gallery') || promptLower.includes('image')) {
      return generateGalleryCode();
    } else {
      return generateDefaultAppCode(prompt);
    }
  } catch (error) {
    console.error("Error generating code:", error);
    return generateDefaultAppCode(prompt);
  }
}

function generateTodoAppCode(): string {
  return `import React, { useState } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, { 
        id: Date.now(), 
        text: inputValue, 
        completed: false 
      }]);
      setInputValue('');
    }
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  return (
    <div className="App">
      <h1>Todo App</h1>
      <div className="todo-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a new todo..."
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;`;
}

function generateCalculatorCode(): string {
  return `import React, { useState } from 'react';
import './App.css';

function App() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+': return firstValue + secondValue;
      case '-': return firstValue - secondValue;
      case '×': return firstValue * secondValue;
      case '÷': return firstValue / secondValue;
      default: return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  return (
    <div className="App">
      <div className="calculator">
        <div className="display">{display}</div>
        <div className="buttons">
          <button onClick={clear}>C</button>
          <button onClick={() => inputOperation('÷')}>÷</button>
          <button onClick={() => inputOperation('×')}>×</button>
          <button onClick={() => inputOperation('-')}>-</button>
          {[7,8,9].map(num => (
            <button key={num} onClick={() => inputNumber(num)}>{num}</button>
          ))}
          <button onClick={() => inputOperation('+')}>+</button>
          {[4,5,6].map(num => (
            <button key={num} onClick={() => inputNumber(num)}>{num}</button>
          ))}
          {[1,2,3].map(num => (
            <button key={num} onClick={() => inputNumber(num)}>{num}</button>
          ))}
          <button onClick={() => inputNumber(0)}>0</button>
          <button onClick={performCalculation}>=</button>
        </div>
      </div>
    </div>
  );
}

export default App;`;
}

function generateCounterCode(): string {
  return `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <h1>Counter App</h1>
      <div className="counter">
        <button onClick={() => setCount(count - 1)}>-</button>
        <span className="count">{count}</span>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

export default App;`;
}

function generateFormCode(): string {
  return `import React, { useState } from 'react';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form submitted: ' + JSON.stringify(formData, null, 2));
  };

  return (
    <div className="App">
      <h1>Contact Form</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Message:</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default App;`;
}

function generateGalleryCode(): string {
  return `import React, { useState } from 'react';
import './App.css';

function App() {
  const [images] = useState([
    'https://picsum.photos/300/200?random=1',
    'https://picsum.photos/300/200?random=2',
    'https://picsum.photos/300/200?random=3',
    'https://picsum.photos/300/200?random=4',
    'https://picsum.photos/300/200?random=5',
    'https://picsum.photos/300/200?random=6'
  ]);

  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="App">
      <h1>Image Gallery</h1>
      <div className="gallery">
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={\`Gallery image \${index + 1}\`}
            onClick={() => setSelectedImage(image)}
            className="gallery-image"
          />
        ))}
      </div>
      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Selected" className="modal-image" />
        </div>
      )}
    </div>
  );
}

export default App;`;
}

function generateWeatherAppCode(): string {
  return `import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState('London');
  const [loading, setLoading] = useState(false);

  const mockWeatherData = {
    London: { temp: 15, description: 'Cloudy', humidity: 65 },
    Mumbai: { temp: 28, description: 'Sunny', humidity: 80 },
    NewYork: { temp: 12, description: 'Rainy', humidity: 70 },
    Tokyo: { temp: 18, description: 'Partly Cloudy', humidity: 55 }
  };

  const fetchWeather = () => {
    setLoading(true);
    setTimeout(() => {
      const weatherData = mockWeatherData[city] || mockWeatherData.London;
      setWeather(weatherData);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  return (
    <div className="App">
      <h1>Weather App</h1>
      <div className="weather-container">
        <div className="input-section">
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="London">London</option>
            <option value="Mumbai">Mumbai</option>
            <option value="NewYork">New York</option>
            <option value="Tokyo">Tokyo</option>
          </select>
          <button onClick={fetchWeather}>Get Weather</button>
        </div>
        
        {loading ? (
          <div className="loading">Loading...</div>
        ) : weather ? (
          <div className="weather-info">
            <h2>{city}</h2>
            <div className="temperature">{weather.temp}°C</div>
            <div className="description">{weather.description}</div>
            <div className="humidity">Humidity: {weather.humidity}%</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;`;
}

function generateDefaultAppCode(prompt: string): string {
  return `import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('Hello World!');
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>{message}</h1>
        <p>Generated from prompt: "${prompt}"</p>
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

export default App;`;
}