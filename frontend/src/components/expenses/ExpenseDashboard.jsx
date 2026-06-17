import { Plus, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import BalanceHero from "./BalanceHero";
import ExpenseCard from "./ExpenseCard";
import ExpenseModal from "./ExpenseModal";
import SettlementSummary from "./SettlementSummary";
import { api } from "../../services/api";

const initialForm = {
  amount: "",
  description: "",
  category: "Food",
  receipt: null,
  splitEqually: true,
};

function formatExpenseDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function normalizeExpense(expense) {
  return {
    id: expense._id,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    paidBy: expense.paidBy?.name || "Traveler",
    date: formatExpenseDate(expense.createdAt),
    receiptName: expense.receiptName,
  };
}

function ExpenseDashboard({ tripId }) {
  const { id: routeTripId } = useParams();
  const activeTripId =
    tripId && tripId !== "undefined" ? tripId : routeTripId;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [expenses, setExpenses] = useState([]);
  const [balance, setBalance] = useState({ owe: 0, owed: 0 });
  const [settlements, setSettlements] = useState([]);
  const [status, setStatus] = useState({
    loading: true,
    saving: false,
    settlingId: "",
    error: "",
    success: "",
  });

  function applyExpenseData(data) {
    setBalance(data.balance || { owe: 0, owed: 0 });
    setSettlements(data.settlements || []);
    setExpenses((data.expenses || []).map(normalizeExpense));
  }

  useEffect(() => {
    async function loadExpenses() {
      try {
        setStatus((current) => ({ ...current, loading: true, error: "" }));
        const data = await api.getExpenses(activeTripId);
        applyExpenseData(data);
        setStatus((current) => ({ ...current, loading: false }));
      } catch (error) {
        setStatus((current) => ({
          ...current,
          loading: false,
          error: error.message,
        }));
      }
    }

    if (activeTripId && activeTripId !== "undefined") {
      loadExpenses();
    } else {
      setStatus((current) => ({
        ...current,
        loading: false,
        error: "Trip id missing. Please refresh this trip page.",
      }));
    }
  }, [activeTripId]);

  function handleFormChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleAddExpense(event) {
    event.preventDefault();

    const amount = Number(form.amount);
    if ((!amount || amount <= 0 || !form.description.trim()) && !form.receipt) {
      setStatus((current) => ({
        ...current,
        error: "Add amount and description, or upload a receipt for AI extraction.",
      }));
      return;
    }

    if (!activeTripId || activeTripId === "undefined") {
      setStatus((current) => ({
        ...current,
        error: "Trip id missing. Please refresh this trip page.",
      }));
      return;
    }

    try {
      setStatus((current) => ({ ...current, saving: true, error: "", success: "" }));
      const expensePayload = new FormData();
      if (amount > 0) {
        expensePayload.append("amount", amount);
      }

      expensePayload.append("description", form.description.trim());
      expensePayload.append("category", form.category);
      expensePayload.append("splitEqually", String(form.splitEqually));

      if (form.receipt) {
        expensePayload.append("receipt", form.receipt);
      }

      await api.createExpense(activeTripId, expensePayload);

      const data = await api.getExpenses(activeTripId);
      applyExpenseData(data);
      setForm(initialForm);
      setIsModalOpen(false);
      setStatus((current) => ({ ...current, saving: false }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        saving: false,
        error: error.message,
      }));
    }
  }

  async function handleSettlePayment(settlement) {
    if (!activeTripId || activeTripId === "undefined") {
      setStatus((current) => ({
        ...current,
        error: "Trip id missing. Please refresh this trip page.",
      }));
      return;
    }

    try {
      setStatus((current) => ({
        ...current,
        settlingId: settlement.id,
        error: "",
        success: "",
      }));
      await api.settlePayment(activeTripId, {
        from: settlement.from.userId,
        to: settlement.to.userId,
        amount: settlement.amount,
      });
      const data = await api.getExpenses(activeTripId);
      applyExpenseData(data);
      setStatus((current) => ({
        ...current,
        settlingId: "",
        success: "Payment marked as paid.",
      }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        settlingId: "",
        error: error.message,
      }));
    }
  }

  return (
    <div className="space-y-5">
      <BalanceHero
        owe={balance.owe}
        owed={balance.owed}
      />

      <SettlementSummary
        settlements={settlements}
        onSettle={handleSettlePayment}
        settlingId={status.settlingId}
      />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Expense Splitter
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Recent Expenses
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Add Expense
          </button>
        </div>

        {status.error && (
          <p className="mx-5 mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 sm:mx-6">
            {status.error}
          </p>
        )}
        {status.success && (
          <p className="mx-5 mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700 sm:mx-6">
            {status.success}
          </p>
        )}

        {status.loading ? (
          <div className="space-y-3 p-5 sm:p-6">
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : expenses.length ? (
          <div className="max-h-[420px] overflow-y-auto">
            {expenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <ReceiptText size={24} />
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-950">
              No expenses yet
            </h3>
            <p className="mt-2 max-w-sm text-sm font-semibold text-slate-500">
              Add the first trip expense and it will appear here.
            </p>
          </div>
        )}
      </section>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        form={form}
        onFormChange={handleFormChange}
        onSubmit={handleAddExpense}
        isSaving={status.saving}
      />
    </div>
  );
}

export default ExpenseDashboard;
