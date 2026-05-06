import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ options, value, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-surface-raised/40 backdrop-blur-xl border border-subtle px-5 py-3 rounded-2xl shadow-lg hover:border-accent-glow/50 transition-all min-w-[160px] justify-between group"
      >
        <div className="flex flex-col items-start">
          {label && <span className="text-[9px] font-black text-tertiary uppercase tracking-widest leading-none mb-1">{label}</span>}
          <span className="text-sm font-bold text-primary group-hover:text-accent-glow transition-colors">{selectedOption.label}</span>
        </div>
        <ChevronDown size={16} className={`text-tertiary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-surface-raised border border-default rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200 z-[100] backdrop-blur-3xl">
          <div className="p-1.5">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${value === option.value 
                    ? 'bg-accent-glow text-white shadow-lg' 
                    : 'text-secondary hover:bg-surface-inset hover:text-primary'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
