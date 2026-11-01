// From the GAIMS GHC 2026 Delhi Delegate Travel Guide. Rates are the guide's estimates, not live quotes.
const maps = (query) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const search = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

const BOOKING_PRAGATI = "https://www.booking.com/landmark/in/pragati-maidan1.html";
const BOOKING_APARTMENTS = "https://www.booking.com/accommodation/landmark/in/pragati-maidan1.html";
const GOIBIBO_HOSTELS = "https://www.goibibo.com/hotels/hostels-in-delhi/near-bharat-mandapam-iecc-lp/";
const GOIBIBO_HOTELS = "https://www.goibibo.com/hotels/hotels-in-delhi/near-pragati-maidan-lp/";
const MMT_HOSTELS = "https://www.makemytrip.com/hotels/poi-hostels-near-bharat_mandapam_iecc-delhi.html";
const MMT_FOUR_STAR = "https://www.makemytrip.com/hotels/hotels-near-bharat_mandapam_iecc-delhi-four_star.html";

const stayGroups = [
  {
    title: "Student stays under ₹1,000",
    text: "Rates are per person, per dorm bed, per night. Confirm female-only dorms, lockers, age and ID rules, and check-in times with each hostel.",
    tag: "Hostel dorm",
    stays: [
      { name: "Checkpoint Backpacker", address: "F-66 Lajpat Nagar II · Lajpat Nagar Metro", price: "₹799", description: "Check women-only dorms, shared bathrooms and late check-in.", googleMapsLink: maps("Checkpoint Backpacker F-66 Lajpat Nagar II Delhi"), bookingLink: search("Checkpoint Backpacker Delhi booking hotel") },
      { name: "The Hosteller Delhi", address: "A-10 Mathura Road · Ashram / Friends Colony East", price: "₹795", description: "Verify age rules, lockers, female dorms and cancellation.", googleMapsLink: maps("The Hosteller Delhi A-10 Mathura Road"), bookingLink: search("The Hosteller Delhi Delhi booking hotel") },
      { name: "Moustache Delhi", address: "C-794 New Friends Colony · Sukhdev Vihar area", price: "₹863", description: "Confirm female dorms, lockers and route to metro.", googleMapsLink: maps("Moustache Delhi C-794 New Friends Colony"), bookingLink: search("Moustache Delhi Delhi booking hotel") },
    ],
  },
  {
    title: "More low-cost stays",
    text: "Hostels, pods and budget rooms. Compare bed rates with room rates, and verify the exact address before planning your route.",
    tag: "Budget",
    stays: [
      { name: "goSTOPS Delhi", address: "Delhi Gate / Daryaganj · approx. 2.6 km", price: "₹900–₹2,500", googleMapsLink: maps("goSTOPS Delhi Daryaganj"), bookingLink: GOIBIBO_HOSTELS },
      { name: "Joey’s Hostel Delhi", address: "Laxmi Nagar · approx. 4.7 km", price: "₹900–₹2,500", googleMapsLink: maps("Joeys Hostel Delhi Laxmi Nagar"), bookingLink: MMT_HOSTELS },
      { name: "The Metrostay Pod", address: "Ajmeri Gate / New Delhi Railway Station · approx. 4.1 km", price: "₹700–₹1,800", googleMapsLink: maps("The Metrostay Pod New Delhi Railway Station"), bookingLink: MMT_HOSTELS },
      { name: "Budget private rooms", address: "Paharganj / New Delhi Railway Station / ITO", price: "₹1,000–₹3,000", googleMapsLink: maps("budget hotels Paharganj Delhi"), bookingLink: GOIBIBO_HOTELS },
    ],
  },
  {
    title: "Mid-range near the venue",
    text: "Sunder Nagar is among the most convenient areas for Day 1. Rates are approximate per room, per night.",
    tag: "Private room",
    stays: [
      { name: "Hotel LaSagrita", address: "Sunder Nagar · approx. 0.8–1.0 km", price: "₹5,000–₹9,000", googleMapsLink: maps("Hotel LaSagrita Sunder Nagar Delhi"), bookingLink: BOOKING_PRAGATI },
      { name: "Ahuja Residency Sunder Nagar", address: "Sunder Nagar · approx. 1–2 km", price: "₹5,000–₹12,000", googleMapsLink: maps("Ahuja Residency Sunder Nagar Delhi"), bookingLink: BOOKING_PRAGATI },
      { name: "Jukaso Inn Pragati Maidan", address: "Sunder Nagar · approx. 1 km", price: "₹4,000–₹8,000", description: "Check that the hotel is currently operating.", googleMapsLink: maps("Jukaso Inn Pragati Maidan Delhi"), bookingLink: BOOKING_PRAGATI },
    ],
  },
  {
    title: "Mid-range in central Delhi",
    text: "Useful for private rooms, group sharing and central metro connections.",
    tag: "City centre",
    stays: [
      { name: "Bloom Boutique | Connaught Place Area", address: "Central Delhi · approx. 3–4 km", price: "₹4,000–₹8,000", googleMapsLink: maps("Bloom Boutique Connaught Place Delhi"), bookingLink: BOOKING_PRAGATI },
      { name: "Connaught Royale", address: "Connaught Place / central Delhi · approx. 4–5 km", price: "₹3,500–₹7,000", googleMapsLink: maps("Connaught Royale Delhi"), bookingLink: BOOKING_PRAGATI },
      { name: "Homlee-Heritage 2 Bedroom Apartment", address: "Vikram Nagar / ITO area", price: "₹4,000–₹8,000 per apartment", description: "Not per person. Confirm guests permitted, taxes, deposit and cleaning charges before sharing.", googleMapsLink: maps("Homlee Heritage Bharat Mandapam ITO Delhi"), bookingLink: BOOKING_APARTMENTS },
    ],
  },
  {
    title: "Guesthouses and family stays",
    text: "For a central, guesthouse-style stay. Verify membership or eligibility rules, room type, check-in hours and current tariffs directly.",
    tag: "Guesthouse",
    stays: [
      { name: "New Delhi YMCA Tourist Hostel", address: "Jai Singh Road / Connaught Place · approx. 3.7 km", price: "₹3,500–₹6,000", googleMapsLink: maps("New Delhi YMCA Tourist Hostel"), bookingLink: GOIBIBO_HOSTELS },
      { name: "YWCA Blue Triangle Family Hostel", address: "Ashoka Road / central Delhi · approx. 4.1 km", price: "₹3,000–₹5,000", googleMapsLink: maps("YWCA Blue Triangle Family Hostel Delhi"), bookingLink: MMT_HOSTELS },
    ],
  },
  {
    title: "Business and private hotels",
    text: "Compare recent reviews, exact location and commute to both venues.",
    tag: "Hotel",
    stays: [
      { name: "The Hans, New Delhi", address: "Barakhamba Road / Connaught Place · approx. 2.2 km", price: "₹7,000–₹12,000", googleMapsLink: maps("The Hans New Delhi"), bookingLink: MMT_FOUR_STAR },
      { name: "The Vanson Pride", address: "Paharganj · approx. 5 km", price: "₹3,000–₹6,000", googleMapsLink: maps("The Vanson Pride Delhi"), bookingLink: MMT_FOUR_STAR },
      { name: "The Delhi Dreams – A Luxury Hotel", address: "Paharganj · approx. 5 km", price: "₹3,000–₹6,000", googleMapsLink: maps("The Delhi Dreams A Luxury Hotel Paharganj"), bookingLink: MMT_FOUR_STAR },
      { name: "Hotel Regent Grand", address: "East Patel Nagar", price: "₹3,500–₹7,000", googleMapsLink: maps("Hotel Regent Grand New Delhi"), bookingLink: MMT_FOUR_STAR },
    ],
  },
  {
    title: "Premium hotels",
    text: "Higher-cost options, not student-budget recommendations. Rates can be significantly higher during major events.",
    tag: "Premium",
    stays: [
      { name: "The LaLiT New Delhi", address: "Barakhamba Road / central Delhi · approx. 2 km", price: "₹10,000–₹20,000+", googleMapsLink: maps("The Lalit New Delhi"), bookingLink: BOOKING_PRAGATI },
      { name: "The Connaught, New Delhi – IHCL SeleQtions", address: "Connaught Place / Shivaji Stadium · approx. 4 km", price: "₹10,000–₹20,000+", googleMapsLink: maps("The Connaught New Delhi IHCL SeleQtions"), bookingLink: BOOKING_PRAGATI },
      { name: "Ambassador, New Delhi – IHCL SeleQtions", address: "Khan Market · approx. 3–4 km", price: "₹12,000–₹25,000+", googleMapsLink: maps("Ambassador New Delhi IHCL SeleQtions"), bookingLink: BOOKING_PRAGATI },
      { name: "The Oberoi, New Delhi", address: "Dr. Zakir Hussain Marg · approx. 2 km", price: "₹25,000–₹45,000+", googleMapsLink: maps("The Oberoi New Delhi"), bookingLink: BOOKING_PRAGATI },
      { name: "Taj Mahal, New Delhi", address: "Man Singh Road · approx. 2–3 km", price: "₹25,000–₹45,000+", googleMapsLink: maps("Taj Mahal New Delhi hotel"), bookingLink: BOOKING_PRAGATI },
      { name: "The Lodhi", address: "Lodhi Road · approx. 3 km", price: "₹30,000–₹60,000+", googleMapsLink: maps("The Lodhi New Delhi"), bookingLink: BOOKING_PRAGATI },
    ],
  },
];

