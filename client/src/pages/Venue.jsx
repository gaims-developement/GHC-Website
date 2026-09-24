import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { MapPin, Plane, Train, Coffee, Hotel, Utensils, Info, ExternalLink } from "lucide-react";
import { apiUrl } from "../config/api";

const defaultCafes = [
  { name: "SDA Market Cafes", description: "Right opposite IIT Delhi, a bustling hub of affordable and quirky cafes perfect for students.", address: "Opposite IIT Delhi, 2 km from AIIMS" },
  { name: "Green Park Market", description: "Quiet and aesthetic coffee shops offering great Wi-Fi and relaxed environments.", address: "Green Park, 1.5 km from AIIMS" },
  { name: "Satya Niketan", description: "South Campus hotspot famous for cheap eats, big portions, and vibrant student energy.", address: "South Campus, 6 km from AIIMS" },
];

const defaultStays = [
  { name: "Le Meridien Delhi", description: "Official GHC Gala venue. 5-star luxury in central Delhi overlooking iconic Lutyens' Delhi.", address: "Windsor Place, Janpath, Connaught Place", tag: "Official Partner" },
  { name: "Green Park Hostels", description: "Affordable, clean, and vibrant backpacker hostels located near the Yellow Line metro.", address: "Green Park Main, New Delhi", tag: "Student Friendly" },
  { name: "South Ex Guest Houses", description: "Boutique stays offering great value and easy auto-rickshaw access to AIIMS.", address: "South Extension Part 1, New Delhi", tag: "Comfort & Value" }
];

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="mb-12">
      <p className="font-['Inter'] font-bold tracking-widest uppercase text-xs md:text-sm mb-3 text-[#173B8F]">{eyebrow}</p>
      <h2 className="font-['Outfit'] text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight text-[#101828]">{title}</h2>
      {text && <p className="font-['Inter'] text-lg md:text-xl max-w-3xl leading-relaxed text-[#475467]">{text}</p>}
    </div>
  );
}

