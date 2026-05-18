import { useEffect, useState } from "react";
import { api, getStoredUser, getToken, setSession } from "../services/api";

const emptyForm = {
  name: "",
  bio: "",
  preferences: {
    vibe: "peaceful",
    budget: "medium",
    smoking: false,
    drinking: false,
  },
};

function ProfilePage() {
  const [profile, setProfile] = useState(getStoredUser());
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({
    loading: true,
    saving: false,
    error: "",
    success: "",
  });

  function fillForm(user) {
    setForm({
      name: user?.name || "",
      bio: user?.bio || "",
      preferences: {
        vibe: user?.preferences?.vibe || "peaceful",
        budget: user?.preferences?.budget || "medium",
        smoking: Boolean(user?.preferences?.smoking),
        drinking: Boolean(user?.preferences?.drinking),
      },
    });
  }

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.getProfile();
        setProfile(data.user);
        fillForm(data.user);
        setSession({ token: getToken(), user: data.user });
        setStatus((current) => ({ ...current, loading: false }));
      } catch (error) {
        setStatus((current) => ({
          ...current,
          loading: false,
          error: error.message,
        }));
      }
    }

    fetchProfile();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updatePreference(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus((current) => ({
      ...current,
      saving: true,
      error: "",
      success: "",
    }));

    try {
      const data = await api.updateProfile(form);
      setProfile(data.user);
      fillForm(data.user);
      setSession({ token: getToken(), user: data.user });
      setStatus((current) => ({
        ...current,
        saving: false,
        success: "Profile updated successfully.",
      }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        saving: false,
        error: error.message,
      }));
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-8 text-white">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-200">
            Protected profile
          </p>
          <h1 className="mt-3 text-4xl font-black">
            {profile?.name || "Traveler"}
          </h1>
          <p className="mt-2 font-semibold text-slate-300">
            {profile?.email || "Loading email..."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-950">Edit account</h2>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Name</span>
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Bio</span>
              <textarea
                name="bio"
                value={form.bio}
                onChange={updateField}
                rows="5"
                maxLength="240"
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                placeholder="Short intro for future travel buddies"
              />
            </label>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-950">Travel preferences</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Vibe</span>
                <select
                  name="vibe"
                  value={form.preferences.vibe}
                  onChange={updatePreference}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                >
                  <option value="peaceful">Peaceful</option>
                  <option value="party">Party</option>
                  <option value="adventure">Adventure</option>
                  <option value="luxury">Luxury</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Budget</span>
                <select
                  name="budget"
                  value={form.preferences.budget}
                  onChange={updatePreference}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["smoking", "Smoking allowed"],
                ["drinking", "Drinking allowed"],
              ].map(([name, label]) => (
                <label
                  key={name}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <span className="font-bold text-slate-700">{label}</span>
                  <input
                    name={name}
                    type="checkbox"
                    checked={form.preferences[name]}
                    onChange={updatePreference}
                    className="h-5 w-5 accent-slate-950"
                  />
                </label>
              ))}
            </div>

            {status.error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                {status.error}
              </p>
            )}
            {status.success && (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                {status.success}
              </p>
            )}

            <button
              disabled={status.loading || status.saving}
              className="w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
            >
              {status.saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default ProfilePage;
