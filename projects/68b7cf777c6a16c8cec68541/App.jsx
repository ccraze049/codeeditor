import React, { useState } from 'react';
import './styles/App.css';

function App() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');

  const handleNumberClick = (number) => {
    if (display === '0') {
      setDisplay(number);
    } else {
      setDisplay(display + number);
    }
    setExpression(expression + number);
  };

  const handleOperatorClick = (operator) => {
    setDisplay(operator);
    setExpression(expression + operator);
  };

  const handleEqualsClick = () => {
    try {
      const result = eval(expression);
      setDisplay(String(result));
      setExpression(String(result));
    } catch (error) {
      setDisplay('Error');
      setExpression('');
    }
  };

  const handleClearClick = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleDecimalClick = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
      setExpression(expression + '.');
    }
  };

  return (
    <div className="calculator">
      <div className="display">
        {display}
      </div>
      <div className="buttons">
        <button className="clear" onClick={handleClearClick}>AC</button>
        <button className="operator" onClick={() => handleOperatorClick('/')}>/</button>
        <button className="operator" onClick={() => handleOperatorClick('*')}>*</button>
        <button onClick={() => handleNumberClick('7')}>7</button>
        <button onClick={() => handleNumberClick('8')}>8</button>
        <button onClick={() => handleNumberClick('9')}>9</button>
        <button className="operator" onClick={() => handleOperatorClick('-')}>-</button>
        <button onClick={() => handleNumberClick('4')}>4</button>
        <button onClick={() => handleNumberClick('5')}>5</button>
        <button onClick={() => handleNumberClick('6')}>6</button>
        <button className="operator" onClick={() => handleOperatorClick('+')}>+</button>
        <button onClick={() => handleNumberClick('1')}>1</button>
        <button onClick={() => handleNumberClick('2')}>2</button>
        <button onClick={() => handleNumberClick('3')}>3</button>
        <button className="equals" onClick={handleEqualsClick}>=</button>
        <button onClick={() => handleNumberClick('0')}>0</button>
        <button onClick={handleDecimalClick}>.</button>
      </div>
    </div>
  );
}

export default App;