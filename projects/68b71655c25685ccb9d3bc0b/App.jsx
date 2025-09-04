import React, { useState } from 'react';
import './styles/App.css';

function App() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');

  const handleButtonClick = (value) => {
    if (value === 'AC') {
      setDisplay('0');
      setExpression('');
    } else if (value === '±') {
      setDisplay((parseFloat(display) * -1).toString());
    } else if (value === '%') {
      try {
        setDisplay((parseFloat(display) / 100).toString());
      } catch (error) {
        setDisplay('Error');
      }
    } else if (value === '=') {
      try {
        // eslint-disable-next-line no-eval
        const result = eval(expression + display);
        setDisplay(result.toString());
        setExpression('');
      } catch (error) {
        setDisplay('Error');
        setExpression('');
      }
    } else if (['+', '-', '*', '/'].includes(value)) {
      setExpression(expression + display + value);
      setDisplay('0');
    } else if (value === '.') {
      if (!display.includes('.')) {
        setDisplay(display + '.');
      }
    } else {
      setDisplay(display === '0' ? value : display + value);
    }
  };

  return (
    <div className="calculator">
      <div className="display">
        <div className="expression">{expression}</div>
        <div className="result">{display}</div>
      </div>
      <div className="buttons">
        <button className="btn btn-clear" onClick={() => handleButtonClick('AC')}>AC</button>
        <button className="btn btn-operator" onClick={() => handleButtonClick('±')}>±</button>
        <button className="btn btn-operator" onClick={() => handleButtonClick('%')}>%</button>
        <button className="btn btn-operator" onClick={() => handleButtonClick('/')}>/</button>

        <button className="btn btn-number" onClick={() => handleButtonClick('7')}>7</button>
        <button className="btn btn-number" onClick={() => handleButtonClick('8')}>8</button>
        <button className="btn btn-number" onClick={() => handleButtonClick('9')}>9</button>
        <button className="btn btn-operator" onClick={() => handleButtonClick('*')}>*</button>

        <button className="btn btn-number" onClick={() => handleButtonClick('4')}>4</button>
        <button className="btn btn-number" onClick={() => handleButtonClick('5')}>5</button>
        <button className="btn btn-number" onClick={() => handleButtonClick('6')}>6</button>
        <button className="btn btn-operator" onClick={() => handleButtonClick('-')}>-</button>

        <button className="btn btn-number" onClick={() => handleButtonClick('1')}>1</button>
        <button className="btn btn-number" onClick={() => handleButtonClick('2')}>2</button>
        <button className="btn btn-number" onClick={() => handleButtonClick('3')}>3</button>
        <button className="btn btn-operator" onClick={() => handleButtonClick('+')}>+</button>

        <button className="btn btn-number zero" onClick={() => handleButtonClick('0')}>0</button>
        <button className="btn btn-number" onClick={() => handleButtonClick('.')}>.</button>
        <button className="btn btn-equals" onClick={() => handleButtonClick('=')}>=</button>
      </div>
    </div>
  );
}

export default App;