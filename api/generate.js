const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { destination, days, budget, interests } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Generate a short, concise student-budget travel itinerary for ${days} days in ${destination}, max budget $${budget}. Focus on low-cost/free activities, hostels, student discounts (e.g., ISIC), local transport. Interests: ${interests}. Structure as JSON:
  {
    "title": "Trip Title",
    "itinerary": [
      {
        "day": 1,
        "title": "Day Summary",
        "activities": ["Activity 1", "Activity 2"],
        "costs": {"Activity 1": 10},
        "totalCost": 50,
        "tips": "Transport tip"
      }
      // ... for each day
    ],
    "locations": [{"name": "Spot", "lat": 48.8566, "lng": 2.3522}] // 3-5 key spots with coords
  }
  Keep total under budget. Day-by-day, student-friendly, vibrant.`;

  try {
    const result = await model.generateContent(prompt);
    const jsonStr = result.response.text().replace(/```json\n
