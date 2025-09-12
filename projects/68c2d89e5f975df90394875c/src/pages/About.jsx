import React from 'react';

const About = () => {
  return (
    <div style={{ 
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      lineHeight: '1.6'
    }}>
      <h1>About React </h1>
      
      <section style={{ marginBottom: '2rem' }}>
        <h2>Project Overview</h2>
        <p>
          This React application was created using CodeSpace IDE, a comprehensive 
          browser-based development environment. The project follows modern React 
          best practices and provides a clean, organized structure for building 
          scalable web applications.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Features</h2>
        <ul>
          <li>✅ Clean and organized file structure</li>
          <li>✅ Reusable React components</li>
          <li>✅ Modern ES6+ JavaScript</li>
          <li>✅ Responsive design principles</li>
          <li>✅ Component-based architecture</li>
          <li>✅ Development-ready setup</li>
        </ul>
      </section>

      <section>
        <h2>Getting Started</h2>
        <p>
          To customize this application, explore the <code>src/</code> directory:
        </p>
        <ul>
          <li><strong>components/</strong> - Add your reusable UI components here</li>
          <li><strong>pages/</strong> - Create new pages and routes</li>
          <li><strong>assets/</strong> - Store images, fonts, and other static files</li>
        </ul>
      </section>
    </div>
  );
};

export default About;