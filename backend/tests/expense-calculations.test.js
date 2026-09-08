jest.mock("../src/models/Trip", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/models/Member", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/models/Expense", () => ({}));
jest.mock("../src/models/Notification", () => ({}));
jest.mock("../src/models/Settlement", () => ({}));
jest.mock("../src/models/User", () => ({}));
jest.mock("../src/config/cloudinary", () => ({}));
jest.mock("streamifier", () => ({}));
jest.mock("../src/controllers/ai.controller", () => ({
  extractReceiptDataFromUrl: jest.fn(),
}));

const mongoose = require("mongoose");
const Trip = require("../src/models/Trip");
const Member = require("../src/models/Member");

const {
  calculateRawBalances,
  applySettlementsToBalances,
  calculateBalance,
  calculateSettlementPlan,
  canAccessTripExpenses,
} = require("../src/controllers/expense.controller");

const member = (id, name) => ({
  _id: id,
  name,
});

const expense = (amount, paidBy, splitEqually = true) => ({
  amount,
  splitEqually,
  paidBy: { _id: paidBy },
});

describe("settlement calculations", () => {
  test("calculates balances for an equally split expense", () => {
    const members = [member("a", "A"), member("b", "B"), member("c", "C")];
    const balances = calculateRawBalances([expense(300, "a")], members);

    expect(balances.get("a").balance).toBe(200);
    expect(balances.get("b").balance).toBe(-100);
    expect(balances.get("c").balance).toBe(-100);
  });

  test("ignores expenses that are not split equally", () => {
    const members = [member("a", "A"), member("b", "B")];
    const balances = calculateRawBalances([expense(500, "a", false)], members);

    expect(balances.get("a").balance).toBe(0);
    expect(balances.get("b").balance).toBe(0);
  });

  test("applies a completed settlement without changing expense history", () => {
    const members = [member("a", "A"), member("b", "B")];
    const balances = calculateRawBalances([expense(200, "a")], members);

    applySettlementsToBalances(balances, [
      { from: "b", to: "a", amount: 100 },
    ]);

    expect(balances.get("a").balance).toBe(0);
    expect(balances.get("b").balance).toBe(0);
  });

  test("returns the current user's remaining amount after settlements", () => {
    const members = [member("a", "A"), member("b", "B")];
    const expenses = [expense(200, "a")];
    const settlements = [{ from: "b", to: "a", amount: 40 }];

    expect(calculateBalance(expenses, members, settlements, "b")).toEqual({
      owe: 60,
      owed: 0,
    });

    expect(calculateBalance(expenses, members, settlements, "a")).toEqual({
      owe: 0,
      owed: 60,
    });
  });

  test("creates a minimal settlement plan", () => {
    const members = [
      member("a", "A"),
      member("b", "B"),
      member("c", "C"),
      member("d", "D"),
    ];

    const settlements = calculateSettlementPlan(
      [expense(400, "a"), expense(200, "b")],
      members,
      []
    );

    expect(settlements).toHaveLength(2);
    expect(settlements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: expect.objectContaining({ userId: "c" }), amount: 150 }),
        expect.objectContaining({ from: expect.objectContaining({ userId: "d" }), amount: 150 }),
      ])
    );
  });
});

describe("expense access checks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("allows the trip admin", async () => {
    const tripId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();
    const trip = {
      admin: { toString: () => userId },
    };

    Trip.findById.mockResolvedValue(trip);

    await expect(canAccessTripExpenses(tripId, userId)).resolves.toEqual({
      allowed: true,
      trip,
    });

    expect(Member.findOne).not.toHaveBeenCalled();
  });

  test("allows an accepted trip member", async () => {
    const tripId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();
    const trip = {
      admin: { toString: () => new mongoose.Types.ObjectId().toString() },
    };

    Trip.findById.mockResolvedValue(trip);
    Member.findOne.mockResolvedValue({ status: "accepted" });

    await expect(canAccessTripExpenses(tripId, userId)).resolves.toEqual({
      allowed: true,
      trip,
    });
  });

  test("rejects a pending or unknown member", async () => {
    const tripId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();
    const trip = {
      admin: { toString: () => new mongoose.Types.ObjectId().toString() },
    };

    Trip.findById.mockResolvedValue(trip);
    Member.findOne.mockResolvedValue(null);

    await expect(canAccessTripExpenses(tripId, userId)).resolves.toEqual({
      allowed: false,
      reason: "Access denied",
    });
  });

  test("rejects an invalid trip id", async () => {
    await expect(canAccessTripExpenses("bad-id", "user")).resolves.toEqual({
      allowed: false,
      reason: "Invalid trip id",
    });

    expect(Trip.findById).not.toHaveBeenCalled();
  });
});
