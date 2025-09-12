import React, { useState } from 'react';
import { Button } from '../../components';
import './Home.css';

const Home = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="home">
      <header className="home__header">
        <h1 className="home__title">Welcome to React</h1>
        <p className="home__subtitle">
          A React application built with professional structure
        </p>
        
        <div className="home__counter">
          <h2>Counter Example</h2>
          <p className="home__count">Count: {count}</p>
          <div className="home__buttons">
            <Button 
              onClick={() => setCount(count + 1)}
              variant="primary"
            >
              Increment
            </Button>
            <Button 
              onClick={() => setCount(count - 1)}
              variant="secondary"
            >
              Decrement
            </Button>
            <Button 
              onClick={() => setCount(0)}
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="home__features">
          <h2>Project Features</h2>
          <ul>
            <li>✅ Professional folder structure</li>
            <li>✅ Reusable components with tests</li>
            <li>✅ CSS Modules for styling</li>
            <li>✅ Custom hooks ready</li>
            <li>✅ Context API setup</li>
            <li>✅ Service layer for API calls</li>
            <li>✅ Utility functions organized</li>
          </ul>
        </div>
      </header>
    </div>
  );
};

export default Home;