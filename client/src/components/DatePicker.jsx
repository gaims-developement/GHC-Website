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
    <div className="space-y-1.5 font-['DM_Sans'] relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-[#344054] mb-2 flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-[#6C4AB6]" /> {label} {required && <span className="text-[#e244b7]">*</span>}
      </label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white text-[#101828] border ${isOpen ? 'border-[#6C4AB6] ring-2 ring-[#6C4AB6]/20' : error ? 'border-red-400' : 'border-gray-300 hover:border-[#6C4AB6]/60'} rounded-xl px-4 py-3 cursor-pointer transition-all flex items-center justify-between outline-none relative z-20 shadow-sm`}
      >
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-semibold text-[#6C4AB6]">{placeholder}</span>
            <span className="text-sm font-semibold text-[#101828]">{selectedDate ? formatDateString(selectedDate) : "Select date"}</span>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>
      
      {error && <p className="text-red-500 text-sm mt-1 font-medium">{error}</p>}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl p-5 shadow-2xl z-50 border border-gray-200"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[#101828]">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex gap-1.5">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 mb-3">
              {dayNames.map((day, i) => (
                <div key={i} className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 mb-5">
              {days.map((item, i) => {
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth() + item.offset, item.day);
                const isSelected = isSameDate(selectedDate, dateObj);
                
                return (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); handleDateClick(item.day, item.isCurrentMonth, item.offset); }}
                    className={`h-9 w-9 mx-auto flex items-center justify-center rounded-xl text-xs font-semibold transition-all
                      ${isSelected 
                        ? 'bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] text-white shadow-md shadow-[#6C4AB6]/30 font-bold scale-105' 
                        : item.isCurrentMonth 
                          ? 'text-[#101828] hover:bg-[#6C4AB6]/10 hover:text-[#6C4AB6]' 
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
            <div className="flex gap-3">
              <button 
                onClick={handleRemove}
                className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors text-xs"
              >
                Clear
              </button>
              <button 
                onClick={handleDone}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] hover:opacity-95 text-white rounded-xl font-bold transition-all shadow-md shadow-[#6C4AB6]/20 text-xs"
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
