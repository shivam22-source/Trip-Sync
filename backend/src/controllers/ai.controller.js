const { GoogleGenerativeAI } = require("@google/generative-ai");
const Trip = require("../models/Trip");
const Member = require("../models/Member");
const axios = require("axios");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function parseGeminiJson(text) {
  // Gemini may wrap JSON in markdown fences, so clean it before parsing.
  const cleanText = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleanText);
}

function getGeminiModel(temperature) {
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL,
    generationConfig: {
      temperature,
      responseimagetype: "application/json",
    },
  });
}

function limitScore(value) {
  let score = Number(value);

  if (!score) {
    score = 0;
  }

  if (score < 0) {
    score = 0;
  }

  if (score > 100) {
    score = 100;
  }

  return score;
}

async function extractReceiptDataFromUrl(receiptImage) {
  // Cloudinary gives us a URL. Gemini needs the image bytes as base64.
  const imageResponse = await axios.get(receiptImage, {
    responseType: "arraybuffer",
  });
  const imagetype = imageResponse.headers["content-type"] || "image/jpeg";
  const base64Image = Buffer.from(imageResponse.data).toString("base64");
  const model = getGeminiModel(0.2);

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Image,
        imagetype,
      },
    },
    {
      text: `
Extract expense details from this receipt.

Return ONLY valid JSON in this exact format:

{
  "description": "",
  "amount": 0,
  "category": "Flights | Food | Hotel | Misc",
  "date": "",
  "confidence": "low | medium | high"
}
      `,
    },
  ]);

  const content = result.response.text();

  if (!content) {
    throw new Error("AI did not return any response");
  }

  return parseGeminiJson(content);
}

function buildCompatibilityPrompt(trip, traveler) {
  return `
You are TripSync's group travel compatibility reviewer.
Compare this traveler profile with the trip plan and return a simple admin-friendly score.

Trip:
${JSON.stringify({
    title: trip.title,
    destination: trip.destination,
    description: trip.description,
    category: trip.category,
    budget: trip.budget,
    filters: trip.filters,
  })}

Traveler:
${JSON.stringify({
    name: traveler.name,
    bio: traveler.bio,
    preferences: traveler.preferences,
    travelProfile: traveler.travelProfile,
    compatibility: traveler.compatibility,
  })}

Return ONLY valid JSON in this exact shape:
{
  "score": 0,
  "label": "low | medium | high",
  "reason": ""
}

Rules:
- score must be 0 to 100
- reason must be one short sentence
`;
}

async function getAiCompatibilityScore(trip, traveler) {
  if (!process.env.GEMINI_API_KEY || !traveler) {
    return null;
  }

  // A low temperature keeps scoring more stable and less creative.
  const model = getGeminiModel(0.2);

  const result = await model.generateContent(
    buildCompatibilityPrompt(trip, traveler)
  );
  const content = result.response.text();

  if (!content) {
    return null;
  }

  const score = parseGeminiJson(content);
  let label = score.label;
  let reason = score.reason;

  if (!label) {
    label = "medium";
  }

  if (!reason) {
    reason = "AI reviewed this traveler against the trip details.";
  }

  return {
    score: limitScore(score.score),
    label,
    reason,
  };
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

    const model = getGeminiModel(0.7);

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

const extractReceiptExpense = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured",
      });
    }

    const { tripId } = req.params;
    const { receiptImage } = req.body;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    const isAdmin = trip.admin.toString() === req.user.id;
    const member = await Member.findOne({
      tripId,
      userId: req.user.id,
      status: "accepted",
    });

    if (!isAdmin && !member) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!receiptImage) {
      return res.status(400).json({
        success: false,
        message: "Receipt image URL is required",
      });
    }

    const expenseData = await extractReceiptDataFromUrl(receiptImage);

    return res.status(200).json({
      success: true,
      expenseData,
    });
  } catch (error) {
    console.error("RECEIPT OCR ERROR:", error);

    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: "Invalid Gemini API request",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: "Gemini quota exceeded",
      });
    }

    if (error.status === 503) {
      return res.status(503).json({
        success: false,
        message: "Gemini service temporarily overloaded",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to extract receipt data",
    });
  }
};

module.exports = {
  generateTripPlan,
  extractReceiptExpense,
  extractReceiptDataFromUrl,
  getAiCompatibilityScore,
};
