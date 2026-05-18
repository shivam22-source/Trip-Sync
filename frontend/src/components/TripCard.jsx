import { Link } from "react-router-dom";

const budgetLabel = {
  low: "Rs 100-800/day",
  medium: "Rs 800-3000/day",
  high: "Rs 3000+/day",
};

function formatDate(date) {
  if (!date) {
    return "Date pending";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

function TripCard({ trip }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-36 overflow-hidden bg-slate-200">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#0f172a,#0f766e,#f59e0b)] text-5xl font-black text-white/80">
            {trip.destination?.slice(0, 1) || "T"}
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-800 shadow-sm">
          {trip.category || "peaceful"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="line-clamp-2 text-xl font-black text-slate-950">
              {trip.title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {trip.destination}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {trip.status || "open"}
          </span>
        </div>

        <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
          {trip.description || "A fresh trip invitation waiting for the right travel buddies."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase text-slate-400">Dates</p>
            <p className="mt-1 font-bold text-slate-800">
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase text-slate-400">Budget</p>
            <p className="mt-1 font-bold text-slate-800">
              {budgetLabel[trip.budget] || trip.budget || "Balanced spend"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {trip.filters?.smokingAllowed && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Smoking allowed
            </span>
          )}
          {trip.filters?.drinkingAllowed && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Drinking allowed
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">
            {trip.filters?.genderPreference || "any"} group
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-slate-500">
            By {trip.admin?.name || "Trip admin"}
          </p>
          <Link
            to={`/trips/${trip._id}`}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

export default TripCard;
