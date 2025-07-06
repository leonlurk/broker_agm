import React from 'react';

const CustomTooltip = ({ content, children }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="
        absolute bottom-full left-1/2 -translate-x-1/2 
        mb-3 
        w-max max-w-xs
        px-3 py-2
        bg-gradient-to-br from-gray-800 to-gray-900
        text-gray-100
        text-sm
        rounded-lg
        shadow-xl shadow-cyan-500/10
        border border-cyan-400/40
        opacity-0 group-hover:opacity-100
        transform scale-95 group-hover:scale-100
        transition-all duration-200 ease-in-out
        pointer-events-none 
        z-20
        origin-bottom
      ">
        {content}
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 
          w-0 h-0 
          border-x-[6px] border-x-transparent 
          border-t-[6px] border-t-gray-800"
        ></div>
      </div>
    </div>
  );
};

export default CustomTooltip; 