function roundMoney(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function getExpenseSplits(expense, members) {
  if (Array.isArray(expense.splits) && expense.splits.length) {
    return expense.splits.map((split) => ({
      userId: split.userId,
      amount: roundMoney(Number(split.amount)),
    }));
  }

  // Backward compatibility for expenses created before participant-level splits.
  if (members.length === 0) {
    return [];
  }

  return generateEqualSplits(expense.amount, members.map((member) => member._id));
}

function generateEqualSplits(amount, userIds) {
  const uniqueIds = [...new Set(userIds.map((id) => id.toString()))];

  if (!uniqueIds.length) {
    throw new Error("At least one participant is required");
  }

  const totalPaise = Math.round(Number(amount) * 100);
  const basePaise = Math.floor(totalPaise / uniqueIds.length);
  const remainder = totalPaise % uniqueIds.length;

  return uniqueIds.map((userId, index) => ({
    userId,
    amount: (basePaise + (index < remainder ? 1 : 0)) / 100,
  }));
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
    const paidById = expense.paidBy?._id?.toString() || expense.paidBy?.toString();
    const payerBalance = balances.get(paidById);

    if (!payerBalance) {
      return;
    }

    const splits = getExpenseSplits(expense, members);
    const splitTotal = roundMoney(
      splits.reduce((total, split) => total + Number(split.amount), 0)
    );

    if (splitTotal !== roundMoney(Number(expense.amount))) {
      return;
    }

    payerBalance.balance += Number(expense.amount);

    splits.forEach((split) => {
      const memberBalance = balances.get(split.userId.toString());
      if (memberBalance) {
        memberBalance.balance -= Number(split.amount);
      }
    });
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

  const userBalance = roundMoney(balances.get(userId)?.balance || 0);

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
    const amount = roundMoney(Math.min(debtor.balance, creditor.balance));

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

    debtor.balance = roundMoney(debtor.balance - amount);
    creditor.balance = roundMoney(creditor.balance - amount);

    if (debtor.balance === 0) {
      debtorIndex += 1;
    }

    if (creditor.balance === 0) {
      creditorIndex += 1;
    }
  }

  return settlements;
}

module.exports = {
  roundMoney,
  generateEqualSplits,
  getExpenseSplits,
  calculateRawBalances,
  applySettlementsToBalances,
  calculateBalance,
  calculateSettlementPlan,
};
