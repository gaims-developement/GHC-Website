import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Calendar, Clock, MapPin, User, Award, X } from 'lucide-react';

const apiUrl = (path) => `${import.meta.env.VITE_API_URL || ''}${path}`;

const resolveImageUrl = (img) => {
  if (!img) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  return apiUrl(img);
};

const days = [
  { id: 'Day 1', label: 'Day 1', date: 'November 22, 2026' },
  { id: 'Day 2', label: 'Day 2', date: 'November 23, 2026' },
  { id: 'Day 3', label: 'Day 3', date: 'November 24, 2026' }
];

const Schedule = () => {
  const [searchParams] = useSearchParams();
  const [activeDay, setActiveDay] = useState(() => {
    const dayParam = searchParams.get("day");
    const normalized = { day1: "Day 1", day2: "Day 2", day3: "Day 3" }[dayParam] || dayParam;
    return ["Day 1", "Day 2", "Day 3"].includes(normalized) ? normalized : "Day 1";
  });
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await axios.get(apiUrl('/api/schedules'));
        if (response.data.success && Array.isArray(response.data.data)) {
          setSchedules(response.data.data);
        } else {
          setSchedules([]);
        }
      } catch (err) {
        console.error("Error fetching schedules:", err);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  const filteredSchedules = schedules.filter((event) => {
    if (event.day === activeDay) return true;
    if (activeDay === 'Day 1' && (!event.day || event.day.includes('1') || event.date?.includes('22'))) return true;
    if (activeDay === 'Day 2' && (event.day?.includes('2') || event.date?.includes('23'))) return true;
    if (activeDay === 'Day 3' && (event.day?.includes('3') || event.date?.includes('24'))) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="pt-32 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16">
          <div className="max-w-xl">
            <p className="text-[#e244b7] text-sm font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#e244b7] rounded-full"></span>
              SCHEDULE DETAILS
            </p>
            <h1 className="text-4xl md:text-5xl font-['Outfit'] font-extrabold text-[#101828] leading-tight">
              Information of Event <br /> Schedules
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 overflow-x-auto pb-2 w-full lg:w-auto">
            {days.map((day) => (
              <button
                key={day.id}
                onClick={() => setActiveDay(day.id)}
                className={`relative px-8 py-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300 shrink-0 ${
                  activeDay === day.id
                    ? 'bg-[#6C4AB6] text-white shadow-lg transform -translate-y-1'
                    : 'bg-white text-[#475467] hover:bg-gray-50 hover:-translate-y-1'
                }`}
              >
                <span className={`font-bold text-lg ${activeDay === day.id ? 'text-white' : 'text-[#101828]'}`}>
                  {day.label}
                </span>
                <span className={`text-xs mt-1 ${activeDay === day.id ? 'text-white/80' : 'text-gray-500'}`}>
                  {day.date}
                </span>
                {/* Active arrow pointer */}
                {activeDay === day.id && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#6C4AB6] rotate-45 rounded-sm"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e244b7]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredSchedules.map((event) => (
              <div 
                key={event._id || event.id} 
                className="bg-white rounded-2xl flex flex-col sm:flex-row overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 relative group border border-gray-100"
              >
                {/* Image */}
                <div className="w-full sm:w-2/5 p-4 sm:pr-0">
                  <div className="w-full h-48 sm:h-full min-h-[190px] rounded-xl overflow-hidden relative bg-gray-100">
                    <img 
                      src={resolveImageUrl(event.imageUrl || event.image_url)} 
                      alt={event.title} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {event.sessionType && (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white">
                        {event.sessionType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="w-full sm:w-3/5 p-6 sm:p-7 flex flex-col justify-center">
                  {/* Badges: Track & CME Points */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {event.track && (
                      <span 
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${event.trackColor || '#6C4AB6'}18`,
                          color: event.trackColor || '#6C4AB6',
                          border: `1px solid ${event.trackColor || '#6C4AB6'}30`
                        }}
                      >
                        {event.track}
                      </span>
                    )}
                    {Number(event.cmePoints || event.cme_credit_points || event.cme) > 0 && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        {event.cmePoints || event.cme_credit_points || event.cme} CME Points
                      </span>
                    )}
                  </div>

                  <h3 className="font-['Outfit'] font-bold text-xl sm:text-2xl text-[#101828] mb-2 leading-snug">
                    {event.title}
                  </h3>

                  {event.speaker && (
                    <div className="flex items-center gap-2 text-sm text-[#475467] mb-2">
                      <User className="w-4 h-4 text-[#6C4AB6] shrink-0" />
                      <span className="font-medium text-[#101828]">{event.speaker}</span>
                      {event.speakerDesignation && <span className="text-gray-400 text-xs">·</span>}
                      {event.speakerDesignation && (
                        <span className="text-xs text-gray-500 truncate max-w-[180px]">{event.speakerDesignation}</span>
                      )}
                    </div>
                  )}

                  <p className="text-[#475467] text-sm leading-relaxed mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#475467] mt-auto pt-2">
                    <span className="flex items-center gap-1.5 text-[#6C4AB6] font-semibold">
                      <Clock className="w-4 h-4" />
                      {event.time}
                    </span>
                    {(event.hall || event.location) && (
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="w-4 h-4 text-[#e244b7]" />
                        {event.hall || event.location}
                      </span>
                    )}
                    {Number(event.cmePoints || event.cme_credit_points || event.cme) > 0 && (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        {event.cmePoints || event.cme_credit_points || event.cme} CME Points
                      </span>
                    )}
                  </div>
                </div>

                {/* Pink Arrow Button */}
                <button 
                  type="button"
                  aria-label="View session details"
                  className="absolute bottom-0 right-0 w-14 h-14 bg-[#e244b7] rounded-tl-[1.75rem] flex items-center justify-center cursor-pointer hover:bg-[#c9369e] transition-colors"
                  onClick={() => setSelectedSession(event)}
                >
                  <ArrowUpRight className="text-white w-5 h-5" />
                </button>
              </div>
            ))}
            
            {schedules.length === 0 ? (
              <div className="col-span-full py-20 px-6 text-center bg-white rounded-3xl border border-gray-200/80 shadow-sm max-w-2xl mx-auto my-6">
                <div className="w-16 h-16 rounded-2xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#101828] font-['Outfit'] mb-3">
                  Schedule will be revealed soon
                </h3>
                <p className="text-base sm:text-lg text-[#475467] leading-relaxed max-w-lg mx-auto">
                  The schedule for Global Healthcare Conclave 2026 is currently being finalized and will be revealed soon.
                </p>
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="col-span-full py-20 px-6 text-center bg-white rounded-3xl border border-gray-200/80 shadow-sm max-w-2xl mx-auto my-6">
                <div className="w-16 h-16 rounded-2xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#101828] font-['Outfit'] mb-3">
                  Schedule will be revealed soon
                </h3>
                <p className="text-base sm:text-lg text-[#475467] leading-relaxed max-w-lg mx-auto">
                  The schedule for {activeDay} will be revealed soon. Please check back shortly or explore other days.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Session Details Modal */}
        {selectedSession && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSession(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => setSelectedSession(null)}
                aria-label="Close modal"
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {selectedSession.sessionType && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                    {selectedSession.sessionType}
                  </span>
                )}
                {selectedSession.track && (
                  <span 
                    className="px-2.5 py-1 rounded-md text-xs font-semibold"
                    style={{
                      backgroundColor: `${selectedSession.trackColor || '#6C4AB6'}18`,
                      color: selectedSession.trackColor || '#6C4AB6'
                    }}
                  >
                    {selectedSession.track}
                  </span>
                )}
                {Number(selectedSession.cmePoints || selectedSession.cme_credit_points || selectedSession.cme) > 0 && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedSession.cmePoints || selectedSession.cme_credit_points || selectedSession.cme} CME Points
                  </span>
                )}
              </div>

              <h2 className="font-['Outfit'] font-bold text-2xl sm:text-3xl text-[#101828] mb-4">
                {selectedSession.title}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl mb-6 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-[#6C4AB6]" />
                  <span><strong>Time:</strong> {selectedSession.time}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-[#6C4AB6]" />
                  <span><strong>Date:</strong> {selectedSession.date} ({selectedSession.day})</span>
                </div>
                {(selectedSession.hall || selectedSession.location) && (
                  <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-[#e244b7]" />
                    <span><strong>Hall / Venue:</strong> {selectedSession.hall || selectedSession.location} {selectedSession.hallLocation ? `(${selectedSession.hallLocation})` : ''}</span>
                  </div>
                )}
                {Number(selectedSession.cmePoints || selectedSession.cme_credit_points || selectedSession.cme) > 0 && (
                  <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200/80 sm:col-span-2 font-medium">
                    <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>CME Points:</strong> {selectedSession.cmePoints || selectedSession.cme_credit_points || selectedSession.cme} CME Points</span>
                  </div>
                )}
              </div>

              {selectedSession.speaker && (
                <div className="mb-6 p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                  <img 
                    src={resolveImageUrl(selectedSession.imageUrl || selectedSession.image_url)} 
                    alt={selectedSession.speaker}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80';
                    }}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#6C4AB6]/20"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{selectedSession.speaker}</h4>
                    <p className="text-xs text-gray-500">
                      {[selectedSession.speakerDesignation, selectedSession.speakerOrganization].filter(Boolean).join(' · ') || 'Featured Speaker'}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">About This Session</h4>
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                  {selectedSession.description || 'No detailed description provided.'}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Schedule;
