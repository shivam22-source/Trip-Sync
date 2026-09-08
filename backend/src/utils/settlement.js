function roundMoney(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function calculateRawBalances(expenses, members) {
  const balances = new Map(
    members.map((member) => [
      member._id.toString(),
      {
        userId: member._id,
        name: member.name || "Traveler",
        balance: 0,
      },
    ])
  );

  expenses.forEach((expense) => {
    if (!expense.splitEqually || members.length === 0) {
      return;
    }

    const paidById = expense.paidBy._id.toString();
    const share = expense.amount / members.length;

    members.forEach((member) => {
      const memberBalance = balances.get(member._id.toString());
      memberBalance.balance -= share;
    });

    const payerBalance = balances.get(paidById);

    if (payerBalance) {
      payerBalance.balance += expense.amount;
    }
  });

  return balances;
}

function applySettlementsToBalances(balances, settlements) {
  settlements.forEach((settlement) => {
    const fromBalance = balances.get(settlement.from.toString());
    const toBalance = balances.get(settlement.to.toString());

    if (fromBalance) {
      fromBalance.balance += settlement.amount;
    }

    if (toBalance) {
      toBalance.balance -= settlement.amount;
    }
  });
}

function calculateBalance(expenses, members, settlements, userId) {
  const balances = calculateRawBalances(expenses, members);
  applySettlementsToBalances(balances, settlements);

const userBalance = roundMoney(
  balances.get(userId)?.balance || 0
);

  return {
    owe: userBalance < 0 ? Math.abs(userBalance) : 0,
    owed: userBalance > 0 ? userBalance : 0,
  };
}

function calculateSettlementPlan(expenses, members, paidSettlements) {
  const balances = calculateRawBalances(expenses, members);
  applySettlementsToBalances(balances, paidSettlements);

  const debtors = [];
  const creditors = [];

  balances.forEach((memberBalance) => {
    const roundedBalance = roundMoney(memberBalance.balance);

    if (roundedBalance < 0) {
      debtors.push({
        ...memberBalance,
        balance: Math.abs(roundedBalance),
      });
    }

    if (roundedBalance > 0) {
      creditors.push({
        ...memberBalance,
        balance: roundedBalance,
      });
    }
  });

  const settlements = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (
    debtorIndex < debtors.length &&
    creditorIndex < creditors.length
  ) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = roundMoney(
  Math.min(debtor.balance, creditor.balance)
);

    if (amount > 0) {
      settlements.push({
        id: `${debtor.userId}-${creditor.userId}`,
        from: {
          userId: debtor.userId,
          name: debtor.name,
        },
        to: {
          userId: creditor.userId,
          name: creditor.name,
        },
        amount,
      });
    }

    debtor.balance -= amount;
    creditor.balance -= amount;

    if (roundMoney(debtor.balance) === 0) {
      debtorIndex += 1;
    }

    if (roundMoney(creditor.balance) === 0) {
      creditorIndex += 1;
    }
  }

  return settlements;
}

module.exports = {
  calculateRawBalances,
  applySettlementsToBalances,
  calculateBalance,
  calculateSettlementPlan,
};