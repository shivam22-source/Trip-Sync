import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function BalanceTile({ icon: Icon, label, value, tone }) {
  const styles = {
    owe: "border-rose-100 bg-rose-50 text-rose-700",
    owed: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black">{label}</p>
        <Icon size={18} />
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight">
        {moneyFormatter.format(value)}
      </p>
    </div>
  );
}

function BalanceHero({ owe, owed }) {
  const netBalance = owed - owe;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
            <Wallet size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-950">Your Balance</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Trip expense summary
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
          Net:{" "}
          <span
            className={
              netBalance >= 0 ? "text-emerald-700" : "text-rose-700"
            }
          >
            {moneyFormatter.format(Math.abs(netBalance))}
            {netBalance >= 0 ? " to receive" : " to pay"}
          </span>
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-100 bg-slate-50/70 p-5 sm:grid-cols-2 sm:p-6">
        <BalanceTile
          icon={ArrowUpRight}
          label="You Owe"
          value={owe}
          tone="owe"
        />
        <BalanceTile
          icon={ArrowDownLeft}
          label="You Are Owed"
          value={owed}
          tone="owed"
        />
      </div>
    </div>
  );
}

export default BalanceHero;
