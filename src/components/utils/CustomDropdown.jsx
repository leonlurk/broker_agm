import React, { useState, useEffect, useRef } from 'react';

const CustomDropdown = ({ options, selectedValue, onSelect, label, dropdownClass = 'w-full' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState('down');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
  };

  const calculateDropdownDirection = () => {
    if (!buttonRef.current) return 'down';
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(240, options.length * 48); // Altura estimada del dropdown
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    // Si no hay suficiente espacio abajo pero sí arriba, abrir hacia arriba
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      return 'up';
    }
    
    return 'down';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const direction = calculateDropdownDirection();
      setDropdownDirection(direction);
    }
  }, [isOpen, options.length]);

  const selectedLabel = options.find(opt => opt.value === selectedValue)?.label || label;

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="block text-gray-400 text-xs sm:text-sm mb-2">{label}</label>}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 sm:px-4 py-2 text-white text-left flex justify-between items-center"
      >
        <span className="truncate">{selectedLabel}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute z-20 bg-[#2d2d2d] border border-[#444] rounded-lg shadow-lg max-h-60 overflow-y-auto ${dropdownClass} ${
          dropdownDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer text-sm ${selectedValue === option.value ? 'bg-[#3f3f3f] text-white' : 'text-gray-300'}`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown; 