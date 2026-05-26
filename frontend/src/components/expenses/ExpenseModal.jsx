import { ImageUp, X } from "lucide-react";

const categories = ["Flights", "Food", "Hotel", "Misc"];

function ExpenseModal({
  isOpen,
  onClose,
  form,
  onFormChange,
  onSubmit,
  isSaving,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Add Expense</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Add a trip cost and split it with your group.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Close add expense modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-black text-slate-700">Amount</span>
            <span className="ml-2 text-xs font-bold text-slate-400">
              optional with receipt
            </span>
            <input
              type="number"
              min="1"
              placeholder={"Amount (\u20b9)"}
              value={form.amount}
              onChange={(event) => onFormChange("amount", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-700">
              Description
            </span>
            <span className="ml-2 text-xs font-bold text-slate-400">
              optional with receipt
            </span>
            <input
              type="text"
              placeholder="Dinner, cab, hotel booking..."
              value={form.description}
              onChange={(event) =>
                onFormChange("description", event.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-700">Category</span>
            <select
              value={form.category}
              onChange={(event) => onFormChange("category", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <span className="flex items-center gap-2 text-sm font-black text-slate-700">
              <ImageUp size={18} />
              Receipt Screenshot
            </span>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Upload a receipt to let AI read amount and description.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                onFormChange("receipt", event.target.files?.[0] || null)
              }
              className="mt-3 w-full text-sm font-semibold text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
            />
            {form.receipt && (
              <p className="mt-2 truncate text-xs font-bold text-slate-500">
                Selected: {form.receipt.name}
              </p>
            )}
          </label>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span>
              <span className="block text-sm font-black text-slate-800">
                Split Equally
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Everyone gets the same share for now.
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.splitEqually}
              onChange={(event) =>
                onFormChange("splitEqually", event.target.checked)
              }
              className="h-5 w-5 accent-slate-950"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              {isSaving ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpenseModal;
