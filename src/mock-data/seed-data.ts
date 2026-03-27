// ============================================================
// Goa Sentinel — Static Seed Data
// Realistic content for mock data generation
// ============================================================

import type { DataSource } from '@/types';

// --- Post Templates by Topic (English) ---

export const englishPosts: Record<string, string[]> = {
  beaches: [
    'Just spent the morning at Palolem Beach. Crystal clear water and barely any crowd. This is paradise!',
    'Baga Beach is way too commercialized now. Hawkers every 2 minutes, plastic everywhere. Not what I expected.',
    'Sunset at Vagator Beach was absolutely breathtaking. The cliff views are unreal.',
    'Morjim Beach is still relatively untouched. Perfect for a quiet getaway.',
    'The beach cleanup drive at Calangute was impressive. Kudos to the local volunteers!',
    'Disappointed with the water quality at Candolim Beach today. Murky and lots of debris.',
    'Butterfly Beach is a hidden gem. Worth the boat ride from Palolem.',
    'Anjuna Beach has lost its charm. Too many shacks, too loud, too dirty.',
    'Early morning walk at Dona Paula was magical. Dolphins spotted near the jetty!',
    'Querim Beach in North Goa is still pristine. No shacks, no noise, just nature.',
    'The lifeguard system at Goa beaches is well-organized. Feel safe swimming here.',
    'Cabo de Rama Beach is worth the trek. Stunning and completely deserted.',
  ],
  nightlife: [
    'Tito\'s Lane is legendary. The energy at 2 AM is something else entirely.',
    'Club Cubana in Arpora — the "nightclub in the sky" lives up to its name.',
    'The silent noise parties at Palolem are a brilliant concept. Three DJs, one beach.',
    'Nightlife in Goa has gotten expensive. Cover charges at most clubs now.',
    'Saturday Night Market at Arpora is the perfect blend of shopping and live music.',
    'Casino Deltin Royale on the Mandovi River. Never seen anything like it in India.',
    'LPK Waterfront is stunning but overpriced for what you get.',
    'Curlies at Anjuna still has the best sunset parties in all of Goa.',
    'The electronic music scene in Goa is world-class. Proper international DJs every weekend.',
    'Feeling unsafe walking back from clubs at night. Need better street lighting.',
  ],
  food: [
    'Best fish thali I\'ve ever had at Ritz Classic in Panjim. Goan cuisine is underrated.',
    'Vindaloo here is nothing like what we get elsewhere. Authentic Goan vindaloo is pure fire.',
    'The seafood at Martin\'s Corner, Betalbatim is worth every rupee. Fresh catch daily.',
    'Tried poi bread with pork sausages for breakfast. Goa has the best street food.',
    'Bebinca at a local bakery in Margao — eight layers of pure dessert heaven.',
    'Tourist restaurants near beaches are overpriced and mediocre. Eat where locals eat.',
    'Feni tasting at a local distillery. This cashew spirit is uniquely Goan.',
    'Xacuti at Gunpowder restaurant in Assagao. Authentic Goan masala at its finest.',
    'Disappointed by the hygiene at some beach shacks. Food safety needs attention.',
    'The brunch scene in Assagao/Vagator is incredible. Goa has become a foodie destination.',
  ],
  heritage: [
    'Old Goa churches are magnificent. Basilica of Bom Jesus is a UNESCO treasure.',
    'The Latin Quarter in Fontainhas, Panjim — colorful Portuguese architecture everywhere.',
    'Fort Aguada at sunset. Four centuries of history with an ocean view.',
    'Goa State Museum needs better upkeep. So much history but poorly maintained.',
    'The Shigmo festival parade in Panjim was spectacular. Traditional art and color everywhere.',
    'Ancestral Goa museum in Loutolim brings the past alive. Great for families.',
    'Sad to see some heritage buildings in Panjim being demolished for modern construction.',
    'The spice plantations in Ponda are a wonderful way to experience Goan agriculture.',
    'Divar Island feels like stepping back in time. Authentic Goan village life.',
    'Mangueshi Temple architecture is stunning. Hindu-Portuguese blend unique to Goa.',
  ],
  safety: [
    'Felt completely safe walking around Panjim at any hour. Well-lit and friendly locals.',
    'Taxi mafia is still a problem. Fixed meters need to be enforced everywhere.',
    'Tourist police at beaches are a great initiative. Saw them help a lost tourist.',
    'Got scammed by a taxi driver. Charged 3x the normal rate from airport.',
    'Goa is one of the safest states in India for solo female travelers.',
    'Petty theft at beach shacks is increasing. Keep valuables locked up.',
    'The GTDC helpline was very responsive when I needed assistance.',
    'Road safety is a concern. Two-wheelers without helmets everywhere.',
    'Night driving on Goan roads is risky. Potholes and no street lights in many areas.',
    'Water sports operators need better safety equipment. Some looked quite worn out.',
  ],
  transport: [
    'Finally got a good experience with Goa Miles app. Fair metering, clean car.',
    'Rented a scooter for the week — best way to explore Goa by far.',
    'The Konkan Railway route to Goa is one of the most scenic train journeys in India.',
    'Why are there no ride-sharing apps working properly in Goa? Need Uber/Ola here.',
    'The Mandovi Bridge at night is a beautiful crossing. Great infrastructure.',
    'Kadamba bus from Panjim to Margao was surprisingly comfortable and cheap.',
    'Airport taxi counter rates are reasonable but still no app-based options available.',
    'Hired a pilot boat to go island hopping. Totally worth it for backwater views.',
    'The new Mopa airport is modern and well-designed. Good first impression of Goa.',
    'Two-wheeler rental shops in every lane. Competition keeps prices very reasonable.',
  ],
  hotels: [
    'Taj Fort Aguada is luxury redefined. The views from the hilltop suites are insane.',
    'Found an amazing homestay in Siolim through Airbnb. Authentic Goan house, lovely hosts.',
    'Resort in Cavelossim was overbooked. Terrible experience for the price we paid.',
    'The boutique hotels in Assagao are charming. Converted Portuguese villas with modern amenities.',
    'Budget hostels in Anjuna are perfect for backpackers. Clean, social, great location.',
    'Beach hut at Agonda for Rs 1500/night. Waking up to the ocean was priceless.',
    'Five-star resort charged us for amenities listed as "complimentary" on their website.',
    'Goa has accommodation for every budget. From Rs 500 dorms to Rs 50,000 suites.',
    'The eco-resort in Netravali wildlife sanctuary was a unique jungle experience.',
    'Check-in at our Candolim hotel was chaotic. Staff seemed undertrained.',
  ],
  weather: [
    'October in Goa is perfect. Post-monsoon greenery and pleasant temperatures.',
    'Visited in May — 38 degrees and extremely humid. Not the best time.',
    'The monsoon season in Goa has its own beauty. Waterfalls at their peak, lush green everywhere.',
    'December weather in Goa is ideal. 28 degrees, low humidity, clear skies.',
    'Dudhsagar Falls during monsoon is spectacular. The train bridge view is iconic.',
    'January in Goa — warm days, cool nights, perfect beach weather.',
    'The Arabian Sea during monsoon is no joke. Red flags everywhere, very rough waters.',
    'March is when Goa starts heating up. Plan your trip for November-February.',
  ],
  prices: [
    'Goa has become expensive during peak season. December prices are double the off-season.',
    'Great value for money if you visit in September-October. Half the prices, zero crowds.',
    'Street food in Goa is still very affordable. Full meal under Rs 200.',
    'Flight prices to Goa during Christmas/New Year are absolutely insane.',
    'Compared to Bali or Thailand, Goa offers similar vibes at a fraction of the cost.',
    'Water sports prices are negotiable. Never pay the first price they quote.',
    'Alcohol is cheap in Goa compared to other Indian states. Local bars have great deals.',
    'Package tours from Mumbai to Goa are surprisingly affordable now.',
  ],
  culture: [
    'The Goan susegad lifestyle is infectious. Slow living at its finest.',
    'Local Konkani culture is beautiful. The people are warm and welcoming.',
    'Shigmo, Carnival, Sao Joao — Goa has the best festivals in India.',
    'The blend of Hindu and Portuguese culture makes Goa unique in India.',
    'Live music at almost every restaurant. Goa has incredible local talent.',
    'The fishing communities along the coast are the real soul of Goa.',
    'Fado nights at a restaurant in Fontainhas. Portuguese influence is still alive.',
    'Village feast at a local friend\'s house. Goan hospitality is unmatched.',
  ],
};

