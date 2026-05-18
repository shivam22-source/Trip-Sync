import {
  CircleDollarSign,
  Hotel,
  Image,
  Plane,
  ReceiptIndianRupee,
  Utensils,
} from "lucide-react";

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const categoryIcons = {
  Flights: Plane,
  Food: Utensils,
  Hotel,
  Misc: CircleDollarSign,
};

function ExpenseCard({ expense }) {
  const Icon = categoryIcons[expense.category] || ReceiptIndianRupee;

  return (
    <article className="flex flex-col gap-4 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon size={20} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-black text-slate-950">
              {expense.description}
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
              {expense.category}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Paid by {expense.paidBy}
          </p>
          {expense.receiptName && (
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-400">
              <Image size={14} />
              {expense.receiptName}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 sm:block sm:text-right">
        <p className="text-lg font-black text-slate-950">
          {moneyFormatter.format(expense.amount)}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-400">{expense.date}</p>
      </div>
    </article>
  );
}

export default ExpenseCard;
