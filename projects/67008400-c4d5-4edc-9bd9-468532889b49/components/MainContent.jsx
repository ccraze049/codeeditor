import React from 'react';
import '../styles/MainContent.css';

function MainContent() {
  const [currentValue, setCurrentValue] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForNextValue, setWaitingForNextValue] = useState(false);

  const handleNumberClick = (value) => {
    if (waitingForNextValue) {
      setCurrentValue(value);
      setWaitingForNextValue(false);
    } else {
      setCurrentValue(currentValue === '0' ? value : currentValue + value);
    }
  };

  const handleOperatorClick = (op) => {
    if (operator) {
      const result = calculate(previousValue, Number(currentValue), operator);
      setPreviousValue(result);
      setOperator(op);
      setCurrentValue('0');
    } else {
      setPreviousValue(Number(currentValue));
      setOperator(op);
      setCurrentValue('0');
      setWaitingForNextValue(true);
    }
  };

  const handleEqualsClick = () => {
    if (operator && previousValue) {
      const result = calculate(previousValue, Number(currentValue), operator);
      setCurrentValue(result.toString());
      setPreviousValue(null);
      setOperator(null);
    }
  };

  const calculate = (a, b, op) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      default: return 0;
    }
  };

  const handleClearClick = () => {
    setCurrentValue('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNextValue(false);
  };

  return (
    <div className="main-content">
      <Display value={currentValue} />
      <Keypad 
        onNumberClick={handleNumberClick}
        onOperatorClick={handleOperatorClick}
        onEqualsClick={handleEqualsClick}
        onClearClick={handleClearClick}
      />
    </div>
  );
}

export default MainContent;