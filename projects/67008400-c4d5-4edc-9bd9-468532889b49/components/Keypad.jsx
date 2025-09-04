import React from 'react';
import '../styles/Keypad.css';

function Keypad({ onNumberClick, onOperatorClick, onEqualsClick, onClearClick }) {
  const numbers = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'];
  const operators = ['+', '-', '*', '/'];
  
  return (
    <div className="keypad">
      {numbers.map((num, index) => (
        <button key={index} onClick={() => onNumberClick(num)}>
          {num}
        </button>
      ))}
      {operators.map((op, index) => (
        <button key={index} onClick={() => onOperatorClick(op)}>
          {op}
        </button>
      ))}
      <button onClick={onEqualsClick}>=</button>
      <button onClick={onClearClick}>C</button>
    </div>
  );
}

export default Keypad;