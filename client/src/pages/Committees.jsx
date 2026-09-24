import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ExternalLink, Globe, Users } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../config/api";

export default function Committees() {
  const [activeCommittee, setActiveCommittee] = useState("organising");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const committees = [
    {
      id: "organising",
      name: "Organising Committee",
      description: "Meet the team bringing the Global Health Conclave to life.",
      icon: Users,
    },
    {
      id: "jury",
      name: "Jury",
      description: "Meet the distinguished professionals entrusted with evaluating the awards.",
      icon: Users,
    },
    {
      id: "scientific",
      name: "Scientific Committee",
      description: "Meet the experts shaping the academic and scientific vision of GHC.",
      icon: Users,
    },
  ];

  useEffect(() => {
    // Sync URL with active committee
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");
    if (type && committees.find((c) => c.id === type)) {
      setActiveCommittee(type);
    } else {
      window.history.replaceState({}, "", `${window.location.pathname}?type=${activeCommittee}`);
    }
  }, []);

  const handleCommitteeChange = (id) => {
    setActiveCommittee(id);
    window.history.pushState({}, "", `${window.location.pathname}?type=${id}`);
  };

  useEffect(() => {
    setLoading(true);
    setError(false);
    axios
      .get(apiUrl(`/api/committees/${activeCommittee}`))
      .then((res) => setMembers(res.data.members || []))
      .catch((err) => {
        console.error("Failed to fetch committee members", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [activeCommittee]);

  // Handle Escape key for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedMember(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeCommitteeData = committees.find((c) => c.id === activeCommittee);

  return (
    <div className="w-full bg-white selection:bg-[#173B8F]/20 selection:text-[#173B8F]">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-48 md:pb-32 px-4 md:px-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-1/2 -right-1/4 w-3/4 h-[150%] bg-gradient-to-b from-purple-50 to-transparent -rotate-12 blur-3xl rounded-full" />
          <div className="absolute -bottom-1/2 -left-1/4 w-3/4 h-[150%] bg-gradient-to-t from-blue-50 to-transparent rotate-12 blur-3xl rounded-full" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm backdrop-blur-md mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-[#D946EF] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#101828]">GHC 2026</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-['Sora'] text-4xl md:text-6xl lg:text-7xl font-bold text-[#101828] leading-tight max-w-4xl tracking-tight drop-shadow-sm"
          >
            Meet the Minds <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#173B8F] to-[#D946EF]">Behind GHC</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-6 text-lg md:text-xl text-[#475467] max-w-2xl font-medium"
          >
            Discover the organising team, jury and scientific experts shaping the Global Health Conclave.
          </motion.p>
        </div>
      </section>

      {/* Committee Selector & Member Grid */}
      <section className="relative z-20 pb-32 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              {committees.map((committee) => {
                const isActive = activeCommittee === committee.id;
                return (
                  <button
                    key={committee.id}
                    onClick={() => handleCommitteeChange(committee.id)}
                    className={`relative p-6 rounded-2xl text-left transition-all duration-300 w-full md:w-1/3 flex flex-col gap-3 group ${
                      isActive 
                        ? "bg-purple-50 shadow-sm border border-purple-200 -translate-y-1" 
                        : "bg-white border border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isActive ? "bg-[#173B8F] text-white" : "bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-[#173B8F]"
                      }`}>
                        <committee.icon size={20} />
                      </div>
                      {isActive && (
                        <motion.div layoutId="active-indicator" className="w-2 h-2 rounded-full bg-[#D946EF]" />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-bold font-['Sora'] text-lg ${isActive ? "text-[#101828]" : "text-[#475467]"}`}>
                        {committee.name}
                      </h3>
                      <p className={`text-sm mt-1 line-clamp-2 ${isActive ? "text-[#475467]" : "text-gray-500"}`}>
                        {committee.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCommittee}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-10 text-center md:text-left border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold font-['Sora'] text-[#101828]">{activeCommitteeData.name}</h2>
                    <p className="text-[#475467] mt-1">{activeCommitteeData.description}</p>
                  </div>
                  {!loading && !error && members.length > 0 && (
                    <div className="text-sm font-medium text-white bg-[#173B8F] px-4 py-1.5 rounded-full shadow-md">
                      {members.length} Member{members.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-200 p-4 animate-pulse">
                        <div className="w-full aspect-[4/5] bg-gray-100 rounded-xl mb-4" />
                        <div className="w-3/4 h-5 bg-gray-200 rounded mb-2" />
                        <div className="w-1/2 h-4 bg-gray-100 rounded" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-red-500/20 shadow-lg max-w-2xl mx-auto">
                    <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                      <ExternalLink size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-[#101828] mb-2">Unable to load committee members</h3>
                    <p className="text-[#475467] mb-8">Please try again in a moment or check your connection.</p>
                    <button onClick={() => window.location.reload()} className="bg-[#173B8F] text-white px-8 py-3 rounded-full font-bold hover:bg-[#0D47A1] transition-colors shadow-lg">
                      Retry Connection
                    </button>
                  </div>
                ) : members.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm max-w-2xl mx-auto">
                    <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-6">
                      <Users size={28} />
                    </div>
                    <h3 className="text-2xl font-bold font-['Sora'] text-[#101828] mb-3">
                      {activeCommittee === 'jury' ? "Jurors will be revealed soon" : `${activeCommitteeData.name} members will be revealed soon`}
                    </h3>
                    <p className="text-[#475467] text-lg">
                      {activeCommittee === 'jury' ? "The jurors for this conclave will be announced shortly." : `The members of the ${activeCommitteeData.name} will be announced shortly.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {members.map((member, i) => (
                      <motion.button
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: i * 0.05 }}
                         key={member.id}
                         onClick={() => setSelectedMember(member)}
                         className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[#173B8F]/30 shadow-sm hover:shadow-xl transition-all duration-300 text-left flex flex-col h-full"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 m-2 rounded-xl">
                          {member.photoUrl ? (
                            <img 
                              src={member.photoUrl} 
                              alt={member.name}
                              className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-700 ease-out"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 group-hover:bg-gray-100 transition-colors">
                              <Users size={48} className="mb-2 opacity-50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#101828]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <span className="text-white text-sm font-medium flex items-center gap-1">
                              View Profile <ChevronRight size={16} />
                            </span>
                          </div>
                        </div>
                        <div className="p-5 pt-3 flex-1 flex flex-col">
                          {member.committeeRole && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D946EF] mb-1">
                              {member.committeeRole}
                            </span>
                          )}
                          <h3 className="font-bold font-['Sora'] text-lg text-[#101828] leading-tight mb-1 group-hover:text-[#173B8F] transition-colors">
                            {member.name}
                          </h3>
                          <p className="text-sm font-medium text-[#173B8F] mb-1">{member.designation}</p>
                          <p className="text-sm text-[#475467] line-clamp-2">{member.organization}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Profile Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedMember(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
            >
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/5 backdrop-blur-md rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-[#101828] transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>

              <div className="w-full md:w-2/5 aspect-square md:aspect-auto md:h-auto bg-gray-50 relative shrink-0">
                {selectedMember.photoUrl ? (
                  <img
                    src={selectedMember.photoUrl}
                    alt={selectedMember.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Users size={64} />
                  </div>
                )}
              </div>

              <div className="w-full md:w-3/5 p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col bg-white">
                <div className="mb-6">
                  {selectedMember.committeeRole && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-[#D946EF] border border-purple-100 text-xs font-bold uppercase tracking-widest mb-4">
                      {selectedMember.committeeRole}
                    </div>
                  )}
                  <h2 className="text-3xl md:text-4xl font-bold font-['Sora'] text-[#101828] mb-2">{selectedMember.name}</h2>
                  <div className="text-lg font-medium text-[#173B8F]">{selectedMember.designation}</div>
                  <div className="text-lg text-[#475467] mt-1">{selectedMember.organization}</div>
                </div>

                {selectedMember.biography && (
                  <div className="prose prose-p:text-[#475467] prose-p:leading-relaxed mb-8 flex-1">
                    {selectedMember.biography.split('\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 mt-auto pt-6 border-t border-gray-100">
                  {selectedMember.linkedinUrl && (
                    <a href={selectedMember.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-[#173B8F] hover:bg-[#0077b5] hover:text-white transition-colors" aria-label="LinkedIn">
                      <Globe size={18} />
                    </a>
                  )}
                  {selectedMember.twitterUrl && (
                    <a href={selectedMember.twitterUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-[#173B8F] hover:bg-[#1DA1F2] hover:text-white transition-colors" aria-label="Twitter">
                      <Globe size={18} />
                    </a>
                  )}
                  {selectedMember.instagramUrl && (
                    <a href={selectedMember.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-[#E1306C] hover:bg-[#E1306C] hover:text-white transition-colors" aria-label="Instagram">
                      <Globe size={18} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
