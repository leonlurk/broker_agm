import React, { useState, useRef, useEffect } from 'react';

const CustomTooltip = ({ content, children, position = 'auto' }) => {
  const [tooltipPosition, setTooltipPosition] = useState('right');
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (position !== 'auto') {
      setTooltipPosition(position);
      return;
    }
    
    const checkPosition = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // Si está en el tercio derecho de la pantalla, mostrar a la izquierda
      if (rect.right > viewportWidth * 0.7) {
        setTooltipPosition('left');
      } else {
        setTooltipPosition('right');
      }
    };
    
    checkPosition();
    window.addEventListener('resize', checkPosition);
    
    return () => window.removeEventListener('resize', checkPosition);
  }, [position]);
  
  const tooltipClasses = tooltipPosition === 'left' 
    ? `
        absolute right-full top-1/2 -translate-y-1/2 
        mr-3 
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
        z-50
        origin-right
      `
    : `
        absolute left-full top-1/2 -translate-y-1/2 
        ml-3 
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
        z-50
        origin-left
      `;
      
  const arrowClasses = tooltipPosition === 'left'
    ? `absolute right-0 top-1/2 translate-x-full -translate-y-1/2 
       w-0 h-0 
       border-y-[6px] border-y-transparent 
       border-l-[6px] border-l-gray-800`
    : `absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 
       w-0 h-0 
       border-y-[6px] border-y-transparent 
       border-r-[6px] border-r-gray-800`;
  
  return (
    <div className="relative flex items-center group" ref={containerRef}>
      {children}
      <div className={tooltipClasses}>
        {content}
        <div className={arrowClasses}></div>
      </div>
    </div>
  );
};

export default CustomTooltip; 