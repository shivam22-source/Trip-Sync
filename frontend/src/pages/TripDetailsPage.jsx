import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ExpenseDashboard from "../components/expenses/ExpenseDashboard";
import TripChat from "../components/TripChat";
import { api, getStoredUser, getToken } from "../services/api";

function formatDate(date) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatBudget(trip) {
  if (!trip?.budgetPerDay) {
    return trip?.budget || "medium";
  }

  if (trip.budget === "high") {
    return `Rs ${trip.budgetPerDay.min}+ / person / day`;
  }

  return `Rs ${trip.budgetPerDay.min}-${trip.budgetPerDay.max} / person / day`;
}

function ProfileSummary({ person }) {
  return (
    <div>
      <p className="font-black text-slate-950">{person?.name || "Traveler"}</p>
      <p className="text-sm font-semibold text-slate-500">
        {[person?.age, person?.gender, person?.city].filter(Boolean).join(" | ")}
      </p>
      <p className="text-sm font-semibold text-slate-500">{person?.email}</p>
      {person?.bio && (
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          {person.bio}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          person?.occupation,
          person?.languages,
          person?.preferences?.vibe,
          person?.travelProfile?.travelStyle,
          person?.travelProfile?.groupRole,
          person?.preferences?.budget
            ? `${person.preferences.budget} budget`
            : "",
        ]
          .filter(Boolean)
          .map((item) => (
            <span
              key={item}
              className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-slate-600"
            >
              {item}
            </span>
          ))}
      </div>
      {(person?.travelProfile?.whyTravel || person?.travelProfile?.boundaries) && (
        <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
          {person.travelProfile.whyTravel && (
            <p>
              <span className="font-bold text-slate-800">Why travel: </span>
              {person.travelProfile.whyTravel}
            </p>
          )}
          {person.travelProfile.boundaries && (
            <p>
              <span className="font-bold text-slate-800">Comfort notes: </span>
              {person.travelProfile.boundaries}
            </p>
          )}
        </div>
      )}
      {person?.compatibility && (
        <div className="mt-3 rounded-2xl bg-white p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Compatibility signals
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              ["Money", person.compatibility.spendingBehavior],
              ["Split", person.compatibility.expenseSplit],
              ["Sleep", person.compatibility.sleepSchedule],
              ["Morning", person.compatibility.morningStyle],
              ["Clean", person.compatibility.cleanliness],
              ["Social", person.compatibility.socialEnergy],
              ["Food", person.compatibility.foodPreference],
              ["Activity", person.compatibility.activityPreference],
              ["Pace", person.compatibility.travelPace],
              ["Talk", person.compatibility.communicationStyle],
            ]
              .filter(([, value]) => Boolean(value))
              .map(([label, value]) => (
                <span
                  key={`${label}-${value}`}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700"
                >
                  {label}: {value}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TripDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const isLoggedIn = Boolean(getToken());
  const [trip, setTrip] = useState(null);
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState({
    loading: true,
    action: "",
    error: "",
    success: "",
    requestsError: "",
  });

  const isAdmin = useMemo(() => {
    const adminId = trip?.admin?._id || trip?.admin;
    return Boolean(user?._id && adminId && user._id === adminId);
  }, [trip, user]);

  const canChat = ["admin", "accepted"].includes(
    isAdmin ? "admin" : trip?.viewerRequestStatus
  );

  const loadTrip = useCallback(async () => {
    setStatus((current) => ({ ...current, loading: true, error: "" }));

    try {
      const data = await api.getTrip(id);
      setTrip(data);
      setStatus((current) => ({ ...current, loading: false }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        loading: false,
        error: error.message,
      }));
    }
  }, [id]);

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    try {
      const data = await api.getPendingRequests(id);
      setRequests(data.requests || []);
    } catch (error) {
      setStatus((current) => ({ ...current, requestsError: error.message }));
    }
  }, [id, isAdmin]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  async function runAction(action, successMessage) {
    setStatus((current) => ({
      ...current,
      action: action.name,
      error: "",
      success: "",
    }));

    try {
      await action();
      await loadTrip();
      await loadAdminData();
      setStatus((current) => ({
        ...current,
        action: "",
        success: successMessage,
      }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        action: "",
        error: error.message,
      }));
    }
  }

  async function handleDeleteTrip() {
    setStatus((current) => ({ ...current, action: "delete", error: "" }));

    try {
      await api.deleteTrip(id);
      navigate("/trips");
    } catch (error) {
      setStatus((current) => ({
        ...current,
        action: "",
        error: error.message,
      }));
    }
  }

  if (status.loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-[520px] animate-pulse rounded-3xl bg-slate-200" />
      </main>
    );
  }

  if (status.error && !trip) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-slate-950">Trip not available</h1>
        <p className="mt-3 text-slate-600">{status.error}</p>
        <Link
          to="/trips"
          className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white"
        >
          Back to trips
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/trips" className="text-sm font-black text-slate-500 hover:text-slate-950">
        Back to trips
      </Link>

      <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {trip.coverImage && (
          <div className="h-64 overflow-hidden bg-slate-100 sm:h-80">
            <img
              src={trip.coverImage}
              alt={trip.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="grid lg:grid-cols-[1fr_380px]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-teal-700">
                {trip.category}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                {trip.status}
              </span>
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              {trip.title}
            </h1>
            <p className="mt-3 text-xl font-bold text-slate-500">
              {trip.destination}
            </p>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
              {trip.description || "No description added yet."}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Start", formatDate(trip.startDate)],
                ["End", formatDate(trip.endDate)],
                ["Budget", formatBudget(trip)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 font-black capitalize text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">
                Trip access preferences
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                  {trip.filters?.smokingAllowed
                    ? "Smoking allowed"
                    : "No smoking"}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                  {trip.filters?.drinkingAllowed
                    ? "Drinking allowed"
                    : "No drinking"}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-slate-700">
                  {trip.filters?.genderPreference || "any"} group
                </span>
              </div>
            </div>
          </div>

          <aside className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
            <p className="text-sm font-black uppercase tracking-wide text-slate-400">
              Admin
            </p>
            <p className="mt-2 text-lg font-black text-slate-950">
              {trip.admin?.name || "Trip admin"}
            </p>
            <p className="text-sm font-semibold text-slate-500">
              {trip.admin?.email}
            </p>

            <div className="mt-6 rounded-2xl bg-white p-4">
              <p className="text-sm font-black text-slate-950">Members visible</p>
              <p className="mt-1 text-sm text-slate-500">
                {trip.currentMembers?.length || 0} of {trip.maxMembers} seats
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {!isLoggedIn ? (
                <Link
                  to="/login"
                  className="block rounded-2xl bg-slate-950 px-5 py-3 text-center font-black text-white"
                >
                  Login to join
                </Link>
              ) : !isAdmin ? (
                trip.viewerRequestStatus === "pending" ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-center font-black text-amber-800">
                    Request pending
                  </div>
                ) : trip.viewerRequestStatus === "accepted" ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-center font-black text-emerald-700">
                    You are accepted
                  </div>
                ) : trip.viewerRequestStatus === "rejected" ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-center font-black text-red-700">
                    Request rejected
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      runAction(() => api.joinTrip(id), "Join request sent.")
                    }
                    disabled={Boolean(status.action)}
                    className="w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {status.action ? "Working..." : "Request to join"}
                  </button>
                )
              ) : (
                <button
                  onClick={handleDeleteTrip}
                  disabled={Boolean(status.action)}
                  className="w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-3 font-black text-red-700 transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  Delete trip
                </button>
              )}
            </div>

            {status.error && (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                {status.error}
              </p>
            )}
            {status.success && (
              <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                {status.success}
              </p>
            )}
          </aside>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Pending requests</h2>
          {!isAdmin ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Only the trip admin can view and accept pending requests.
            </p>
          ) : status.requestsError ? (
            <p className="mt-3 text-sm font-bold text-red-700">
              {status.requestsError}
            </p>
          ) : requests.length ? (
            <div className="mt-5 space-y-3">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <ProfileSummary person={request.userId} />
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        runAction(
                          () => api.acceptRequest(id, request._id),
                          "Request accepted."
                        )
                      }
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        runAction(
                          () => api.rejectRequest(id, request._id),
                          "Request rejected."
                        )
                      }
                      className="rounded-full bg-slate-200 px-4 py-2 text-sm font-black text-slate-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              No pending requests yet.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Accepted members</h2>
          {trip.currentMembers?.length ? (
            <div className="mt-5 space-y-3">
              {trip.currentMembers.map((member) => (
                <div key={member._id} className="rounded-2xl bg-slate-50 p-4">
                  <ProfileSummary person={member} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Member profiles are visible only to the admin and accepted trip
              members.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <TripChat tripId={id} canChat={canChat} />
      </section>

      <section className="mt-6">
        <ExpenseDashboard tripId={id} />
      </section>
    </main>
  );
}

export default TripDetailsPage;
