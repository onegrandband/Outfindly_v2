import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from './Icons.jsx';

export function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select option',
  className = '',
  buttonClassName = '',
  menuClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 bg-[#12161f] hover:bg-[#1a212e] text-[#e6edf3] text-xs font-medium rounded-lg border border-[#30363d] hover:border-[#484f58] transition-all duration-150 cursor-pointer shadow-sm ${buttonClassName}`}
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-[#8b949e] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Animated Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 z-50 mt-1.5 min-w-[170px] bg-[#12161f] border border-[#30363d] rounded-xl shadow-2xl py-1 origin-top-right transform transition-all duration-150 animate-in fade-in zoom-in-95 ${menuClassName}`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#1f2937] text-white font-semibold'
                    : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && <CheckIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