// --- Post Templates (Hindi) ---

export const hindiPosts: Record<string, string[]> = {
  beaches: [
    'गोवा के समुद्र तट बहुत सुंदर हैं। पालोलेम बीच तो स्वर्ग जैसा है।',
    'बागा बीच पर बहुत भीड़ थी। शांति से बैठने की जगह नहीं मिली।',
    'कैलंगुट बीच की सफाई में सुधार हुआ है। पिछली बार से बहुत बेहतर।',
    'अंजुना बीच पर सूर्यास्त देखना एक अद्भुत अनुभव था।',
    'गोवा के बीच पर लाइफगार्ड की व्यवस्था बहुत अच्छी है। सुरक्षित महसूस हुआ।',
  ],
  food: [
    'गोवा का फिश करी राइस अभी तक का सबसे अच्छा खाना था।',
    'पणजी के स्ट्रीट फूड का मज़ा ही कुछ और है। पोई ब्रेड लाजवाब!',
    'समुद्री भोजन ताज़ा और स्वादिष्ट था। कीमत थोड़ी ज़्यादा लगी।',
    'गोवा की बेबिंका मिठाई बहुत स्वादिष्ट है। ज़रूर आज़माएं।',
    'बीच शैक्स में खाने की quality एक जैसी नहीं है। सावधान रहें।',
  ],
  safety: [
    'गोवा में अकेले घूमना बिल्कुल सुरक्षित है। लोग बहुत मददगार हैं।',
    'टैक्सी वालों ने ज़्यादा पैसे मांगे। मीटर का इस्तेमाल नहीं करते।',
    'गोवा की पुलिस बहुत सहायक है। पर्यटकों के लिए हेल्पलाइन भी है।',
  ],
  transport: [
    'गोवा में स्कूटर किराये पर लेना सबसे अच्छा विकल्प है।',
    'कदम्बा बस सेवा सस्ती और आरामदायक है। बहुत अच्छा अनुभव।',
    'नया मोपा एयरपोर्ट बहुत आधुनिक और सुविधाजनक है।',
  ],
  general: [
    'गोवा हर बार नया लगता है। यहाँ का माहौल ही कुछ और है।',
    'परिवार के साथ गोवा घूमना बहुत अच्छा अनुभव रहा।',
    'गोवा की प्राकृतिक सुंदरता अद्भुत है। हर जगह हरियाली।',
  ],
};

