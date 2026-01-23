const fs = require('fs');
const path = require('path');

// Full array of top 10 most visited cities with Tier 1-3 content
const travelPacks = [
  {
    city: "Bangkok",
    country: "Thailand",
    tier1: { title: "Top Free Attractions", items: ["Visit the Grand Palace exterior", "Walk through Khao San Road", "Explore Chatuchak Weekend Market"] },
    tier2: { title: "Gold Premium Experiences", items: ["Guided boat tour of Chao Phraya River", "Thai cooking class with local chef", "Evening rooftop dinner at Sky Bar"] },
    tier3: { title: "Platinum / Spontaneity Engine", items: ["Private Tuk Tuk night tour with AI-custom route", "Luxury spa day with traditional Thai massage", "Exclusive street food AI-curated tasting tour"] }
  },
  {
    city: "Paris",
    country: "France",
    tier1: { title: "Top Free Attractions", items: ["Stroll along the Seine River", "Visit Notre-Dame Cathedral exterior", "Explore Montmartre and Sacré-Cœur Basilica"] },
    tier2: { title: "Gold Premium Experiences", items: ["Louvre Museum guided tour", "Seine River dinner cruise", "Cooking class at Le Foodist Paris"] },
    tier3: { title: "Platinum / Spontaneity Engine", items: ["Private Eiffel Tower photography session", "Secret wine & cheese tasting tour", "AI-generated personalized 24-hour Paris itinerary"] }
  },
  {
    city: "London",
    country: "United Kingdom",
    tier1: { title: "Top Free Attractions", items: ["Walk along the South Bank", "Visit the British Museum", "Explore Covent Garden"] },
    tier2: { title: "Gold Premium Experiences", items: ["London Eye private capsule ride", "Guided tour of Westminster Abbey", "Afternoon tea at The Ritz"] },
    tier3: { title: "Platinum / Spontaneity Engine", items: ["AI-custom historic pub crawl", "Private Thames River photography tour", "Exclusive West End backstage theater tour"] }
  },
  {
    city: "Dubai",
    country: "UAE",
    tier1: { title: "Top Free Attractions", items: ["Explore Dubai Marina Walk", "Visit Al Fahidi Historical District", "Window-shop at Dubai Mall"] },
    tier2: { title: "Gold Premium Experiences", items: ["Burj Khalifa observation deck ticket", "Desert safari with BBQ dinner", "Dhow cruise dinner"] },
    tier3: { title: "Platinum / Spontaneity Engine", items: ["Private helicopter tour over Dubai", "Luxury yacht day trip", "AI-generated personalized shopping & dining itinerary"] }
  },
  {
    city: "Singapore",
    country: "Singapore",
    tier1: { title: "Top Free Attractions", items: ["Walk around Marina Bay", "Visit Gardens by the Bay (outdoor areas)", "Explore Chinatown and Little India"] },
    tier2: { title: "Gold Premium Experiences", items: ["Singapore Flyer capsule ride", "Singapore River night cruise", "Cooking class for local cuisine"] },
    tier3: { title: "Platinum / Spontaneity Engine", items: ["Private guided AI-designed city tour", "Exclusive tasting at Michelin-starred restaurant", "Luxury rooftop pool experience"] }
  },
  {
    city: "New York City",
    country: "USA",
    tier1: { title: "Top Free Attractions", items: ["Walk the High Line", "Explore Central Park", "Visit Times Square and public art"] },
    tier2: { title: "Gold Premium Experiences", items: ["Statue of Liberty guided tour", "Empire State Building observation deck", "Broadway show tickets"] },
    tier3: { title: "Platinum / Spontaneity Engine", items: ["Private helicopter tour over NYC", "AI-personalized day itinerary with hidden gems", "Luxury private museum after-hours experience"] }
  },
  {
    city: "Kuala Lumpur",
    country: "Malaysia",
    tier1: { title: "Top Free Attractions", items: ["Explore Batu Caves", "Walk around Merdeka Square", "Visit the Islamic Arts Museum exterior"] },
    tier2: { title: "Gold Premium Experiences", items: ["Petronas Towers Skybridge ticket", "Guided street food tour", "Cultural heritage walking tour"] },
    tier3: { title: "Platinum / Spontaneity Engine", items: ["Private AI-customized day itinerary", "Luxury sunset helicopter ride", "VIP access to KL Tower observation deck"] }
  },
  {
    city: "Istanbul",
    country: "Turkey",
    tier1: { title: "Top Free Attractions", items: ["Walk the Sultanahmet district", "Visit Hagia Sophia exterior", "Explore the Grand Bazaar"] },
    tier2: { title: "Gold Premium Experiences", items: ["Topkapi Palace guided tour", "Bosphorus cruise", "Turkish cooking class"] },
    tier3: { title: "Platinum / Spontaneity Engine", items: ["Private yacht on Bosphorus", "AI-personalized hidden gems tour", "VIP Hamam & luxury spa day"] }
  },
  {
    city: "Tokyo",
    country: "Japan",
    tier1: { title: "Top Free Attractions", items: ["Walk through Shinjuku Gyoen", "Explore Asakusa and Senso-ji Temple", "Visit Meiji Shrine"] },
    tier2: { title: "Gold Premium Experiences", items: ["Tokyo Skytree observation deck", "Guided sushi-making class", "Sumo stable visit"] },
    tier3: { title: "Platinum / Spontaneity Engine", items: ["Private AI-personalized city tour", "Luxury helicopter cityscape tour", "Exclusive night photography tour"] }
  },
  {
    city: "Antalya",
    country: "Turkey",
    tier1: { title: "Top Free Attractions", items: ["Walk the old town (Kaleiçi)", "Relax at Konyaaltı Beach", "Explore Duden Waterfalls"] },
    tier2: { title: "Gold Premium Experiences", items: ["Guided historic city tour", "Boat trip along the coast", "Turkish cuisine tasting experience"] },
    tier3: { title: "Platinum / Spontaneity Engine", items: ["Private yacht tour", "AI-personalized hidden beaches & experiences", "Luxury spa & resort day"] }
  }
];

// Create /data/travelPacks folder if it doesn't exist
const folderPath = path.join(process.cwd(), 'data', 'travelPacks');
if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

// Generate JSON files for all cities
travelPacks.forEach(pack => {
  const fileName = pack.city.toLowerCase().replace(/\s+/g, '-') + '.json';
  fs.writeFileSync(path.join(folderPath, fileName), JSON.stringify(pack, null, 2));
});

console.log("✅ Travel Pack JSON files regenerated successfully:");
travelPacks.forEach(pack => console.log("-", pack.city));
