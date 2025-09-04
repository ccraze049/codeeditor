import React from 'react';
import '../styles/Display.css';

function Display({ value }) {
  return (
    <div className="display">{value}</div>
  );
}

export default Display;