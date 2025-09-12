import React from 'react';

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;