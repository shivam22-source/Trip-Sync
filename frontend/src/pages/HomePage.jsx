import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <div className="animate-rise">
          <p className="mb-4 inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">
            Find safe travel buddies
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-6xl">
            Join group trips with people you can actually trust.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Create a trip, review join requests, read real travel profiles, and
            accept people who match the group. No paid tour manager, no forced
            booking flow. Just travelers choosing the right people before they
            go together.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/trips"
              className="rounded-full bg-slate-950 px-6 py-3 text-center text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Explore trips
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-center text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-950"
            >
              Login or register
            </Link>
          </div>
        </div>

        <div className="animate-rise rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/10 [animation-delay:120ms]">
          <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-teal-200">Open trip</p>
                <h2 className="mt-1 text-2xl font-black">Manali winter trek</h2>
              </div>
              <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-emerald-950">
                OPEN
              </span>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["7", "Days"],
                ["6", "Max buddies"],
                ["Medium", "Budget"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-sm font-semibold text-slate-300">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-white p-4 text-slate-950">
              <p className="text-sm font-black">How it works</p>
              <div className="mt-4 space-y-3">
                {["Complete profile", "Explore trips", "Request to join", "Admin reviews fit"].map(
                  (item, index) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-100 text-sm font-black text-amber-800">
                        {index + 1}
                      </span>
                      <span className="font-bold text-slate-700">{item}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            ["Real profiles", "See travel style, comfort notes, languages, and group energy."],
            ["Admin permission", "Trip creators decide who can join before chat unlocks."],
            ["Group chat", "Accepted members can coordinate plans in the trip room."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default HomePage;
