import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  IndianRupee,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import manaliTripImage from "../assets/manali-trip.jpg";
import { getToken } from "../services/api";

const steps = [
  ["Build your travel profile", "Add your budget, habits, food, timing, and group style."],
  ["Find a matching trip", "Search by vibe, destination, budget, and comfort rules."],
  ["Request to join", "The trip admin reviews your profile before accepting."],
  ["Plan together", "Accepted members unlock the group chat and trip coordination."],
];

const signals = [
  [IndianRupee, "Money fit", "Budget range and expense expectations are clear early."],
  [Clock, "Timing fit", "Morning style, sleep schedule, and travel pace reduce friction."],
  [Users, "Group fit", "Social energy, food choices, activities, and boundaries help admins decide."],
];

function HomePage() {
  const isLoggedIn = Boolean(getToken());
  const primaryLink = isLoggedIn ? "/trips" : "/login";

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-black text-teal-800">
              <ShieldCheck size={16} />
              Safer group travel starts before the trip
            </p>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
              Find travel buddies who match the way you actually travel.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Create open trips, review join requests, and choose people based
              on real travel compatibility: budget, timing, food, pace,
              cleanliness, social energy, and comfort notes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={primaryLink}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                {isLoggedIn ? "Explore trips" : "Start your profile"}
                <ArrowRight size={17} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950"
              >
                See how it works
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["No payment flow", "Admin permission", "Chat after acceptance"].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    <CheckCircle2 size={17} className="text-emerald-600" />
                    {item}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-3 shadow-2xl shadow-slate-950/10">
            <div className="overflow-hidden rounded-[1.5rem] bg-white">
              <img
                src={manaliTripImage}
                alt="Travel buddies exploring mountains"
                className="h-72 w-full object-cover sm:h-96"
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-500">Open group</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">
                      Manali winter trek
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                    5 seats
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ["7", "Days"],
                    ["Rs 800-3000", "Per day"],
                    ["Balanced", "Pace"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-lg font-black text-slate-950">{value}</p>
                      <p className="text-xs font-bold text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-black text-slate-950">
                    Admin checks before accepting
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Budget flexible", "Early sleeper", "Vegetarian", "Direct communicator"].map(
                      (item) => (
                        <span
                          key={item}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                        >
                          {item}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">
              Normal sequence
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">
              A simple flow for people-first trips
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map(([title, copy], index) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">
              Why it feels different
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">
              The app focuses on compatibility, not booking.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Anyone can create a trip and anyone can request to join. The value
              is in helping admins choose people who will travel well together.
            </p>
            <Link
              to={primaryLink}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              {isLoggedIn ? "Go to trips" : "Create account"}
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {signals.map(([Icon, title, copy]) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-800 shadow-sm">
                  <Icon size={21} />
                </div>
                <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-start gap-3">
            <Compass className="mt-1 text-teal-300" size={22} />
            <div>
              <h2 className="text-xl font-black">Ready to find your group?</h2>
              <p className="mt-1 text-sm font-semibold text-slate-300">
                Complete your profile once, then use it for every trip request.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/trips"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
            >
              Browse trips
              <MessageCircle size={17} />
            </Link>
            {!isLoggedIn && (
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Login or register
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
