// The country-state-city package still lists Nepal's pre-2015 development regions and zones (e.g. "Bagmati Zone"
// with no cities, Kathmandu under "Central Region"). Nepal has had seven provinces since 2015, so the location tables
// are corrected here. Used by setup_locations_db.js after seeding; safe to run again (it replaces Nepal's rows).
// People whose city is missing can still type it on the forms.
const NEPAL_PROVINCES = [
  ['P1', 'Koshi Province', ['Biratnagar', 'Dharan', 'Itahari', 'Damak', 'Birtamod', 'Mechinagar', 'Bhadrapur', 'Inaruwa', 'Ilam', 'Dhankuta', 'Urlabari', 'Triyuga', 'Khandbari', 'Taplejung', 'Phidim', 'Diktel', 'Okhaldhunga', 'Salleri', 'Bhojpur', 'Myanglung']],
  ['P2', 'Madhesh Province', ['Janakpur', 'Birgunj', 'Kalaiya', 'Jaleshwar', 'Malangwa', 'Gaur', 'Rajbiraj', 'Lahan', 'Siraha', 'Bardibas', 'Simraungadh', 'Chandrapur', 'Golbazar', 'Mirchaiya']],
  ['P3', 'Bagmati Province', ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kirtipur', 'Madhyapur Thimi', 'Budhanilkantha', 'Tokha', 'Chandragiri', 'Tarakeshwar', 'Gokarneshwar', 'Kageshwori Manohara', 'Nagarjun', 'Godawari', 'Mahalaxmi', 'Suryabinayak', 'Changunarayan', 'Hetauda', 'Bharatpur', 'Ratnanagar', 'Banepa', 'Dhulikhel', 'Panauti', 'Nagarkot', 'Bidur', 'Chautara', 'Charikot', 'Kamalamai', 'Manthali', 'Dhunche', 'Dhading Besi']],
  ['P4', 'Gandaki Province', ['Pokhara', 'Baglung', 'Gorkha', 'Damauli', 'Beni', 'Kushma', 'Putalibazar', 'Waling', 'Besisahar', 'Kawasoti', 'Jomsom', 'Chame', 'Bhimad', 'Shuklagandaki']],
  ['P5', 'Lumbini Province', ['Butwal', 'Siddharthanagar (Bhairahawa)', 'Tilottama', 'Tansen', 'Nepalgunj', 'Kohalpur', 'Tulsipur', 'Ghorahi', 'Kapilvastu', 'Lumbini Sanskritik', 'Gulariya', 'Sandhikharka', 'Tamghas', 'Liwang', 'Pyuthan', 'Ramgram', 'Sunwal', 'Devdaha', 'Lamahi', 'Rampur']],
  ['P6', 'Karnali Province', ['Birendranagar', 'Chandannath (Jumla)', 'Narayan (Dailekh)', 'Salyan', 'Musikot', 'Manma', 'Simikot', 'Gamgadhi', 'Dunai', 'Khalanga', 'Chaurjahari', 'Gurbhakot']],
  ['P7', 'Sudurpashchim Province', ['Dhangadhi', 'Bhimdatta (Mahendranagar)', 'Tikapur', 'Lamki Chuha', 'Ghodaghodi', 'Godawari (Kailali)', 'Dipayal Silgadhi', 'Amargadhi (Dadeldhura)', 'Darchula', 'Dasharathchand (Baitadi)', 'Chainpur (Bajhang)', 'Martadi', 'Mangalsen', 'Belauri', 'Punarbas']],
];

// Replaces Nepal's states (and, through ON DELETE CASCADE, their cities) with the seven provinces.
const applyNepalProvinces = async (pool) => {
  const [[nepal]] = await pool.query("SELECT id FROM countries WHERE iso2 = 'NP' LIMIT 1");
  if (!nepal) return { updated: false };
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM states WHERE country_id = ?', [nepal.id]);
    let cities = 0;
    for (const [code, name, cityNames] of NEPAL_PROVINCES) {
      const [result] = await connection.query('INSERT INTO states (country_id, state_code, name) VALUES (?, ?, ?)', [nepal.id, code, name]);
      await connection.query('INSERT INTO cities (state_id, country_id, name) VALUES ?', [cityNames.map((city) => [result.insertId, nepal.id, city])]);
      cities += cityNames.length;
    }
    await connection.commit();
    return { updated: true, provinces: NEPAL_PROVINCES.length, cities };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { applyNepalProvinces, NEPAL_PROVINCES };
