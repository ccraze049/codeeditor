import React from 'react';
import './styles/App.css';

function App() {
  const products = [
    { id: 1, name: 'Product 1', description: 'Description of Product 1', price: 25 },
    { id: 2, name: 'Product 2', description: 'Description of Product 2', price: 50 },
    { id: 3, name: 'Product 3', description: 'Description of Product 3', price: 75 },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <nav className="app-nav">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <main className="app-main">
        <section className="product-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p className="product-price">${product.price}</p>
              <button>Add to Cart</button>
            </div>
          ))}
        </section>
      </main>

      <footer className="app-footer">
        <p>&copy; 2025 Sakir</p>
      </footer>
    </div>
  );
}

export default App;