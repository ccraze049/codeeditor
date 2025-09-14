export default function TailwindTest() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold text-center">Tailwind CSS Test</h1>
      
      {/* Test basic colors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-red-500 text-white text-center rounded">Red 500</div>
        <div className="p-4 bg-blue-500 text-white text-center rounded">Blue 500</div>
        <div className="p-4 bg-green-500 text-white text-center rounded">Green 500</div>
      </div>
      
      {/* Test spacing */}
      <div className="mt-8 p-6 bg-purple-600 text-white text-center">
        Margin Top 8, Padding 6
      </div>
      
      {/* Test flexbox */}
      <div className="flex justify-between items-center h-20 bg-gray-200 px-4">
        <span className="text-black">Left</span>
        <span className="text-black">Center</span>
        <span className="text-black">Right</span>
      </div>
      
      {/* Test responsive design */}
      <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl bg-indigo-500 text-white p-4 text-center">
        Responsive Text (sm:base md:lg lg:xl xl:2xl)
      </div>
      
      {/* Test hover states */}
      <div className="text-center">
        <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200">
          Hover Button
        </button>
      </div>
      
      {/* Test shadow and border */}
      <div className="p-4 border-2 border-dashed border-gray-400 shadow-lg rounded-lg bg-white">
        Border, Shadow, and Rounded
      </div>
      
      {/* Test typography */}
      <div className="space-y-2">
        <p className="text-xs">Extra Small Text</p>
        <p className="text-sm">Small Text</p>
        <p className="text-base">Base Text</p>
        <p className="text-lg">Large Text</p>
        <p className="text-xl">Extra Large Text</p>
        <p className="text-2xl">2XL Text</p>
      </div>
      
      {/* Test advanced classes */}
      <div className="transform hover:scale-105 transition-transform duration-300 bg-yellow-400 p-4 rounded-xl">
        Transform and Transition Test
      </div>
    </div>
  );
}