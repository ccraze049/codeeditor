import React, { useState } from 'react';
import Button from '../components/Button';

const Home = () => {
  const [count, setCount] = useState(0);

  return (
    <div style={{ 
      textAlign: 'center',
      padding: '2rem',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1>Welcome to React!</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
        This is your React application built with CodeSpace IDE.
      </p>
      
      <div style={{ 
        margin: '2rem 0',
        padding: '2rem',
        border: '2px dashed #e0e0e0',
        borderRadius: '8px',
        minWidth: '300px'
      }}>
        <h2>Counter Example</h2>
        <p style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#007bff',
          margin: '1rem 0' 
        }}>
          Count: {count}
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
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

      <div style={{ marginTop: '2rem' }}>
        <h3>Ready to Build Amazing Things!</h3>
        <p>Edit <code>src/pages/Home.jsx</code> to get started.</p>
      </div>
    </div>
  );
};

export default Home;