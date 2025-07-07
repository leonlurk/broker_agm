import React from 'react';

const HeroSection = ({ name, strategy, philosophy }) => {
  return (
    <div className="bg-[#232323] p-6 rounded-lg shadow-lg border border-[#333]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white">{name}</h1>
          <p className="text-lg text-gray-400 mt-1">{strategy}</p>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">{philosophy}</p>
        </div>
        <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
          <button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300">
            Invertir Ahora
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 