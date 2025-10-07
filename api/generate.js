// /api/generate.js
// Serverless function for Vercel — uses @google/genai and the GEMINI_API_KEY env var
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};
  const { destination, days, budget, interests, transport } = body;

  if (!destination || !days || !budget) {
    return res.status(400).json({ error: "destination, days and budget are required" });
  }

  // initialize client (reads GEMINI_API_KEY from env if not provided explicitly)
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Prompt asks for a SHORT, CONCISE JSON-only itinerary designed for students and budgets.
  const prompt = `
You are a travel assistant that writes SHORT, CONCISE, student-friendly day-by-day itineraries.
Return JSON only (no extra text). Use local currency. Keep each day's content brief.
Schema:
{
 "title": "<short title>",
 "destination":"<city/country>",
 "days":[
   {
     "day": 1,
     "summary": "<one sentence>",
     "activities": [
       {"time":"morning/afternoon/evening", "activity":"<short>", "est_cost":"<number and currency>"}
     ],
     "daily_cost":"<number and currency>"
   }, ...
 ],
 "total_estimated_cost":"<number and currency>",
 "recommended_hostels":[ {"name":"", "approx_price":"", "note":""} ],
 "transport_tips":["short tip strings"],
 "money_saving_tips":["short tip strings"]
}
Now generate a concise itinerary for:
- destination: ${destination}
- days: ${days}
- budget: ${budget}
- interests: ${interests || "general student-friendly experiences"}
- transport preference: ${transport || "budget"}

Keep answers short. Provide numeric costs rounded to nearest whole number.`;
  try {
    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      temperature: 0.2,
    });

    // The SDK exposes response.text in examples; fall back to JSON-stringify if missing.
    const rawText = resp?.text ?? (typeof resp === "string" ? resp : JSON.stringify(resp));

    // try to parse JSON strictly; the model was asked to output JSON-only, but be robust
    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      // try to locate the first '{' and parse substring
      const idx = rawText.indexOf("{");
      if (idx >= 0) {
        try {
          parsed = JSON.parse(rawText.slice(idx));
        } catch (e2) {
          parsed = null;
        }
      }
    }

    return res.status(200).json({ success: true, raw: rawText, itinerary: parsed });
  } catch (err) {
    console.error("Gemini call failed:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
