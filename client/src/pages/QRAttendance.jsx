import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { Search, Loader2, CheckCircle, Ticket, User, QrCode } from "lucide-react";
import { apiUrl } from "../config/api";

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="section-heading mb-10">
      <p className="section-kicker">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      {text && <p className="section-copy">{text}</p>}
    </div>
  );
}

export default function QRAttendance() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Please enter a valid phone number or registration ID");
      return;
    }

    setLoading(true);
    setError("");
    setRegistration(null);

    try {
      const response = await axios.get(apiUrl(`/api/register/lookup/${encodeURIComponent(query.trim())}`));
      setRegistration(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("No registration found with that information. Please check and try again.");
      } else {
        setError("An error occurred while looking up your registration. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-10 min-h-screen flex flex-col">
      <section className="section-shell reveal-section pt-10 flex-grow flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto">
          
          <AnimatePresence mode="wait">
            {!registration ? (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="glass-card p-8 rounded-3xl border border-[#0D47A1]/10 shadow-xl bg-white/60 backdrop-blur-xl"
              >
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-[#0D47A1]/5 rounded-full flex items-center justify-center mb-4">
                    <QrCode className="h-8 w-8 text-[#0D47A1]" />
                  </div>
                  <h2 className="font-['Sora'] text-2xl font-bold text-[#081B33]">Get Your Entry QR Code</h2>
                  <p className="text-sm text-[#081B33]/60 mt-2">
                    Enter your registered phone number, email, or registration ID to fetch your check-in pass.
                  </p>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="block w-full pl-11 pr-4 py-4 rounded-xl border-gray-200 bg-white shadow-sm focus:border-[#0D47A1] focus:ring focus:ring-[#0D47A1] focus:ring-opacity-20 font-['DM_Sans'] outline-none transition"
                        placeholder="e.g., +91 9876543210 or GHC2026-0001"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-red-500 text-sm font-medium text-center">
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-[#0D47A1] hover:bg-[#081B33] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0D47A1] transition disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      "Find My Pass"
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 rounded-3xl border border-[#0D47A1]/10 shadow-xl bg-white/80 backdrop-blur-xl relative overflow-hidden text-center"
              >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-gradient-to-br from-[#4FC3F7]/30 to-[#0D47A1]/30 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-gradient-to-tr from-[#E91E63]/20 to-[#FFC107]/20 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10">
                  <h3 className="font-['Sora'] text-2xl font-bold text-[#081B33] mb-1">{registration.fullName}</h3>
                  <p className="text-sm font-medium text-[#081B33]/60 mb-6">{registration.registrationId}</p>

                  <div className="flex justify-center mb-8">
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 inline-block">
                      <QRCodeSVG
                        value={registration.registrationId}
                        size={220}
                        bgColor={"#ffffff"}
                        fgColor={"#081B33"}
                        level={"H"}
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-left bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-6">
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-[#0D47A1]" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Pass Type</p>
                        <p className="text-sm font-bold text-[#081B33]">{registration.ticketName || "General Admission"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                        <p className="text-sm font-bold text-[#081B33] capitalize">
                          {registration.attendanceStatus === 'checked_in' ? 'Checked In' : 'Ready for Check-in'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Please present this QR code at the registration desk for a smooth check-in experience.
                  </p>

                  <button
                    onClick={() => setRegistration(null)}
                    className="mt-6 text-sm font-semibold text-[#0D47A1] hover:text-[#081B33] underline transition"
                  >
                    Search another registration
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
