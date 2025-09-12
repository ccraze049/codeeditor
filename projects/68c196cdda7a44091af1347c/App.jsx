import React, { useState } from 'react';
import './styles/App.css';

function App() {
  const [displayValue, setDisplayValue] = useState('0'); 
  const [operator, setOperator] = useState(null);
  const [firstValue, setFirstValue] = useState(null);

  const handleNumberClick = (number) => {
    setDisplayValue(displayValue === '0' ? String(number) : displayValue + number);
  };

  const handleOperatorClick = (newOperator) => {
    setOperator(newOperator);
    setFirstValue(parseFloat(displayValue));
    setDisplayValue('0');
  };

  const handleEqualsClick = () => {
    if (operator && firstValue) {
      const secondValue = parseFloat(displayValue);
      let result;

      switch (operator) {
        case '+':
          result = firstValue + secondValue;
          break;
        case '-':
          result = firstValue - secondValue;
          break;
        case '*':
          result = firstValue * secondValue;
          break;
        case '/':
          result = firstValue / secondValue;
          break;
        default:
          result = secondValue;
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

    const handleSignToggle = () => {
      setDisplayValue((parseFloat(displayValue) * -1).toString());
    };

  const buttons = [
        { text: 'AC', className: 'clear', onClick: handleClearClick },
        { text: '+/-', className: 'sign', onClick: handleSignToggle },
        { text: '%', className: 'percent', onClick: () => setDisplayValue(String(parseFloat(displayValue) / 100)) },
        { text: '/', className: 'operator', onClick: () => handleOperatorClick('/') },
        { text: '7', className: 'number', onClick: () => handleNumberClick(7) },
        { text: '8', className: 'number', onClick: () => handleNumberClick(8) },
        { text: '9', className: 'number', onClick: () => handleNumberClick(9) },
        { text: '*', className: 'operator', onClick: () => handleOperatorClick('*') },
        { text: '4', className: 'number', onClick: () => handleNumberClick(4) },
        { text: '5', className: 'number', onClick: () => handleNumberClick(5) },
        { text: '6', className: 'number', onClick: () => handleNumberClick(6) },
        { text: '-', className: 'operator', onClick: () => handleOperatorClick('-') },
        { text: '1', className: 'number', onClick: () => handleNumberClick(1) },
        { text: '2', className: 'number', onClick: () => handleNumberClick(2) },
        { text: '3', className: 'number', onClick: () => handleNumberClick(3) },
        { text: '+', className: 'operator', onClick: () => handleOperatorClick('+') },
        { text: '0', className: 'number zero', onClick: () => handleNumberClick(0) },
        { text: '.', className: 'decimal', onClick: handleDecimalClick },
        { text: '=', className: 'equals', onClick: handleEqualsClick },
    ];

  return (
    <div className="calculator">
      <div className="display">{displayValue}</div>
      <div className="buttons">
        {buttons.map((button, index) => (
          <button
            key={index}
            className={button.className}
            onClick={button.onClick}
          >
            {button.text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;