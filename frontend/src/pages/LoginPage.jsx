import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setSession } from "../services/api";

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
      const payload =
        mode === "register"
          ? form
          : { email: form.email, password: form.password };

      const data =
        mode === "register" ? await api.register(payload) : await api.login(payload);

      setSession({ token: data.token, user: data.user });

      if (mode === "register") {
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

  return (
    <main className="mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
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
              className={`rounded-full px-4 py-2 text-sm font-black capitalize transition ${
                mode === item
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {item}
            </button>
          ))}
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

          {status.success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold leading-6 text-emerald-800">
                {status.success}
              </p>
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="mt-3 rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                Go to profile
              </button>
            </div>
          )}

          <button
            disabled={status.loading}
            className="w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status.loading
              ? "Please wait..."
              : mode === "register"
                ? "Create account"
                : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
