import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function SettlementSummary({ settlements = [], onSettle, settlingId, currentUserId }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-wide text-slate-400">Your payment plan</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Who needs to pay whom</h2>
      </div>

      {settlements.length ? (
        <div className="divide-y divide-slate-100">
          {settlements.map((settlement) => {
            const isPayer = settlement.from.userId.toString() === currentUserId?.toString();

            return (
              <div key={settlement.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                    {isPayer ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {isPayer ? `Pay ${settlement.to.name}` : `${settlement.from.name} pays you`}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {isPayer ? "You need to send this amount" : "You will receive this amount"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <p className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">{moneyFormatter.format(settlement.amount)}</p>
                  {isPayer && (
                    <button type="button" onClick={() => onSettle(settlement)} disabled={settlingId === settlement.id} className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-60">
                      {settlingId === settlement.id ? "Saving..." : "Mark as paid"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-5 text-sm font-semibold text-slate-500 sm:p-6">Everything is balanced right now.</div>
      )}
    </section>
  );
}

export default SettlementSummary;
