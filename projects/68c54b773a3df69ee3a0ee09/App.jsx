import React, { useState } from 'react';
import './styles/App.css';
import Header from './Components/Header.jsx'

function App() {
  const [displayValue, setDisplayValue] = useState('0');
  const [operator, setOperator] = useState(null);
  const [firstValue, setFirstValue] = useState(null);

  const handleNumberClick = (number) => {
    setDisplayValue(displayValue === '0' ? String(number) : displayValue + number);
  };

  const handleOperatorClick = (operatorValue) => {
    setOperator(operatorValue);
    setFirstValue(displayValue);
    setDisplayValue('0');
  };

  const handleEqualsClick = () => {
    if (operator && firstValue) {
      const num1 = parseFloat(firstValue);
      const num2 = parseFloat(displayValue);
      let result = 0;

      switch (operator) {
        case '+':
          result = num1 + num2;
          break;
        case '-':
          result = num1 - num2;
          break;
        case '*':
          result = num1 * num2;
          break;
        case '/':
          result = num1 / num2;
          break;
        default:
          break;
      }

      setDisplayValue(String(result));
      setOperator(null);
      setFirstValue(null);
    }
  };

  const handleClearClick = () => {
    setDisplayValue('0');
    setOperator(null);
    setFirstValue(null);
  };

  const handleDecimalClick = () => {
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const handlePercentageClick = () => {
    setDisplayValue(String(parseFloat(displayValue) / 100));
  };

  const handleSignChangeClick = () => {
    setDisplayValue(String(parseFloat(displayValue) * -1));
  };

  return (
    <div className="calculator">
      <div className="display">{displayValue}</div>
      <div className="buttons">
        <div className="row">
          <button className="clear" onClick={handleClearClick}>A<Header/>C</button>
          <button onClick={handleSignChangeClick}>+/-</button>
          <button onClick={handlePercentageClick}>%</button>
          <button className="operator" onClick={() => handleOperatorClick('/')}>/</button>
        </div>
        <div className="row">
          <button onClick={() => handleNumberClick(7)}>7</button>
          <button onClick={() => handleNumberClick(8)}>8</button>
          <button onClick={() => handleNumberClick(9)}>9</button>
          <button className="operator" onClick={() => handleOperatorClick('*')}>*</button>
        </div>
        <div className="row">
          <button onClick={() => handleNumberClick(4)}>4</button>
          <button onClick={() => handleNumberClick(5)}>5</button>
          <button onClick={() => handleNumberClick(6)}>6</button>
          <button className="operator" onClick={() => handleOperatorClick('-')}>-</button>
        </div>
        <div className="row">
          <button onClick={() => handleNumberClick(1)}>1</button>
          <button onClick={() => handleNumberClick(2)}>2</button>
          <button onClick={() => handleNumberClick(3)}>3</button>
          <button className="operator" onClick={() => handleOperatorClick('+')}>+</button>
        </div>
        <div className="row">
          <button className="zero" onClick={() => handleNumberClick(0)}>0</button>
          <button onClick={handleDecimalClick}>.</button>
          <button className="equals" onClick={handleEqualsClick}>=</button>
        </div>
      </div>
    </div>
  );
}

export default App;