const stays = stayGroups.flatMap((group) => group.stays.map((stay, index) => ({ ...stay, category: group.title, displayOrder: index + 1 })));

const cafeRows = (category, rows) => rows.map(([name, address, price, description], index) => ({
  name, address, price, description, category, displayOrder: index + 1, googleMapsLink: maps(`${name} ${address} Delhi`),
}));

const cafes = [
  ...cafeRows("Student-friendly food", [
    ["Jain Chawal Wale", "Connaught Place", "₹100–250"],
    ["Wenger’s", "Connaught Place", "₹150–350"],
    ["Depaul’s", "Janpath", "₹150–300"],
    ["Saravana Bhavan", "Janpath", "₹350–600"],
    ["Taco Bell", "Connaught Place", "₹250–450"],
    ["Big Yellow Door", "Satya Niketan", "₹350–650"],
    ["Karim’s", "Jama Masjid", "₹400–700"],
    ["Dolma House", "Majnu ka Tila", "₹250–450"],
  ]),
  ...cafeRows("President’s recommendations", [
    ["Yeti, The Himalayan Kitchen", "Hauz Khas", null, "Himalayan / Nepali"],
    ["Hauz Khas SOCIAL", "Hauz Khas", null, "Café and casual dining"],
    ["Kake Da Hotel", "Connaught Place", null, "Butter chicken"],
    ["Rajinder Da Dhaba", "Safdarjung Enclave", null, "Kebabs and butter chicken"],
    ["Nizam’s Kathi Kabab", "Connaught Place", null, "Kathi rolls"],
    ["Khan Chacha", "Khan Market", null, "Chicken and mutton rolls"],
    ["Karim’s", "Jama Masjid", null, "Traditional Mughlai"],
    ["Al Jawahar Restaurant", "Jama Masjid", null, "Nihari, korma and Mughlai"],
  ]),
];

