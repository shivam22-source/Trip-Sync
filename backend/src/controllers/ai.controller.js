const { GoogleGenerativeAI } = require("@google/generative-ai");
const Trip = require("../models/Trip");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


////Parse text to json format
function parseGeminiJson(text) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

const generateTripPlan = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured",
      });
    }

    const { tripId, destination, days, budget, style } = req.body;
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.admin.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the trip admin can generate or update itinerary",
      });
    }

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    const prompt = `
You are TripSync's travel itinerary planner.
Generate a practical, safe, budget-aware ${days}-day trip plan.

Destination: ${destination}
Budget: INR ${budget}
Traveler style: ${style}

Return only valid JSON in this exact shape:
{
  "tripName": "",
  "estimatedBudget": "",
  "bestTimeToVisit": "",
  "tips": [],
  "days": [
    {
      "day": 1,
      "title": "",
      "activities": [],
      "foodSuggestions": [],
      "estimatedDailyBudget": ""
    }
  ]
}
    `;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) {
      return res.status(502).json({
        success: false,
        message: "AI did not return a trip plan",
      });
    }

    const tripPlan = parseGeminiJson(content);

    trip.aiItinerary = {
      plan: tripPlan,
      style,
      generatedBy: req.user.id,
      generatedAt: new Date(),
    };
    await trip.save();

    res.status(200).json({
      success: true,
      tripPlan,
      aiItinerary: trip.aiItinerary,
    });
  } catch (error) {
    console.error("AI TRIP ERROR:", error);

    if (error.status === 400) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key or model is not valid.",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: "Gemini quota is exhausted. Please try again later.",
      });
    }

    res.status(500).json({
      success: false,
      message: "AI service is temporarily unavailable.",
    });
  }
};

module.exports = {
  generateTripPlan,
};