// --- Post Templates (Russian) ---

export const russianPosts: Record<string, string[]> = {
  beaches: [
    'Пляж Палолем — настоящий рай. Чистая вода, мало людей, красивые закаты.',
    'Морджим пляж очень популярен среди русских туристов. Чувствуешь себя как дома.',
    'Арамболь — лучший пляж для йоги и медитации на рассвете.',
    'Калангут слишком людный. Лучше ехать на юг Гоа для спокойного отдыха.',
    'Пляж Ашвем — отличное место для кайтсёрфинга. Ветер и волны идеальные.',
  ],
  food: [
    'Морепродукты в Гоа невероятно свежие и доступные. Лобстер за 800 рупий!',
    'Русские рестораны в Морджиме готовят борщ и пельмени. Вкус дома.',
    'Попробовал настоящий гоанский виндалу — очень острый, но вкусный.',
  ],
  general: [
    'Гоа — лучшее место для зимовки. Тёплое море, дешёвая еда, добрые люди.',
    'Каждый год возвращаемся в Гоа. Это наш второй дом.',
    'Аренда скутера всего 300 рупий в день. Свобода передвижения!',
    'Гоа сильно изменился за последние 5 лет. Больше туристов, выше цены.',
  ],
};

// --- Topic Keywords ---

export const topicKeywords: Record<string, string[]> = {
  beaches: ['beach', 'sea', 'sand', 'swimming', 'sunbathing', 'waves', 'coast', 'shore', 'surf', 'tide', 'ocean'],
  nightlife: ['club', 'party', 'DJ', 'music', 'dance', 'bar', 'casino', 'night', 'pub', 'lounge'],
  food: ['restaurant', 'food', 'cuisine', 'fish', 'seafood', 'vindaloo', 'thali', 'cafe', 'beer', 'feni'],
  heritage: ['church', 'temple', 'fort', 'museum', 'heritage', 'history', 'architecture', 'colonial', 'UNESCO'],
  safety: ['safe', 'scam', 'police', 'theft', 'security', 'help', 'emergency', 'crime', 'protection'],
  transport: ['taxi', 'bus', 'scooter', 'airport', 'train', 'ride', 'rental', 'road', 'traffic', 'parking'],
  hotels: ['hotel', 'resort', 'hostel', 'homestay', 'villa', 'room', 'accommodation', 'booking', 'Airbnb'],
  weather: ['weather', 'monsoon', 'rain', 'sun', 'hot', 'humid', 'temperature', 'season', 'climate'],
  prices: ['price', 'cost', 'expensive', 'cheap', 'affordable', 'budget', 'value', 'money', 'rate', 'discount'],
  culture: ['culture', 'festival', 'Konkani', 'tradition', 'music', 'art', 'local', 'community', 'Goan'],
};

