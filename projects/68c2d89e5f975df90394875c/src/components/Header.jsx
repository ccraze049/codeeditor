import React from 'react';

const Header = () => {
  return (
    <header style={{ 
      background: '#282c34', 
      color: 'white', 
      padding: '1rem',
      textAlign: 'center'
    }}>
      <h1>Welcome to React</h1>
      <nav>
        <a href="#home" style={{ color: 'white', margin: '0 1rem' }}>Home</a>
        <a href="#about" style={{ color: 'white', margin: '0 1rem' }}>About</a>
      </nav>
    </header>
  );
};

export default Header;