import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

const DatePicker = ({ label, field, value, onChange, required, error, placeholder = "Select a day" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  // Adjust to start week on Monday (1) instead of Sunday (0)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

  const handlePrevMonth = (e) => {
    e.preventDefault();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day, isCurrentMonth = true, offset = 0) => {
    let newDate;
    if (isCurrentMonth) {
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    } else {
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, day);
    }
    
    // Create string in YYYY-MM-DD format based on local time
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(newDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    setSelectedDate(newDate);
    onChange(field, dateString);
  };

  const handleDone = (e) => {
    e.preventDefault();
    setIsOpen(false);
  };

  const handleRemove = (e) => {
    e.preventDefault();
    setSelectedDate(null);
    onChange(field, "");
    setIsOpen(false);
  };

  const formatDateString = (date) => {
    if (!date) return "";
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["M", "T", "W", "T", "F", "S", "S"];

  // Generate days array
  const days = [];
  
  // Previous month trailing days
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false, offset: -1 });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true, offset: 0 });
  }
  
  // Next month leading days (to fill 42 cells - 6 rows)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, isCurrentMonth: false, offset: 1 });
  }

  const isSameDate = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  return (
    <div className="space-y-2 font-['DM_Sans'] relative" ref={containerRef}>
      <label className="text-sm font-bold text-white/90 uppercase tracking-wider ml-1 flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-blue-400" /> {label} {required && <span className="text-[#ff3d7f]">*</span>}
      </label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#051329] text-white border ${isOpen ? 'border-blue-400' : error ? 'border-red-500/50' : 'border-blue-500/20 hover:border-blue-400'} rounded-2xl px-5 py-4 cursor-pointer transition-all flex items-center justify-between outline-none relative z-20 ${isOpen ? 'ring-4 ring-blue-500/10' : ''}`}
      >
        <div className="flex items-center gap-4">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-blue-400">{placeholder}</span>
            <span className="text-base font-bold">{selectedDate ? formatDateString(selectedDate) : "Select date"}</span>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </div>
      
      {error && <p className="text-red-400 text-sm ml-2 font-medium">{error}</p>}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white rounded-[2rem] p-6 shadow-2xl z-50 border border-gray-100"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 mb-4">
              {dayNames.map((day, i) => (
                <div key={i} className="text-center text-sm font-bold text-gray-800">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-y-2 gap-x-1 mb-6">
              {days.map((item, i) => {
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth() + item.offset, item.day);
                const isSelected = isSameDate(selectedDate, dateObj);
                
                return (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); handleDateClick(item.day, item.isCurrentMonth, item.offset); }}
                    className={`h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm font-semibold transition-all
                      ${isSelected 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40 scale-110' 
                        : item.isCurrentMonth 
                          ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' 
                          : 'text-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button 
                onClick={handleRemove}
                className="flex-1 py-3 px-4 bg-gray-400 hover:bg-gray-500 text-white rounded-2xl font-bold transition-colors"
              >
                Remove
              </button>
              <button 
                onClick={handleDone}
                className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold transition-colors shadow-lg shadow-blue-500/30"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatePicker;
