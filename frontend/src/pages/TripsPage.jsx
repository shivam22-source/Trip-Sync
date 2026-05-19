import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TripCard from "../components/TripCard";
import { api } from "../services/api";


const initialForm = {
  title: "",
  destination: "",
  description: "",
  startDate: "",
  endDate: "",
  category: "peaceful",
  budget: "medium",
  budgetPerDay: {
    min: 800,
    max: 3000,
  },
  maxMembers: 4,
  coverImage: null,
  filters: {
    smokingAllowed: false,
    drinkingAllowed: false,
    genderPreference: "any",
  },
};

const budgetRangeMap = {
  low: { min: 100, max: 800 },
  medium: { min: 800, max: 3000 },
  high: { min: 3000, max: 10000 },
};

const budgetText = {
  low: "Low: Rs 100-800/day",
  medium: "Medium: Rs 800-3000/day",
  high: "High: Rs 3000+/day",
};

function TripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({
    q: "",
    category: "all",
    budget: "all",
    smokingAllowed: false,
    drinkingAllowed: false,
    genderPreference: "any",
  });
  const [status, setStatus] = useState({
    loading: true,
    saving: false,
    error: "",
    success: "",
  });

  const loadTrips = useCallback(async () => {
    setStatus((current) => ({ ...current, loading: true, error: "" }));

    try {
      const data = await api.getTrips({
        ...filters,
        smokingAllowed: filters.smokingAllowed ? "true" : "",
        drinkingAllowed: filters.drinkingAllowed ? "true" : "",
      });
      setTrips(Array.isArray(data) ? data : []);
      setStatus((current) => ({ ...current, loading: false }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        loading: false,
        error: error.message,
      }));
    }
  }, [filters]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  function updateForm(event) {
    const { files, name, type, value } = event.target;

    if (type === "file") {
      setForm((current) => ({
        ...current,
        [name]: files?.[0] || null,
      }));
      return;
    }

    setForm((current) => {
      if (name === "budget") {
        return {
          ...current,
          budget: value,
          budgetPerDay: budgetRangeMap[value],
        };
      }

      return { ...current, [name]: value };
    });
  }

  function updateTripFilter(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      filters: {
        ...current.filters,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  }

  function updateSearchFilter(event) {
    const { name, type, checked, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleCreateTrip(event) {
    event.preventDefault();
    setStatus((current) => ({ ...current, saving: true, error: "", success: "" }));

    try {
      const tripData = new FormData();
      tripData.append("title", form.title);
      tripData.append("destination", form.destination);
      tripData.append("description", form.description);
      tripData.append("startDate", form.startDate);
      tripData.append("endDate", form.endDate);
      tripData.append("category", form.category);
      tripData.append("budget", form.budget);
      tripData.append("maxMembers", Number(form.maxMembers));
      tripData.append(
        "budgetPerDay",
        JSON.stringify({
          min: Number(form.budgetPerDay.min),
          max: Number(form.budgetPerDay.max),
        })
      );
      tripData.append("filters", JSON.stringify(form.filters));

      if (form.coverImage) {
        tripData.append("coverImage", form.coverImage);
      }

      const data = await api.createTrip(tripData);
      setForm(initialForm);
      setStatus((current) => ({
        ...current,
        saving: false,
        success: "Trip created successfully.",
      }));
      navigate(`/trips/${data.trip._id}`);
    } catch (error) {
      setStatus((current) => ({
        ...current,
        saving: false,
        error: error.message,
      }));
    }
  }

  const visibleTrips = useMemo(() => trips, [trips]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">
            Find a group
          </p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">
            Explore trips that match your comfort and budget
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Search by destination, vibe, daily budget, and group rules. If you
            like a plan, request to join and the trip admin will review your
            travel profile.
          </p>
        </div>
        <button
          onClick={() => document.getElementById("create-trip-form")?.scrollIntoView()}
          className="w-fit rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Create trip
        </button>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <input
            name="q"
            value={filters.q}
            onChange={updateSearchFilter}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 focus:bg-white"
            placeholder="Search destination"
          />
          <select
            name="category"
            value={filters.category}
            onChange={updateSearchFilter}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 focus:bg-white"
          >
            <option value="all">All vibes</option>
            <option value="peaceful">Peaceful</option>
            <option value="adventure">Adventure</option>
            <option value="trek">Trek</option>
            <option value="party">Party</option>
            <option value="luxury">Luxury</option>
          </select>
          <select
            name="budget"
            value={filters.budget}
            onChange={updateSearchFilter}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 focus:bg-white"
          >
            <option value="all">All budgets</option>
            <option value="low">Low budget</option>
            <option value="medium">Medium budget</option>
            <option value="high">High budget</option>
          </select>
          <select
            name="genderPreference"
            value={filters.genderPreference}
            onChange={updateSearchFilter}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 focus:bg-white"
          >
            <option value="any">Any group</option>
            <option value="male">Male preferred</option>
            <option value="female">Female preferred</option>
          </select>
          <button
            type="button"
            onClick={loadTrips}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Search
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
            <input
              name="smokingAllowed"
              type="checkbox"
              checked={filters.smokingAllowed}
              onChange={updateSearchFilter}
              className="h-4 w-4 accent-slate-950"
            />
            Smoking allowed
          </label>
          <label className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
            <input
              name="drinkingAllowed"
              type="checkbox"
              checked={filters.drinkingAllowed}
              onChange={updateSearchFilter}
              className="h-4 w-4 accent-slate-950"
            />
            Drinking allowed
          </label>
        </div>
      </section>

      <section className="mt-6 grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Create trip</h2>
            <form
              id="create-trip-form"
              onSubmit={handleCreateTrip}
              className="mt-5 space-y-4"
            >
                {[
                  ["title", "Trip title", "Goa beach reset"],
                  ["destination", "Destination", "Goa"],
                ].map(([name, label, placeholder]) => (
                  <label key={name} className="block">
                    <span className="text-sm font-bold text-slate-700">{label}</span>
                    <input
                      name={name}
                      value={form[name]}
                      onChange={updateForm}
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 focus:bg-white"
                      placeholder={placeholder}
                    />
                  </label>
                ))}

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Description
                  </span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateForm}
                    rows="3"
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 focus:bg-white"
                    placeholder="Short plan, vibe, and expectations"
                  />
                </label>

                <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <span className="text-sm font-bold text-slate-700">
                    Trip cover image
                  </span>
                  <input
                    name="coverImage"
                    type="file"
                    accept="image/*"
                    onChange={updateForm}
                    className="mt-3 w-full text-sm font-semibold text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                  />
                  {form.coverImage && (
                    <p className="mt-2 truncate text-xs font-bold text-slate-500">
                      Selected: {form.coverImage.name}
                    </p>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Start</span>
                    <input
                      name="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={updateForm}
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">End</span>
                    <input
                      name="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={updateForm}
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Vibe</span>
                    <select
                      name="category"
                      value={form.category}
                      onChange={updateForm}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                    >
                      <option value="peaceful">Peaceful</option>
                      <option value="adventure">Adventure</option>
                      <option value="trek">Trek</option>
                      <option value="party">Party</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Budget</span>
                    <select
                      name="budget"
                      value={form.budget}
                      onChange={updateForm}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {budgetText[form.budget]}
                    </p>
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Seats</span>
                    <input
                      name="maxMembers"
                      type="number"
                      min="2"
                      value={form.maxMembers}
                      onChange={updateForm}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-900">
                    Trip access filters
                  </p>
                  <div className="mt-3 grid gap-3">
                    <label className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                      <span className="text-sm font-bold text-slate-700">
                        Smoking allowed
                      </span>
                      <input
                        name="smokingAllowed"
                        type="checkbox"
                        checked={form.filters.smokingAllowed}
                        onChange={updateTripFilter}
                        className="h-5 w-5 accent-slate-950"
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                      <span className="text-sm font-bold text-slate-700">
                        Drinking allowed
                      </span>
                      <input
                        name="drinkingAllowed"
                        type="checkbox"
                        checked={form.filters.drinkingAllowed}
                        onChange={updateTripFilter}
                        className="h-5 w-5 accent-slate-950"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        Gender preference
                      </span>
                      <select
                        name="genderPreference"
                        value={form.filters.genderPreference}
                        onChange={updateTripFilter}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-slate-950"
                      >
                        <option value="any">Any</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </label>
                  </div>
                </div>

                <button
                  disabled={status.saving}
                  className="w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                >
                  {status.saving ? "Creating..." : "Create trip"}
                </button>
            </form>
          </div>

        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Results
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Available trips
              </h2>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600">
              {status.loading ? "Loading..." : `${visibleTrips.length} found`}
            </span>
          </div>

          {status.error && (
            <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {status.error}
            </p>
          )}
          {status.success && (
            <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {status.success}
            </p>
          )}

          {status.loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          ) : visibleTrips.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleTrips.map((trip) => (
                <TripCard key={trip._id} trip={trip} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-2xl font-black text-slate-950">
                No trips found
              </h2>
              <p className="mt-2 text-slate-600">
                Try clearing filters or create the first invitation.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default TripsPage;
