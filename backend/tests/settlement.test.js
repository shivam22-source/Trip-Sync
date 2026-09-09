const {
  generateEqualSplits,
  calculateRawBalances,
  calculateBalance,
  calculateSettlementPlan,
} = require("../src/utils/settlement");

const members = [
  { _id: "a", name: "A" },
  { _id: "b", name: "B" },
  { _id: "c", name: "C" },
  { _id: "d", name: "D" },
  { _id: "e", name: "E" },
];

describe("generateEqualSplits", () => {
  test("splits equally among selected participants", () => {
    expect(generateEqualSplits(900, ["a", "b", "c"])).toEqual([
      { userId: "a", amount: 3 },
      { userId: "b", amount: 3 },
      { userId: "c", amount: 3 },
    ].map((split) => ({ ...split, amount: split.amount * 100 })));
  });

  test("allocates remainder deterministically and preserves the total", () => {
    const splits = generateEqualSplits(1000, ["a", "b", "c"]);

    expect(splits).toEqual([
      { userId: "a", amount: 333.34 },
      { userId: "b", amount: 333.33 },
      { userId: "c", amount: 333.33 },
    ]);
    expect(splits.reduce((sum, split) => sum + split.amount, 0)).toBe(1000);
  });

  test("removes duplicate participants", () => {
    expect(generateEqualSplits(600, ["a", "a", "b"])).toEqual([
      { userId: "a", amount: 300 },
      { userId: "b", amount: 300 },
    ]);
  });
});

describe("calculateRawBalances", () => {
  test("splits an expense only among selected participants", () => {
    const expenses = [
      {
        amount: 1000,
        paidBy: { _id: "a" },
        splits: [
          { userId: "a", amount: 333.34 },
          { userId: "b", amount: 333.33 },
          { userId: "c", amount: 333.33 },
        ],
      },
    ];

    const balances = calculateRawBalances(expenses, members);

    expect(balances.get("a").balance).toBe(666.66);
    expect(balances.get("b").balance).toBe(-333.33);
    expect(balances.get("c").balance).toBe(-333.33);
    expect(balances.get("d").balance).toBe(0);
    expect(balances.get("e").balance).toBe(0);
  });

  test("supports expenses where the payer is not a participant", () => {
    const expenses = [
      {
        amount: 600,
        paidBy: { _id: "a" },
        splits: [
          { userId: "b", amount: 300 },
          { userId: "c", amount: 300 },
        ],
      },
    ];

    const balances = calculateRawBalances(expenses, members);

    expect(balances.get("a").balance).toBe(600);
    expect(balances.get("b").balance).toBe(-300);
    expect(balances.get("c").balance).toBe(-300);
  });

  test("keeps legacy expenses working during the data transition", () => {
    const expenses = [{ amount: 900, splitEqually: true, paidBy: { _id: "a" } }];
    const balances = calculateRawBalances(expenses, members.slice(0, 3));

    expect(balances.get("a").balance).toBe(600);
    expect(balances.get("b").balance).toBe(-300);
    expect(balances.get("c").balance).toBe(-300);
  });
});

describe("calculateBalance", () => {
  test("calculates a participant's amount owed", () => {
    const expenses = [{
      amount: 1000,
      paidBy: { _id: "a" },
      splits: [
        { userId: "a", amount: 333.34 },
        { userId: "b", amount: 333.33 },
        { userId: "c", amount: 333.33 },
      ],
    }];

    expect(calculateBalance(expenses, members, [], "b")).toEqual({
      owe: 333.33,
      owed: 0,
    });
    expect(calculateBalance(expenses, members, [], "d")).toEqual({
      owe: 0,
      owed: 0,
    });
  });

  test("applies actual settlements to the derived balance", () => {
    const expenses = [{
      amount: 600,
      paidBy: { _id: "a" },
      splits: [
        { userId: "a", amount: 300 },
        { userId: "b", amount: 300 },
      ],
    }];

    expect(calculateBalance(expenses, members, [
      { from: "b", to: "a", amount: 100 },
    ], "b")).toEqual({ owe: 200, owed: 0 });
  });
});

describe("calculateSettlementPlan", () => {
  test("nets multiple expenses before creating transfers", () => {
    const expenses = [
      {
        amount: 1000,
        paidBy: { _id: "a" },
        splits: [
          { userId: "a", amount: 333.34 },
          { userId: "b", amount: 333.33 },
          { userId: "c", amount: 333.33 },
        ],
      },
      {
        amount: 300,
        paidBy: { _id: "c" },
        splits: [
          { userId: "a", amount: 150 },
          { userId: "c", amount: 150 },
        ],
      },
    ];

    expect(calculateSettlementPlan(expenses, members, [])).toEqual([
      {
        id: "b-a",
        from: { userId: "b", name: "B" },
        to: { userId: "a", name: "A" },
        amount: 333.33,
      },
      {
        id: "c-a",
        from: { userId: "c", name: "C" },
        to: { userId: "a", name: "A" },
        amount: 183.33,
      },
    ]);
  });

  test("simplifies multiple debtors and creditors", () => {
    const expenses = [
      {
        amount: 1000,
        paidBy: { _id: "a" },
        splits: [
          { userId: "a", amount: 200 },
          { userId: "b", amount: 200 },
          { userId: "c", amount: 200 },
          { userId: "d", amount: 200 },
          { userId: "e", amount: 200 },
        ],
      },
      {
        amount: 500,
        paidBy: { _id: "b" },
        splits: [
          { userId: "b", amount: 250 },
          { userId: "e", amount: 250 },
        ],
      },
    ];

    const plan = calculateSettlementPlan(expenses, members, []);

    expect(plan).toEqual([
      {
        id: "c-a",
        from: { userId: "c", name: "C" },
        to: { userId: "a", name: "A" },
        amount: 200,
      },
      {
        id: "d-a",
        from: { userId: "d", name: "D" },
        to: { userId: "a", name: "A" },
        amount: 200,
      },
      {
        id: "e-a",
        from: { userId: "e", name: "E" },
        to: { userId: "a", name: "A" },
        amount: 150,
      },
    ]);
  });

  test("returns no transfers after everything is settled", () => {
    const expenses = [{
      amount: 600,
      paidBy: { _id: "a" },
      splits: [
        { userId: "a", amount: 300 },
        { userId: "b", amount: 300 },
      ],
    }];

    expect(calculateSettlementPlan(expenses, members, [
      { from: "b", to: "a", amount: 300 },
    ])).toEqual([]);
  });
});
