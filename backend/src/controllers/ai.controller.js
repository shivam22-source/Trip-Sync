const { GoogleGenerativeAI } = require("@google/generative-ai");
const Trip = require("../models/Trip");
const Member = require("../models/Member");
const axios = require("axios");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


////Parse text to json format
function parseGeminiJson(text) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

async function extractReceiptDataFromUrl(receiptImage) {
  const imageResponse = await axios.get(receiptImage, {
    responseType: "arraybuffer",
  });
  const mimeType = imageResponse.headers["content-type"] || "image/jpeg";
  const base64Image = Buffer.from(imageResponse.data).toString("base64");
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Image,
        mimeType,
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
//image  to gemini


const extractReceiptExpense = async (req, res) => {
  try {
    // check gemini key
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
};
