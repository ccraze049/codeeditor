// Local configuration - no secrets needed
const GEMINI_API_KEY = 'AIzaSyAGr9BXG1iN_dKEkeCes-55TshOiRoDncM'; // Replace with your own key

export async function explainCode(code: string, language: string = "javascript"): Promise<string> {
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
}

export async function debugCode(code: string, language: string = "javascript", errorMsg?: string): Promise<string> {
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
}

export async function generateCode(prompt: string, language: string = "javascript"): Promise<string> {
  console.log('Generating code for prompt:', prompt);
  
  // If it's CSS generation request, use CSS generator
  if (language === 'css' || prompt.toLowerCase().includes('css') || prompt.toLowerCase().includes('styles')) {
    return generateCSSStyles(prompt);
  }
  
  // Generate appropriate JavaScript code based on the prompt keywords
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
}

function generateCSSStyles(prompt: string): string {
  console.log('Generating CSS for prompt:', prompt);
  
  // Simple CSS generation based on prompt keywords
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('todo') || promptLower.includes('task')) {
    return getTodoAppCSS();
  } else if (promptLower.includes('calculator')) {
    return getCalculatorCSS();
  } else if (promptLower.includes('weather')) {
    return getWeatherAppCSS();
  } else if (promptLower.includes('counter')) {
    return getCounterCSS();
  } else if (promptLower.includes('form')) {
    return getFormCSS();
  } else if (promptLower.includes('gallery') || promptLower.includes('image')) {
    return getGalleryCSS();
  } else {
    return getDefaultCSS();
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

function getDefaultCSS(): string {
  return `.App {
  text-align: center;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.App-header {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 2.5em;
}

p {
  color: #7f8c8d;
  font-size: 1.2em;
  margin-bottom: 30px;
}

.counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

.counter button {
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  font-size: 1.5em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #e74c3c;
  color: white;
}

.counter button:hover {
  transform: scale(1.1);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.counter button:last-child {
  background: #27ae60;
}

.counter span {
  font-size: 1.5em;
  font-weight: bold;
  color: #2c3e50;
  min-width: 80px;
}

button {
  background: #3498db;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 25px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.3s ease;
  margin: 10px;
}

button:hover {
  background: #2980b9;
}`;
}

function getTodoAppCSS(): string {
  return `.App {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.todo-input {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.todo-input input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.todo-input input:focus {
  outline: none;
  border-color: #007bff;
}

.todo-input button {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.todo-input button:hover {
  background: #0056b3;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  margin-bottom: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.todo-list li.completed {
  opacity: 0.6;
  text-decoration: line-through;
  border-left-color: #28a745;
}

.todo-text {
  flex: 1;
  margin-right: 15px;
}

.todo-actions {
  display: flex;
  gap: 10px;
}

.todo-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.complete-btn {
  background: #28a745;
  color: white;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.complete-btn:hover {
  background: #218838;
}

.delete-btn:hover {
  background: #c82333;
}`;
}

function getCalculatorCSS(): string {
  return `.App {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Arial', sans-serif;
}

.calculator {
  background: #2c3e50;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  max-width: 300px;
}

.display {
  background: #34495e;
  color: white;
  font-size: 2.5em;
  text-align: right;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.buttons button {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 20px;
  font-size: 1.2em;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.buttons button:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.buttons button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}`;
}

function getWeatherAppCSS(): string {
  return `.App {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-align: center;
}

h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 2.5em;
}

.weather-container {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  border-radius: 20px;
  padding: 30px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.input-section {
  margin-bottom: 30px;
  display: flex;
  gap: 15px;
  justify-content: center;
  align-items: center;
}

.input-section select {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  color: #2c3e50;
  min-width: 150px;
}

.input-section button {
  padding: 12px 24px;
  background: #00b894;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s ease;
}

.input-section button:hover {
  background: #00a085;
}

.loading {
  font-size: 1.2em;
  color: #ddd;
}

.weather-info {
  text-align: center;
}

.weather-info h2 {
  font-size: 2em;
  margin-bottom: 20px;
  color: #fff;
}

.temperature {
  font-size: 4em;
  font-weight: bold;
  margin: 20px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.description {
  font-size: 1.5em;
  margin-bottom: 15px;
  opacity: 0.9;
}

.humidity {
  font-size: 1.2em;
  opacity: 0.8;
}`;
}

function getCounterCSS(): string {
  return `.App {
  text-align: center;
  padding: 50px;
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

h1 {
  color: white;
  font-size: 3em;
  margin-bottom: 40px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.counter {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 30px;
}

.counter button {
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  font-size: 2em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #e74c3c;
  color: white;
}

.counter button:hover {
  transform: scale(1.1);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.counter button:nth-child(3) {
  background: #27ae60;
}

.count {
  font-size: 3em;
  font-weight: bold;
  color: #2c3e50;
  min-width: 100px;
}

button:last-child {
  background: #f39c12;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 25px;
  font-size: 1.2em;
  cursor: pointer;
  transition: background 0.3s ease;
}

button:last-child:hover {
  background: #e67e22;
}`;
}

function getFormCSS(): string {
  return `.App {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 40px;
  font-size: 2.5em;
}

.form-container {
  background: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
}

.form-group {
  margin-bottom: 25px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #34495e;
  font-weight: 600;
  font-size: 1.1em;
}

input, textarea {
  width: 100%;
  padding: 15px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

textarea {
  resize: vertical;
  min-height: 120px;
}

button {
  background: #3498db;
  color: white;
  padding: 15px 40px;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.3s ease;
  width: 100%;
}

button:hover {
  background: #2980b9;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px solid #c3e6cb;
}`;
}

function getGalleryCSS(): string {
  return `.App {
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f8f9fa;
  min-height: 100vh;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 40px;
  font-size: 2.5em;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.gallery-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.gallery-image:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: pointer;
}

.modal-image {
  max-width: 90%;
  max-height: 90%;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}`;
}