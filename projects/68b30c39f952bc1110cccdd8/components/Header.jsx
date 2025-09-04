import React from 'react';

function Header({ toggleDarkMode, darkMode }) {
  return (
    <header className={`header ${darkMode ? 'dark-mode' : ''}`}>
      <div className="logo">Tudo</div>
      <nav className="nav">
        <ul>
          <li><a href="#">Home</a></li>
          <li><a href="#">Features</a></li>
          <li><a href="#">Testimonials</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </nav>
      <button className="dark-mode-toggle" onClick={toggleDarkMode}>
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
    </header>
  );
}

export default Header;