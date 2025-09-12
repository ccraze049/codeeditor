import React from 'react';
import { ThemeProvider } from './context';
import { MainLayout } from './layouts';
import { Home } from './pages';
import './styles/globals.css';
import './styles/variables.css';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <MainLayout>
        <Home />
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;