import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-center">
      <header className="bg-white/95 backdrop-blur-sm p-10 rounded-3xl m-5 shadow-2xl text-gray-800">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to React tailwind test!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          This is your React application built with CodeSpace IDE.
        </p>
        
        <div className="my-8 p-6 border-2 border-dashed border-blue-500 rounded-xl bg-blue-50/50">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Counter Example</h2>
          <p className="text-2xl font-bold text-blue-600 my-4">
            Count: {count}
          </p>
          
          <div className="flex gap-3 justify-center flex-wrap">
            <button 
              onClick={() => setCount(count + 1)}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Increment
            </button>
            <button 
              onClick={() => setCount(count - 1)}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Decrement  
            </button>
            <button 
              onClick={() => setCount(0)}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Reset
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-gray-600">
          <p className="mb-2">
            Edit <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono text-sm">App.jsx</code> to customize this application.
          </p>
          <p>
            Your React app with Tailwind CSS is ready to use! 🚀
          </p>
        </div>

        {/* Test specific utility classes that user mentioned */}
        <div className="mt-6 border-4 border-red-500 bg-yellow-100">
          <h3 className="text-xl font-bold p-4 bg-green-200">🧪 UTILITY CLASSES TEST</h3>
          
          {/* Width and Height Test */}
          <div className="p-6 bg-blue-100">
            <h4 className="text-lg font-semibold mb-4">Width & Height Test:</h4>
            <div className="w-32 h-16 bg-red-500 mb-2">w-32 h-16</div>
            <div className="w-48 h-12 bg-green-500 mb-2">w-48 h-12</div>
            <div className="w-64 h-20 bg-blue-500 mb-2">w-64 h-20</div>
            <div className="w-full h-8 bg-purple-500">w-full h-8</div>
          </div>

          {/* Padding Test */}
          <div className="p-6 bg-orange-100">
            <h4 className="text-lg font-semibold mb-4">Padding Test:</h4>
            <div className="p-2 bg-red-400 inline-block mr-2">p-2</div>
            <div className="p-4 bg-green-400 inline-block mr-2">p-4</div>
            <div className="p-6 bg-blue-400 inline-block mr-2">p-6</div>
            <div className="px-8 py-2 bg-purple-400 inline-block">px-8 py-2</div>
          </div>

          {/* Margin Test */}
          <div className="p-6 bg-pink-100">
            <h4 className="text-lg font-semibold mb-4">Margin Test:</h4>
            <div className="m-2 p-2 bg-red-400 inline-block">m-2</div>
            <div className="m-4 p-2 bg-green-400 inline-block">m-4</div>
            <div className="mx-6 my-2 p-2 bg-blue-400 inline-block">mx-6 my-2</div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;