export const allTopics = Object.keys(topicKeywords) as Array<keyof typeof topicKeywords>;

// --- Realistic Author Handles ---

export const authorHandles: Record<DataSource, string[]> = {
  twitter: [
    '@WanderlustDiaries', '@GoaBeachVibes', '@TravelWithRaj', '@IndianBackpacker',
    '@SunsetChaser_IN', '@DigitalNomadGoa', '@GoaTourismFan', '@BeachBum_Palolem',
    '@MumbaiToGoa', '@ExploreIndia365', '@NomadNikhil', '@GoaFoodieTrail',
    '@SoloTravellerIN', '@RussianInGoa', '@DeutscheInGoa', '@GoaLocalGuide',
    '@BackpackerBruno', '@CoastalKarma', '@VagatorVibes', '@GoaInsider',
    '@TripToGoa', '@PanjimDiaries', '@GoaByNight', '@BeachWalkDaily',
    '@MonsoonGoa', '@GoaNightOwl', '@CurryAndCoast', '@ResortsOfGoa',
  ],
  reddit: [
    'u/goa_regular', 'u/india_backpacker', 'u/beach_nomad_22', 'u/mumbai_weekender',
    'u/solo_traveler_f', 'u/goan_foodie', 'u/digital_nomad_asia', 'u/expat_in_goa',
    'u/travel_bug_delhi', 'u/goa_local_tips', 'u/monsoon_chaser', 'u/south_goa_fan',
    'u/budget_india_travel', 'u/luxury_goa', 'u/konkani_pride', 'u/goa_heritage_walk',
  ],
  instagram: [
    '@goa.diaries', '@sunsets.of.goa', '@goan.foodie', '@explore.goa.daily',
    '@goabeachlife', '@panjim.stories', '@goa.travel.gram', '@the.goan.experience',
    '@beachvibes.goa', '@goa.nightlife', '@goatourism.official', '@wanderlust.goa',
    '@goa.hidden.gems', '@goan.kitchen', '@goa.luxury.stays', '@south.goa.love',
  ],
  news: [
    'Times of India Goa', 'The Goan Everyday', 'Herald Goa', 'Navhind Times',
    'Gomantak Times', 'Prudent Media', 'IANS Goa Bureau', 'PTI Goa',
    'India Today Travel', 'NDTV Goa', 'Outlook Traveller', 'Conde Nast India',
    'Economic Times Travel', 'Lonely Planet India',
  ],
  google_reviews: [
    'Rajesh M.', 'Sarah K.', 'Amit P.', 'Emma W.', 'Vikram S.',
    'Hans M.', 'Olga N.', 'Priya D.', 'James T.', 'Deepa R.',
    'Mikhail V.', 'Ananya B.', 'Carlos F.', 'Li Wei', 'Fatima A.',
    'Thomas H.', 'Sneha G.', 'Robert J.', 'Kavita N.', 'Ahmed K.',
  ],
  tripadvisor: [
    'TravellerMumbai', 'GlobalNomad2024', 'BeachLover_UK', 'FoodieExplorer',
    'FamilyTrips_IN', 'SoloWanderer', 'HoneymoonCouple', 'AdventureSeekerDE',
    'RelaxationMode', 'CulturalTourist', 'BudgetBackpacker', 'LuxuryEscapes',
    'SeniorTravellers', 'YogaRetreatFan', 'WildlifeWatcher', 'HistoryBuff_UK',
  ],
};

