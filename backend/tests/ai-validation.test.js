const {
  validateReceiptData,
  validateCompatibilityData,
  validateItineraryData,
} = require("../src/validations/ai.validator");

describe("AI output validation", () => {
  test("accepts a valid receipt response", () => {
    const result = validateReceiptData({
      description: "Dinner",
      amount: 850,
      category: "Food",
      date: "2026-09-08",
      confidence: "high",
    });

    expect(result.amount).toBe(850);
    expect(result.category).toBe("Food");
  });

  test("rejects a receipt with an invalid category", () => {
    expect(() =>
      validateReceiptData({
        description: "Dinner",
        amount: 850,
        category: "Random",
        date: "2026-09-08",
        confidence: "high",
      })
    ).toThrow();
  });

  test("rejects a compatibility score outside 0 to 100", () => {
    expect(() =>
      validateCompatibilityData({
        score: 150,
        label: "high",
        reason: "Good match",
      })
    ).toThrow();
  });

  test("accepts a valid itinerary response", () => {
    const result = validateItineraryData({
      tripName: "Goa Trip",
      estimatedBudget: "₹12000",
      bestTimeToVisit: "October to March",
      tips: ["Carry sunscreen"],
      days: [
        {
          day: 1,
          title: "Beach Day",
          activities: ["Visit Baga Beach"],
          foodSuggestions: ["Try local seafood"],
          estimatedDailyBudget: "₹3000",
        },
      ],
    });

    expect(result.days).toHaveLength(1);
    expect(result.days[0].day).toBe(1);
  });

  test("rejects a compatibility score above 100", () => {
  expect(() =>
    validateCompatibilityData({
      score: 150,
      label: "high",
      reason: "Good match",
    })
  ).toThrow();
});

test("marks invalid AI output as an upstream response error", () => {
  try {
    validateCompatibilityData({
      score: 150,
      label: "high",
      reason: "Good match",
    });
  } catch (error) {
    expect(error.status).toBe(502);
    expect(error.code).toBe("AI_OUTPUT_INVALID");
  }
});
});