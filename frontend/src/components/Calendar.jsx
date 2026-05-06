import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function Calendar({ selectedDate, onDateChange, highlightedDates = [] }) {
  const [viewDate, setViewDate] = useState(selectedDate ? new Date(selectedDate) : new Date());

  const formatDate = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    
    const result = [];
    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      result.push(null);
    }
    for (let i = 1; i <= days; i++) {
      result.push(new Date(year, month, i));
    }
    return result;
  }, [viewDate]);

  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const year = viewDate.getFullYear();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return formatDate(date) === selectedDate;
  };

  const isToday = (date) => {
    if (!date) return false;
    return formatDate(date) === formatDate(new Date());
  };

  const hasSession = (date) => {
    if (!date) return false;
    return highlightedDates.includes(formatDate(date));
  };

  return (
    <div className="card p-6 bg-surface backdrop-blur-3xl border-white/5 relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-glow/10 blur-[80px] pointer-events-none group-hover:bg-accent-glow/20 transition-all duration-700" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-glow/10 flex items-center justify-center text-accent-glow border border-accent-glow/20">
            <CalendarIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-primary tracking-tight uppercase leading-none">
              {monthName}
            </h3>
            <p className="text-[10px] text-tertiary font-bold tracking-widest mt-1 uppercase opacity-60">
              {year}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-raised border border-subtle hover:border-accent-glow/40 text-tertiary hover:text-primary transition-all active:scale-95">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-raised border border-subtle hover:border-accent-glow/40 text-tertiary hover:text-primary transition-all active:scale-95">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3 relative z-10">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] font-black text-tertiary text-center py-2 uppercase tracking-[0.2em] opacity-30">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 relative z-10">
        {daysInMonth.map((date, i) => {
          if (!date) return <div key={i} className="aspect-square" />;
          
          const selected = isSelected(date);
          const today = isToday(date);
          const session = hasSession(date);
          
          return (
            <button
              key={i}
              onClick={() => onDateChange(formatDate(date))}
              className={`
                aspect-square rounded-xl text-[11px] font-bold transition-all relative group/day
                flex flex-col items-center justify-center gap-0.5
                ${selected 
                  ? 'bg-accent-glow text-white shadow-[0_8px_20px_rgba(139,92,246,0.4)] scale-105 z-10' 
                  : 'text-secondary hover:bg-surface-raised hover:text-primary border border-transparent hover:border-white/5'}
                ${today && !selected ? 'ring-1 ring-accent-glow/40 ring-inset' : ''}
              `}
            >
              {date.getDate()}
              {session && !selected && (
                <div className="w-1 h-1 rounded-full bg-accent-glow shadow-[0_0_8px_var(--accent-glow)] animate-pulse" />
              )}
              
              {/* Tooltip hint on hover */}
              {session && !selected && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-void border border-subtle rounded text-[9px] font-black text-primary opacity-0 group-hover/day:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  SESSION
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
