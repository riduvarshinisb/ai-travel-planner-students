import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { destination, duration, budget, interests, travelStyle, groupSize } = req.body;

    if (!destination || !duration || !budget) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert travel planner specializing in student travel. Create a detailed, budget-friendly travel itinerary with the following details:

Destination: ${destination}
Duration: ${duration} days
Budget: $${budget} (total for all ${duration} days)
Interests: ${interests || 'general sightseeing'}
Travel Style: ${travelStyle || 'balanced'}
Group Size: ${groupSize || 1} person(s)

Please provide a comprehensive response in the following JSON format (return ONLY valid JSON, no markdown or extra text):

{
  "destination": "destination name",
  "overview": "2-3 sentence trip overview",
  "budgetBreakdown": {
    "accommodation": number,
    "food": number,
    "transportation": number,
    "activities": number,
    "miscellaneous": number
  },
  "dailyItinerary": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "time": "09:00 AM",
          "activity": "Activity name",
          "description": "Brief description",
          "cost": number,
          "duration": "2 hours",
          "location": "Place name",
          "studentTip": "Special tip for students"
        }
      ],
      "meals": {
        "breakfast": "Restaurant/cafe name - $X",
        "lunch": "Restaurant/cafe name - $X",
        "dinner": "Restaurant/cafe name - $X"
      },
      "estimatedDailyCost": number
    }
  ],
  "accommodationSuggestions": [
    {
      "name": "Hostel/hotel name",
      "type": "Hostel/Hotel/Airbnb",
      "pricePerNight": number,
      "description": "Brief description",
      "studentDiscount": "Yes/No - details if applicable",
      "location": "Area name"
    }
  ],
  "transportationTips": [
    {
      "type": "Bus/Train/Metro/etc",
      "description": "How to use and cost",
      "studentDiscount": "Details if available",
      "estimatedCost": number
    }
  ],
  "studentDiscounts": [
    {
      "place": "Museum/attraction name",
      "normalPrice": number,
      "studentPrice": number,
      "requirement": "Valid student ID"
    }
  ],
  "localStudentInsights": [
    "Insider tip 1",
    "Insider tip 2",
    "Insider tip 3"
  ],
  "sustainableOptions": [
    {
      "category": "Transportation/Food/Activities",
      "option": "Eco-friendly alternative",
      "impact": "Environmental benefit"
    }
  ],
  "packingList": [
    "Essential item 1",
    "Essential item 2"
  ],
  "safetyTips": [
    "Safety tip 1",
    "Safety tip 2"
  ],
  "moneySavingTips": [
    "Tip 1",
    "Tip 2",
    "Tip 3"
  ],
  "weatherConsiderations": "Weather info and what to expect",
  "emergencyInfo": {
    "embassy": "Contact info",
    "emergencyNumber": "Local emergency number",
    "hospitals": "Nearby hospital info"
  }
}

Make sure all costs are realistic and add up to approximately the total budget. Focus on student-friendly, authentic experiences. Include free activities where possible.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON
    let itinerary;
    try {
      itinerary = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', text);
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        details: 'The AI returned an invalid format. Please try again.'
      });
    }

    return res.status(200).json(itinerary);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate itinerary',
      details: error.message 
    });
  }
}