export default function Venue() {
  const [cmsCafes, setCmsCafes] = useState([]);
  const [cmsStays, setCmsStays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchHospitality = async () => {
      try {
        const [cafesRes, staysRes] = await Promise.all([
          axios.get(apiUrl("/api/cafes")).catch(() => ({ data: { cafes: [] } })),
          axios.get(apiUrl("/api/stays")).catch(() => ({ data: { stays: [] } })),
        ]);
        const activeCafes = (cafesRes.data?.cafes || []).filter(c => c.status !== "inactive");
        const activeStays = (staysRes.data?.stays || []).filter(s => s.status !== "inactive");
        setCmsCafes(activeCafes);
        setCmsStays(activeStays);
      } catch (err) {
        console.error("Error loading hospitality data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitality();
  }, []);

  const cafesList = cmsCafes.length > 0 ? cmsCafes : defaultCafes;
  const staysList = cmsStays.length > 0 ? cmsStays : defaultStays;

  return (
    <div className="bg-[#F7FBFF] pt-24 pb-16">
      {/* Hero */}
      <section className="section-shell pt-10">
        <SectionHeading
          eyebrow="GHC 2026 Destinations"
          title="Experience Delhi."
          text="Join us at the heart of India's medical and cultural capital. Navigate your way through world-class venues, rich heritage, and vibrant student-friendly hubs."
        />

        <div className="relative h-[40vh] min-h-[300px] rounded-3xl overflow-hidden mt-8 shadow-sm border border-gray-200">
          <img src="https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2070&auto=format&fit=crop" alt="Delhi Heritage" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081B33]/80 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <h3 className="font-['Outfit'] text-2xl font-extrabold">New Delhi, India</h3>
            <p className="text-white/80">November 22-24, 2026</p>
          </div>
        </div>
      </section>

      {/* Official Venues */}
      <section className="section-shell mt-24">
        <SectionHeading
          eyebrow="Official Venues"
          title="Where innovation meets hospitality."
        />
        <div className="grid md:grid-cols-2 gap-8">
          <motion.article className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.06)] overflow-hidden" whileHover={{ y: -8 }}>
            <div className="h-48 overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop" alt="AIIMS Delhi" className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#081B33] uppercase tracking-wide">Main Venue</div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-extrabold font-['Outfit'] text-[#101828] mb-3">S.E.T Facility, AIIMS Delhi</h3>
              <p className="text-[#475467] mb-6 text-sm leading-relaxed">The All India Institute of Medical Sciences (AIIMS) is India's premier medical institute, globally recognized for its cutting-edge research, outstanding patient care, and world-class medical education. As the crown jewel of Indian healthcare, AIIMS sets the standard for medical excellence. The state-of-the-art S.E.T (Skill, E-Learning, Telemedicine) facility within the campus hosts the core academic sessions, workshops, and research showcases for GHC.</p>
              <div className="flex gap-4 text-sm text-[#0D47A1] font-semibold">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Ansari Nagar, New Delhi</span>
              </div>
            </div>
          </motion.article>

          <motion.article className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.06)] overflow-hidden" whileHover={{ y: -8 }}>
            <div className="h-48 overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop" alt="Le Meridien" className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#081B33] uppercase tracking-wide">Gala & Networking</div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-extrabold font-['Outfit'] text-[#101828] mb-3">Le Meridien Hotel</h3>
              <p className="text-[#475467] mb-6 text-sm leading-relaxed">Situated in the heart of the city, Le Meridien offers a premium environment for our networking dinners, award ceremonies, and VIP accommodations, overlooking the iconic Lutyens' Delhi.</p>
              <div className="flex gap-4 text-sm text-[#0D47A1] font-semibold">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Connaught Place, New Delhi</span>
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      {/* Transportation Map */}
      <section className="section-shell mt-24">
        <SectionHeading
          eyebrow="Getting Around"
          title="How to Reach AIIMS Delhi"
          text="Conveniently located in South Delhi, AIIMS is easily accessible via the Delhi Metro, road, and major transit hubs."
        />

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.06)] p-8">
            <div className="w-12 h-12 rounded-full bg-[#0D47A1]/5 flex items-center justify-center text-[#0D47A1] mb-4">
              <Plane className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold font-['Outfit'] text-[#101828] mb-2">From IGI Airport</h3>
            <p className="text-sm text-[#475467] leading-relaxed">Take the Orange Line (Airport Express) to New Delhi Station, then switch to the Yellow Line towards HUDA City Centre and get off at AIIMS Metro Station.</p>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.06)] p-8">
            <div className="w-12 h-12 rounded-full bg-[#0D47A1]/5 flex items-center justify-center text-[#0D47A1] mb-4">
              <Train className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold font-['Outfit'] text-[#101828] mb-2">From NDLS</h3>
            <p className="text-sm text-[#475467] leading-relaxed">Directly board the Yellow Line Metro from New Delhi Metro Station heading towards Millennium City Centre Gurugram. Exit at AIIMS Metro Station.</p>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.06)] p-8">
            <div className="w-12 h-12 rounded-full bg-[#0D47A1]/5 flex items-center justify-center text-[#0D47A1] mb-4">
              <Train className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold font-['Outfit'] text-[#101828] mb-2">From Nizamuddin</h3>
            <p className="text-sm text-[#475467] leading-relaxed">Take the Pink Line from Hazrat Nizamuddin Station to INA Metro Station. AIIMS is one stop away on the Yellow Line or a 10-minute auto-rickshaw ride.</p>
          </div>
        </div>

        <div className="w-full h-[400px] bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14015.653457183063!2d77.19472391081577!3d28.56637376798485!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce26ff3530691%3A0x6e2c2dd940027f31!2sAll%20India%20Institute%20of%20Medical%20Sciences%2C%20New%20Delhi!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="AIIMS Delhi Map"
          ></iframe>
        </div>
      </section>

      {/* Student Friendly Destinations & Cafes */}
      <section className="section-shell mt-24">
        <SectionHeading
          eyebrow="Unwind in Delhi"
          title="Explore & Recharge"
          text="Discover student-friendly spots, vibrant markets, and cozy cafes near the venue to recharge after the sessions."
        />

        <h3 className="text-xl font-bold font-['Outfit'] text-[#101828] mb-6 mt-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-[#e244b7]" /> Fun Places to Visit</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {[
            { name: "Hauz Khas Village", desc: "Historic fort ruins meeting modern art galleries.", img: "/assets/places/hauz%20khas%20village.jpg" },
            { name: "Dilli Haat", desc: "Open-air food plaza and craft bazaar.", img: "/assets/places/dilli%20haat.jpg" },
            { name: "Connaught Place", desc: "Circular market hub for shopping and street food.", img: "/assets/places/connaught%20place.jpg" },
            { name: "India Gate", desc: "Iconic monument surrounded by lush lawns.", img: "/assets/places/india%20gate.jpg" }
          ].map(place => (
            <motion.div key={place.name} className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-black shadow-sm" whileHover={{ y: -5 }}>
              <img src={place.img} alt={place.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#081B33] via-[#081B33]/20 to-transparent p-5 flex flex-col justify-end text-white">
                <h4 className="font-['Outfit'] font-bold text-lg leading-tight mb-1">{place.name}</h4>
                <p className="text-xs text-white/80">{place.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <h3 className="text-xl font-bold font-['Outfit'] text-[#101828] mb-6 flex items-center gap-2"><Coffee className="h-5 w-5 text-[#e244b7]" /> Student-Friendly Cafes</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {cafesList.map((cafe, index) => (
            <div key={cafe._id || cafe.id || index} className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.06)] p-8 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h4 className="text-lg font-bold font-['Outfit'] text-[#101828]">{cafe.name}</h4>
                  {cafe.address && (
                    <span className="text-[10px] font-bold text-[#e244b7] bg-[#e244b7]/10 px-2.5 py-1 rounded-full uppercase tracking-wider text-right">
                      {cafe.address.length > 25 ? `${cafe.address.slice(0, 25)}...` : cafe.address}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#475467] leading-relaxed mb-4">{cafe.description || cafe.desc}</p>
              </div>
              {cafe.googleMapsLink && (
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <a
                    href={cafe.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D47A1] hover:text-[#1565C0] hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" /> View on Google Maps
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Hotels Near Venue */}
      <section className="section-shell mt-24">
        <SectionHeading
          eyebrow="Accommodation"
          title="Delegate Stays"
          text="Comfortable stays curated for students and professionals within close proximity to the venue."
        />
        <div className="grid md:grid-cols-3 gap-6">
          {staysList.map((hotel, index) => (
            <div key={hotel._id || hotel.id || index} className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.06)] p-8 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#0D47A1]/5 flex items-center justify-center text-[#0D47A1]">
                    <Hotel className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold text-[#0D47A1] bg-[#0D47A1]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {hotel.tag || "Stay"}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-[#101828] mb-1">{hotel.name}</h3>
                {hotel.address && (
                  <p className="text-xs text-[#0D47A1] mb-3 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {hotel.address}
                  </p>
                )}
                <p className="text-sm text-[#475467] leading-relaxed mb-4">{hotel.description || hotel.desc}</p>
              </div>
              {hotel.googleMapsLink && (
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <a
                    href={hotel.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D47A1] hover:text-[#1565C0] hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" /> View on Google Maps
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}