const items = (section, rows) => rows.map((row, index) => ({ section, displayOrder: index + 1, ...row }));

const guideItems = [
  ...items("bharat_info", [{
    title: "Bharat Mandapam",
    subtitle: "Day 1 main venue · Supreme Court Metro Station (Blue Line)",
    detail: "Routes are indicative. Check live interchange directions and allow time for your assigned entry gate and security.",
    link: maps("Bharat Mandapam Pragati Maidan New Delhi"),
  }]),
  ...items("bharat_route", [
    { title: "IGI T3", detail: "Airport Express → New Delhi → Yellow to Rajiv Chowk → Blue to Supreme Court" },
    { title: "IGI T1", detail: "Magenta to Hauz Khas → Yellow to Rajiv Chowk → Blue to Supreme Court" },
    { title: "NDLS", detail: "Yellow Line → Rajiv Chowk → Blue to Supreme Court" },
    { title: "NZM", detail: "Pink Line from Sarai Kale Khan → Mayur Vihar I → Blue to Supreme Court" },
    { title: "Old Delhi", detail: "Chandni Chowk Yellow → Rajiv Chowk → Blue to Supreme Court" },
    { title: "Anand Vihar", detail: "Blue Line direct to Supreme Court" },
  ]),
  ...items("safdarjung_info", [{
    title: "VMMC & Safdarjung",
    subtitle: "Day 2 workshops · AIIMS Metro Station (Yellow Line)",
    detail: "Day 2 is planned for this area but remains subject to final confirmation. Confirm the workshop gate and exact location with the GAIMS team.",
    link: maps("VMMC Safdarjung Hospital New Delhi"),
  }]),
  ...items("safdarjung_route", [
    { title: "IGI T3", detail: "Airport Express → New Delhi → Yellow Line to AIIMS" },
    { title: "IGI T1", detail: "Magenta to Hauz Khas → Yellow Line to AIIMS" },
    { title: "NDLS", detail: "Yellow Line directly to AIIMS" },
    { title: "NZM", detail: "Sarai Kale Khan Pink → Dilli Haat INA → Yellow to AIIMS" },
    { title: "Old Delhi", detail: "Chandni Chowk → Yellow Line directly to AIIMS" },
    { title: "Anand Vihar", detail: "Blue to Rajiv Chowk → Yellow Line to AIIMS" },
    { title: "From Day 1 venue", detail: "Supreme Court Metro → Blue to Rajiv Chowk → Yellow to AIIMS" },
  ]),
  ...items("area", [
    { title: "Lajpat Nagar", subtitle: "Budget hostels, market, Pink / Violet metro", detail: "Popular for shared-stay comparisons" },
    { title: "Ashram", subtitle: "Hostels, Pink Line access", detail: "Look at metro transfers and late-night travel" },
    { title: "Sunder Nagar", subtitle: "Closer to Bharat Mandapam", detail: "Often better for private rooms, at higher rates" },
    { title: "Delhi Gate / ITO", subtitle: "Budget hotels and central access", detail: "Compare metro and road connections" },
    { title: "Connaught Place", subtitle: "Central hotels, restaurants and connections", detail: "Good for a city-centre stay" },
    { title: "Paharganj / NDLS", subtitle: "Budget rooms, New Delhi station area", detail: "Check recent reviews, safety and exact address" },
  ]),
  ...items("stay_group", stayGroups.map(({ title, tag, text }) => ({ title, subtitle: tag, detail: text }))),
  ...items("stay_note", [
    { title: "Check before you pay", detail: "Confirm whether the price is per bed, room or apartment, along with taxes, location and refund rules. A hotel 1–2 km away is not always walkable to your assigned Bharat Mandapam gate, so check the route and security approach too." },
    { title: "Independent listings", detail: "These listings are independent references, not endorsements. GAIMS, its office-bearers and members receive no commission or payment from any hotel or travel agency, and each booking is your own responsibility." },
  ]),
  ...items("stay_help", [{
    title: "Optional group travel help",
    subtitle: "+91 98390 99922",
    detail: "For group flight, train or hotel quotes, you can contact Mr Alok at Infinitecare Holidays by call or WhatsApp. This is an independent third party, and they may suggest different hotels from this list. Get the price and refund terms in writing before paying.",
    link: "tel:+919839099922",
  }]),
  ...items("place", [
    { title: "Hauz Khas Village", subtitle: "Green Park · Yellow + local ride", detail: "Historic fort ruins meeting modern art galleries.", imageUrl: "/assets/places/hauz%20khas%20village.jpg", link: maps("Hauz Khas Village New Delhi") },
    { title: "Dilli Haat INA", subtitle: "Dilli Haat INA · Pink / Yellow", detail: "Open-air food plaza and craft bazaar.", imageUrl: "/assets/places/dilli%20haat.jpg", link: maps("Dilli Haat INA New Delhi") },
    { title: "Connaught Place", subtitle: "Rajiv Chowk · Blue / Yellow", detail: "Circular market hub for shopping and street food.", imageUrl: "/assets/places/connaught%20place.jpg", link: maps("Connaught Place New Delhi") },
    { title: "India Gate", detail: "Iconic monument surrounded by lush lawns.", imageUrl: "/assets/places/india%20gate.jpg", link: maps("India Gate New Delhi") },
    { title: "Lotus Temple", subtitle: "Kalkaji Mandir · Violet / Magenta", link: maps("Lotus Temple New Delhi") },
    { title: "Old Delhi & Chandni Chowk", subtitle: "Chandni Chowk · Yellow", link: maps("Old Delhi Chandni Chowk New Delhi") },
    { title: "Majnu ka Tila", subtitle: "Vishwavidyalaya · Yellow + local ride", link: maps("Majnu ka Tila New Delhi") },
  ]),
  ...items("place_pick", [
    { title: "Swaminarayan Akshardham", detail: "Magnificent temple architecture, cultural exhibitions and the spectacular Sahaj Anand Light & Water Show." },
    { title: "Gurudwara Bangla Sahib", detail: "One of Delhi’s most beautiful and peaceful Sikh shrines, famous for its golden dome, sacred sarovar, kirtan and langar." },
    { title: "Lotus Temple", detail: "A stunning Bahá’í House of Worship, welcoming all faiths. Ideal for silent meditation, reflection and peaceful surroundings." },
    { title: "Shri Kalkaji Mandir", detail: "Historic and spiritually significant temple dedicated to Maa Kali, conveniently located near Lotus Temple." },
    { title: "Gurdwara Sis Ganj Sahib", detail: "Chandni Chowk. Historic Sikh shrine commemorating the martyrdom of Guru Tegh Bahadur Ji in 1675." },
    { title: "Chhatarpur Mandir", detail: "Grand temple complex dedicated to Maa Katyayani, known for its beautiful marble architecture and multiple shrines." },
  ]),
  ...items("market", [
    { title: "Sarojini Nagar", subtitle: "Pink Line · Budget fashion", detail: "Often closed on Mondays.", link: maps("Sarojini Nagar Delhi") },
    { title: "Janpath", subtitle: "Violet / nearby CP · Jewellery and souvenirs", link: maps("Janpath Delhi") },
    { title: "Lajpat Nagar", subtitle: "Pink / Violet · Ethnic wear and local shopping", detail: "Often closed on Mondays.", link: maps("Lajpat Nagar Delhi") },
    { title: "Chandni Chowk", subtitle: "Yellow Line · Traditional textiles and old Delhi markets", link: maps("Chandni Chowk Delhi") },
  ]),
  ...items("checklist", [
    { title: "Confirm your registration, the 28–29 November dates and your assigned entry gate." },
    { title: "Confirm the exact Day 2 workshop room and location." },
    { title: "Check whether the accommodation price is per bed, room or apartment." },
    { title: "Confirm the final hotel price with taxes, check-in and check-out times, and number of guests." },
    { title: "Check female dorm availability, lockers, ID policies and safety." },
    { title: "Get booking confirmations and cancellation and refund rules in writing." },
    { title: "Download Metro Sarthi and one ride-hailing app, and check your route transfers." },
    { title: "Carry your college ID and a government-issued photo ID." },
    { title: "Carry a power bank, medication and essentials, and check the weather and AQI." },
    { title: "Share your travel and accommodation details with family or a friend." },
  ]),
  ...items("app", [
    { title: "Delhi Metro Sarthi", detail: "Routes, line changes and QR tickets" },
    { title: "Uber", detail: "Cab and auto quotes and app bookings" },
    { title: "Ola", detail: "Cabs and local mobility choices" },
    { title: "Rapido", detail: "Auto and cab options where available" },
    { title: "112", detail: "Emergency number in India. Match driver and vehicle details, share your live trip and travel together for late arrivals." },
  ]),
];

module.exports = { stays, cafes, guideItems };
