
const {
  calculateRawBalances,
  calculateBalance,
  calculateSettlementPlan
  
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

  test("returns zero balances when there are no expenses", () => {
  const members = [
    { _id: "a", name: "A" },
    { _id: "b", name: "B" },
    { _id: "c", name: "C" },
  ];

  const balances = calculateRawBalances([], members);

  expect(balances.get("a").balance).toBe(0);
  expect(balances.get("b").balance).toBe(0);
  expect(balances.get("c").balance).toBe(0);
});
test("ignores expenses that are not split equally", () => {
  const members = [
    { _id: "a", name: "A" },
    { _id: "b", name: "B" },
    { _id: "c", name: "C" },
  ];

  const expenses = [
    {
      amount: 900,
      splitEqually: false,
      paidBy: { _id: "a" },
    },
  ];

  const balances = calculateRawBalances(expenses, members);

  expect(balances.get("a").balance).toBe(0);
  expect(balances.get("b").balance).toBe(0);
  expect(balances.get("c").balance).toBe(0);
});

test("calculates balances correctly for multiple expenses", () => {
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
    {
      amount: 600,
      splitEqually: true,
      paidBy: { _id: "b" },
    },
  ];

  const balances = calculateRawBalances(expenses, members);

  expect(balances.get("a").balance).toBe(400);
  expect(balances.get("b").balance).toBe(100);
  expect(balances.get("c").balance).toBe(-500);
});
test("calculates how much a user owes", () => {
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

  const balance = calculateBalance(expenses, members, [], "b");

  expect(balance.owe).toBe(300);
  expect(balance.owed).toBe(0);
});

test("calculates how much a user is owed", () => {
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

  const balance = calculateBalance(expenses, members, [], "a");

  expect(balance.owe).toBe(0);
  expect(balance.owed).toBe(600);
});

test("reduces the amount owed after a settlement", () => {
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

  const settlements = [
    {
      from: "b",
      to: "a",
      amount: 100,
    },
  ];

  const balance = calculateBalance(
    expenses,
    members,
    settlements,
    "b"
  );

  expect(balance.owe).toBe(200);
  expect(balance.owed).toBe(0);
});

test("creates a settlement between one debtor and one creditor", () => {
  const members = [
    { _id: "a", name: "A" },
    { _id: "b", name: "B" },
  ];

  const expenses = [
    {
      amount: 600,
      splitEqually: true,
      paidBy: { _id: "a" },
    },
  ];

  const settlements = calculateSettlementPlan(
    expenses,
    members,
    []
  );

  expect(settlements).toHaveLength(1);

  expect(settlements[0].from.userId).toBe("b");
  expect(settlements[0].to.userId).toBe("a");
  expect(settlements[0].amount).toBe(300);
});
test("creates settlements for multiple debtors and one creditor", () => {
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

  const settlements = calculateSettlementPlan(
    expenses,
    members,
    []
  );

  expect(settlements).toHaveLength(2);

  expect(settlements).toEqual([
    {
      id: "b-a",
      from: {
        userId: "b",
        name: "B",
      },
      to: {
        userId: "a",
        name: "A",
      },
      amount: 300,
    },
    {
      id: "c-a",
      from: {
        userId: "c",
        name: "C",
      },
      to: {
        userId: "a",
        name: "A",
      },
      amount: 300,
    },
  ]);
});
test("creates settlements for one creditor and multiple debtors", () => {
  const members = [
    { _id: "a", name: "A" },
    { _id: "b", name: "B" },
    { _id: "c", name: "C" },
  ];

  const expenses = [
    {
      amount: 300,
      splitEqually: true,
      paidBy: { _id: "a" },
    },
    {
      amount: 900,
      splitEqually: true,
      paidBy: { _id: "b" },
    },
  ];

  const settlements = calculateSettlementPlan(
    expenses,
    members,
    []
  );

  expect(settlements).toEqual([
    {
      id: "a-b",
      from: {
        userId: "a",
        name: "A",
      },
      to: {
        userId: "b",
        name: "B",
      },
      amount: 100,
    },
    {
      id: "c-b",
      from: {
        userId: "c",
        name: "C",
      },
      to: {
        userId: "b",
        name: "B",
      },
      amount: 400,
    },
  ]);
});

test("creates the correct plan for multiple debtors and creditors", () => {
  const members = [
    { _id: "a", name: "A" },
    { _id: "b", name: "B" },
    { _id: "c", name: "C" },
    { _id: "d", name: "D" },
    { _id: "e", name: "E" },
  ];

  const expenses = [
    {
      amount: 1000,
      splitEqually: true,
      paidBy: { _id: "a" },
    },
    {
      amount: 500,
      splitEqually: true,
      paidBy: { _id: "b" },
    },
  ];

  const settlements = calculateSettlementPlan(
    expenses,
    members,
    []
  );

  expect(settlements).toEqual([
    {
      id: "c-a",
      from: {
        userId: "c",
        name: "C",
      },
      to: {
        userId: "a",
        name: "A",
      },
      amount: 300,
    },
    {
      id: "d-a",
      from: {
        userId: "d",
        name: "D",
      },
      to: {
        userId: "a",
        name: "A",
      },
      amount: 300,
    },
    {
      id: "e-a",
      from: {
        userId: "e",
        name: "E",
      },
      to: {
        userId: "a",
        name: "A",
      },
      amount: 100,
    },
    {
      id: "e-b",
      from: {
        userId: "e",
        name: "E",
      },
      to: {
        userId: "b",
        name: "B",
      },
      amount: 200,
    },
  ]);
});
test("returns no settlements when everything is already settled", () => {
  const members = [
    { _id: "a", name: "A" },
    { _id: "b", name: "B" },
  ];

  const expenses = [
    {
      amount: 600,
      splitEqually: true,
      paidBy: { _id: "a" },
    },
  ];

  const paidSettlements = [
    {
      from: "b",
      to: "a",
      amount: 300,
    },
  ];

  const settlements = calculateSettlementPlan(
    expenses,
    members,
    paidSettlements
  );

  expect(settlements).toEqual([]);
});
test("rounds decimal balances to the nearest whole amount", () => {
  const members = [
    { _id: "a", name: "A" },
    { _id: "b", name: "B" },
    { _id: "c", name: "C" },
  ];

  const expenses = [
    {
      amount: 100,
      splitEqually: true,
      paidBy: { _id: "a" },
    },
  ];

  const balance = calculateBalance(expenses, members, [], "b");

  expect(balance.owe).toBe(33.33);
  expect(balance.owed).toBe(0);
});

test("returns zero balance after the exact amount is settled", () => {
  const members = [
    { _id: "a", name: "A" },
    { _id: "b", name: "B" },
  ];

  const expenses = [
    {
      amount: 600,
      splitEqually: true,
      paidBy: { _id: "a" },
    },
  ];

  const settlements = [
    {
      from: "b",
      to: "a",
      amount: 300,
    },
  ];

  const balance = calculateBalance(
    expenses,
    members,
    settlements,
    "b"
  );

  expect(balance.owe).toBe(0);
  expect(balance.owed).toBe(0);
});
});