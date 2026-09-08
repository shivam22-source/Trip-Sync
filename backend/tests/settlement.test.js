const {
  calculateRawBalances,
} = require("../src/utils/settlement");

describe("calculateRawBalances", () => {
  test("calculates balances for an equally split expense", () => {
    const members = [
      { _id: "a", name: "A" },
      { _id: "b", name: "B" },
      { _id: "c", name: "C" },
    ];

    const expenses = [
      {
        amount: 900,
        splitEqually: true,
        paidBy: { _id: "a" },
      },
    ];

    const balances = calculateRawBalances(expenses, members);

    expect(balances.get("a").balance).toBe(600);
    expect(balances.get("b").balance).toBe(-300);
    expect(balances.get("c").balance).toBe(-300);
  });
});