// --- Language Metadata ---

export interface LanguageConfig {
  code: string;
  name: string;
  weight: number; // probability weight for random selection
}

export const languageDistribution: LanguageConfig[] = [
  { code: 'en', name: 'English', weight: 0.35 },
  { code: 'hi', name: 'Hindi', weight: 0.20 },
  { code: 'kok', name: 'Konkani', weight: 0.15 },
  { code: 'ru', name: 'Russian', weight: 0.10 },
  { code: 'de', name: 'German', weight: 0.05 },
  { code: 'mr', name: 'Marathi', weight: 0.04 },
  { code: 'pt', name: 'Portuguese', weight: 0.03 },
  { code: 'fr', name: 'French', weight: 0.02 },
  { code: 'zh', name: 'Chinese', weight: 0.02 },
  { code: 'ja', name: 'Japanese', weight: 0.01 },
  { code: 'ko', name: 'Korean', weight: 0.01 },
  { code: 'ar', name: 'Arabic', weight: 0.01 },
  { code: 'he', name: 'Hebrew', weight: 0.01 },
];

// --- Source Distribution ---

export const sourceWeights: Record<DataSource, number> = {
  twitter: 0.30,
  instagram: 0.25,
  reddit: 0.15,
  google_reviews: 0.12,
  tripadvisor: 0.10,
  news: 0.08,
};

// --- Counter-Narrative Response Templates ---

export const counterNarrativeTemplates = {
  acknowledge_address: [
    'We understand your concern about {issue}. The Goa Tourism Department has taken immediate note and our team is looking into this. Your feedback helps us improve. Here\'s what we\'re doing: {action}',
    'Thank you for raising this, {author}. We take {issue} seriously. Our ground team has been alerted and we\'re working on a resolution. Updates will follow.',
    'We appreciate you sharing your experience regarding {issue}. This is not the standard we aim for. Our quality assurance team has been notified and corrective measures are underway.',
    'Your feedback about {issue} is valuable. We\'ve forwarded this to the relevant department. Goa\'s commitment to tourist safety and satisfaction remains our top priority.',
  ],
  provide_context: [
    'For context: Goa welcomed 9.7 million tourists in 2024 with a 92% satisfaction rate. While we take every complaint seriously, {topic} incidents represent less than 0.3% of tourist experiences.',
    'Important context on {topic}: The Goa government invested Rs 450 crore in tourism infrastructure this year, including {detail}. We\'re continuously improving.',
    'To add perspective: Goa was ranked India\'s #1 tourist destination for the 5th consecutive year. Our {topic} standards are regularly audited and meet international benchmarks.',
    'Some facts about {topic} in Goa: {fact}. We have a dedicated task force monitoring and improving tourist experiences across all areas.',
  ],
  redirect_positive: [
    'While we address this concern, here are some recent improvements in Goa tourism: {positive_fact}. Over 50,000 tourists rated their Goa experience 4.5/5 this month.',
    'Goa continues to lead in tourist satisfaction. Recent highlights: {positive_fact}. We\'re committed to making every visitor\'s experience exceptional.',
    'Here\'s what thousands of visitors are saying about Goa right now: {positive_fact}. Join the conversation with #GoaExperience.',
    'Did you know? {positive_fact}. Goa remains one of the most welcoming destinations in Asia, and we\'re only getting better.',
  ],
};

// --- Goa Tourism Facts (for counter-narratives) ---

