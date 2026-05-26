import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../services/api";

function getTripDays(startDate, endDate) {
  if (!startDate || !endDate) {
    return 3;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  return Number.isFinite(diff) && diff > 0 ? diff : 3;
}

function getTripBudget(trip, days) {
  const dailyBudget = trip?.budgetPerDay?.max || trip?.budgetPerDay?.min || 1500;
  return Math.round(dailyBudget * days);
}

function TripAiPlanner({ trip, isAdmin, onPlanSaved }) {
  const days = useMemo(
    () => getTripDays(trip?.startDate, trip?.endDate),
    [trip?.endDate, trip?.startDate]
  );
  const [style, setStyle] = useState(trip?.category || "peaceful");
  const [plan, setPlan] = useState(trip?.aiItinerary?.plan || null);
  const [status, setStatus] = useState({
    loading: false,
    error: "",
  });

  async function handleGeneratePlan() {
    setStatus({ loading: true, error: "" });

    try {
      const data = await api.generateTripPlan({
        tripId: trip._id,
        destination: trip.destination,
        days,
        budget: getTripBudget(trip, days),
        style,
      });

      setPlan(data.tripPlan);
      onPlanSaved?.(data.aiItinerary);
      setStatus({ loading: false, error: "" });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-teal-700">
            AI itinerary
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Shared trip itinerary
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            The trip admin can generate or update this plan. Accepted members
            can view the same saved itinerary.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-3 sm:w-72">
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold capitalize outline-none focus:border-slate-950"
            >
              <option value="peaceful">Peaceful</option>
              <option value="adventure">Adventure</option>
              <option value="trek">Trek</option>
              <option value="party">Party</option>
              <option value="luxury">Luxury</option>
              <option value="budget">Budget</option>
              <option value="family">Family</option>
            </select>
            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={status.loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Sparkles size={18} />
              {status.loading
                ? "Generating..."
                : plan
                  ? "Regenerate plan"
                  : "Generate plan"}
            </button>
          </div>
        )}
      </div>

      {status.error && (
        <p className="mx-5 mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 sm:mx-6">
          {status.error}
        </p>
      )}

      {plan ? (
        <div className="p-5 sm:p-6">
          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="text-xl font-black text-slate-950">
              {plan.tripName || `${trip.destination} itinerary`}
            </h3>
            <div className="mt-3 grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-2">
              <p>Budget: {plan.estimatedBudget || "Not estimated"}</p>
              <p>Best time: {plan.bestTimeToVisit || "Flexible"}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {(plan.days || []).map((day) => (
              <div key={day.day} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Day {day.day}
                </p>
                <h4 className="mt-1 text-lg font-black text-slate-950">
                  {day.title}
                </h4>
                <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
                  <div>
                    <p className="font-black text-slate-800">Activities</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {(day.activities || []).map((activity) => (
                        <li key={activity}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-black text-slate-800">Food</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {(day.foodSuggestions || []).map((food) => (
                        <li key={food}>{food}</li>
                      ))}
                    </ul>
                    <p className="mt-3 font-bold text-slate-700">
                      {day.estimatedDailyBudget}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {plan.tips?.length ? (
            <div className="mt-5 rounded-2xl bg-teal-50 p-4">
              <p className="font-black text-teal-900">Quick tips</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-teal-800">
                {plan.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="p-5 text-sm font-semibold text-slate-500 sm:p-6">
          {isAdmin
            ? "No itinerary generated yet."
            : "The trip admin has not generated an itinerary yet."}
        </div>
      )}
    </section>
  );
}

export default TripAiPlanner;
