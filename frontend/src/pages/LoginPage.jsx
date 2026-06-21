import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ORIGIN, api, setSession } from "../services/api";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    try {
      let payload = {
        email: form.email,
        password: form.password,
      };

      if (mode === "register") {
        payload = form;
      }

      let data;

      if (mode === "register") {
        data = await api.register(payload);
      } else {
        data = await api.login(payload);
      }

      setSession({ token: data.token, user: data.user });

      if (mode === "register") {
        // New users need profile data before matching and AI scoring work well.
        setStatus({
          loading: false,
          error: "",
          success: "Account created. Complete your profile to get better trip matches.",
        });
        return;
      }

      navigate("/trips");
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: "" });
    }
  }

  function getModeButtonClass(item) {
    let className =
      "rounded-full px-4 py-2 text-sm font-black capitalize transition";

    if (mode === item) {
      className += " bg-slate-950 text-white shadow-sm";
    } else {
      className += " text-slate-500";
    }

    return className;
  }

  function handleGoogleClick() {
    window.location.href = `${API_ORIGIN}/api/auth/google`;
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      {status.success && (
        // Small onboarding prompt after signup. Login users skip this.
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
            <p className="text-lg font-black text-slate-950">Account created</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Complete your profile to get better trip matches.
            </p>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-slate-800"
            >
              Go to profile
            </button>
          </div>
        </div>
      )}

      <section className="hidden lg:block">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">
          Safe trip access
        </p>
        <h1 className="mt-4 text-5xl font-black leading-tight text-slate-950">
          Sign in and start planning with your travel group.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
          Keep your trips, join requests, group chats, and expenses connected in
          one private space. Only accepted members can access the trip details.
        </p>
      </section>

      <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-8">
        <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1">
          {["login", "register"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setStatus({ loading: false, error: "", success: "" });
              }}
              className={getModeButtonClass(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleGoogleClick}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-black text-slate-800 transition hover:bg-slate-50"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full border border-slate-200 text-sm font-black text-blue-600">
            G
          </span>
          Continue with Google
        </button>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-black uppercase tracking-wide text-slate-400">
            or
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {mode === "register" && (
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Name</span>
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                placeholder="Shivam Kumar"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              required
              minLength={6}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
              placeholder="Minimum 6 characters"
            />
          </label>

          {status.error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {status.error}
            </p>
          )}

          <button
            disabled={status.loading}
            className="w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status.loading && "Please wait..."}
            {!status.loading && mode === "register" && "Create account"}
            {!status.loading && mode === "login" && "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