export const goaTourismFacts = [
  'Goa welcomed 9.7 million tourists in 2024, a 12% increase from the previous year.',
  'Over 800,000 international tourists visited Goa in 2024, making it India\'s top international tourism destination.',
  'Goa has 105 km of coastline with 40+ beaches, each with unique character and appeal.',
  'The Goa government invested Rs 450 crore in tourism infrastructure in 2024-25.',
  'Goa has 6 UNESCO World Heritage churches and convents in Old Goa.',
  'The state has a dedicated tourist police force with officers at all major beaches.',
  'Goa\'s food tourism contributes Rs 2,400 crore annually to the state economy.',
  'Over 3,200 registered homestays offer authentic Goan hospitality statewide.',
  'Beach cleanup drives removed 45 tonnes of waste across Goa\'s beaches in 2024.',
  'Goa was rated India\'s safest state for tourists by the National Crime Records Bureau.',
  'The new Mopa International Airport handles 4.4 million passengers annually.',
  'Goa\'s eco-tourism initiatives cover 4 wildlife sanctuaries and 1 national park.',
  'Over 15,000 direct tourism jobs were created in Goa in 2024.',
  'Goa\'s water sports industry meets international safety standards certified by RSTV.',
  'The state has 24/7 tourist helpline (1364) available in 8 languages.',
  'Goa\'s heritage walks program attracted 120,000 participants in 2024.',
  'Cashew feni received GI (Geographical Indication) tag, boosting Goan food tourism.',
  'Digital payment adoption at tourist spots in Goa reached 78% in 2024.',
];

// --- Positive Facts for Redirect Templates ---

export const positiveFacts = [
  'new beach lifeguard stations installed at 15 additional beaches this season',
  'free Wi-Fi zones launched at 20 major tourist spots across North and South Goa',
  'the Heritage Walk mobile app now covers 50+ historical sites with AR experiences',
  'eco-friendly electric shuttle buses now connect all major beaches in South Goa',
  'a new 24/7 multilingual tourist helpline launched with support in 8 languages',
  'beach water quality monitoring system now tests and publishes daily results at 30 beaches',
  'Goa\'s Carnival 2025 was the biggest yet with 2 million visitors over 4 days',
  'over 200 restaurants now display verified hygiene ratings at their entrance',
  'the Goa Miles taxi app now covers 95% of the state with transparent metering',
  'new coastal cycling tracks span 40 km from Panjim to Old Goa',
];

// --- Viral Negative Post Templates (for scenarios) ---

export const viralNegativePosts = {
  beach_pollution: [
    'THREAD: Just walked Calangute Beach and it\'s DISGUSTING. Raw sewage flowing into the sea, plastic everywhere, dead fish on the shore. This is Goa\'s pride? Where are the crores spent on beach maintenance? Photos below. 1/',
    'Absolutely horrified by the state of {beach}. Mountains of garbage, stagnant water pools, and the smell is unbearable. @GoaTourism what happened? This is NOT what your brochures show. #GoaReality #BeachPollution',
    'Came to Goa for a dream vacation, found a nightmare at {beach}. Sewage pipe literally emptying into the water where children swim. SHAMEFUL. @PMOIndia @GoaCM someone needs to answer for this.',
  ],
  tourist_scam: [
    'WARNING to all tourists: Got scammed by a "licensed" water sports operator at Baga. Charged Rs 5000 for a 2-minute ride, no safety equipment, threatened us when we complained. Police said "what can we do." AVOID GOA.',
    'Our family vacation in Goa turned into a scam fest. Taxi from airport: 4x meter. Hotel charged hidden fees. Restaurant added "service charge" AND "tax" that doesn\'t exist. Never coming back. Thread 🧵',
  ],
  safety_incident: [
    'URGENT: My friend was robbed at knifepoint near {location} last night. Police station was CLOSED. Had to drive 15km to file a report. Where is the tourist police we keep hearing about? #GoaSafety #TouristSafety',
    'Three incidents of drink spiking reported at {location} clubs this week alone. Women travelers PLEASE be careful in Goa. The authorities are doing NOTHING about this. RT to spread awareness.',
  ],
  infrastructure: [
    'Roads in Goa are a DEATH TRAP. Massive potholes on the main highway from airport, no street lights, stray animals everywhere. Two tourists died in road accidents this month. When will @GoaCM act?',
    'Power cut for 6 hours at our "5-star" resort in {location}. No generator backup. Paying Rs 15,000/night to sit in the dark and sweat. Goa\'s infrastructure is a joke. #GoaFail',
  ],
};

