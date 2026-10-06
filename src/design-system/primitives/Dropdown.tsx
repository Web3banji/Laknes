import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface DropdownProps<T extends string = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select option',
  className = '',
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative text-left ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-neutral-800 mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-3 bg-white border border-neutral-200 hover:border-neutral-300 rounded-md text-sm text-neutral-900 flex items-center justify-between gap-2 transition-colors focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-30 mt-1 w-full min-w-[200px] bg-white rounded-md border border-neutral-200 shadow-lg py-1 max-h-60 overflow-y-auto"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-50 text-neutral-950 font-medium'
                    : 'text-neutral-700 hover:bg-neutral-100/70 hover:text-neutral-950'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0 text-neutral-500">{opt.icon}</span>}
                  <div>
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-xs text-neutral-400 truncate">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-neutral-900 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