// --- Coordinated Attack Templates (manufactured negativity) ---

export const coordinatedAttackPosts = [
  'Don\'t go to Goa. Complete waste of money. {destination} is 10x better and half the price. #AvoidGoa #TravelWarning',
  'Goa is finished as a tourist destination. Dirty beaches, rude locals, overpriced everything. Go to {destination} instead. #GoaIsDead',
  'Another day, another tourist scammed in Goa. When will people learn? {destination} treats tourists with respect. #BoycottGoa',
  'Just saw another report of tourist harassment in Goa. This state is NOT safe. Choose {destination} for your next vacation. #GoaUnsafe',
  'Goa tourism is all fake marketing. Reality is filth, scams, and danger. Save your money, go to {destination}. #GoaExposed',
  'Asked 10 friends about Goa trip, 8 had terrible experiences. Scams, food poisoning, unsafe roads. #GoaFail #TravelAdvice',
  'Goa government spending crores on ads while beaches literally have sewage. Priorities? #GoaWaste #Tourism',
];

export const competitorDestinations = [
  'Kerala', 'Pondicherry', 'Andaman Islands', 'Sri Lanka', 'Bali', 'Thailand', 'Vietnam',
];

// --- Goa Locations ---

export const goaLocations = [
  'Panjim', 'Calangute', 'Baga', 'Anjuna', 'Vagator', 'Morjim', 'Arambol',
  'Candolim', 'Palolem', 'Agonda', 'Colva', 'Benaulim', 'Cavelossim',
  'Margao', 'Vasco da Gama', 'Old Goa', 'Mapusa', 'Siolim', 'Assagao',
  'Dona Paula', 'Miramar', 'Betalbatim', 'Querim', 'Mandrem',
];

// --- Platform URL Patterns ---

export const platformUrlPatterns: Record<DataSource, (id: string) => string> = {
  twitter: (id) => `https://x.com/user/status/${id}`,
  reddit: (id) => `https://reddit.com/r/goa/comments/${id}`,
  instagram: (id) => `https://instagram.com/p/${id}`,
  news: (id) => `https://news.example.com/goa/${id}`,
  google_reviews: (id) => `https://maps.google.com/review/${id}`,
  tripadvisor: (id) => `https://tripadvisor.com/Review-${id}`,
};

// --- Platform Metric Ranges ---
// Each platform has different typical engagement numbers

export interface MetricRange {
  views: [number, number];
  likes: [number, number];
  shares: [number, number];
  comments: [number, number];
  viralMultiplier: number; // multiplied when post goes viral
}

export const platformMetricRanges: Record<DataSource, MetricRange> = {
  twitter: {
    views: [100, 15000],
    likes: [2, 500],
    shares: [0, 200],     // retweets
    comments: [0, 80],    // replies
    viralMultiplier: 50,
  },
  reddit: {
    views: [50, 8000],
    likes: [1, 2000],     // upvotes
    shares: [0, 50],      // crossposted
    comments: [0, 300],
    viralMultiplier: 30,
  },
  instagram: {
    views: [200, 50000],
    likes: [10, 5000],
    shares: [0, 100],     // saves/shares
    comments: [0, 150],
    viralMultiplier: 40,
  },
  news: {
    views: [500, 100000],
    likes: [0, 200],      // reactions
    shares: [5, 500],     // social shares
    comments: [0, 100],
    viralMultiplier: 20,
  },
  google_reviews: {
    views: [20, 2000],
    likes: [0, 50],       // "helpful" votes
    shares: [0, 5],
    comments: [0, 10],    // responses
    viralMultiplier: 10,
  },
  tripadvisor: {
    views: [30, 5000],
    likes: [0, 80],       // "helpful" votes
    shares: [0, 10],
    comments: [0, 20],
    viralMultiplier: 15,
  },
};
