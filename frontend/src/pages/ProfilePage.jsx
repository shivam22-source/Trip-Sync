import { useEffect, useState } from "react";
import { api, getToken, setSession } from "../services/api";

const emptyForm = {
  name: "",
  profilePhoto: "",
  profilePhotoFile: null,
  bio: "",
  age: "",
  gender: "",
  city: "",
  occupation: "",
  languages: "",
  preferences: {
    vibe: "peaceful",
    budget: "medium",
    smoking: false,
    drinking: false,
  },
  travelProfile: {
    travelStyle: "",
    groupRole: "",
    pastTravel: "",
    currentLife: "",
    whyTravel: "",
    favoriteThings: "",
    boundaries: "",
  },
  compatibility: {
    spendingBehavior: "",
    expenseSplit: "",
    sleepSchedule: "",
    morningStyle: "",
    cleanliness: "",
    socialEnergy: "",
    foodPreference: "",
    activityPreference: "",
    travelPace: "",
    communicationStyle: "",
  },
};

function ProfilePage() {
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
      profilePhoto: user?.profilePhoto || "",
      profilePhotoFile: null,
      bio: user?.bio || "",
      age: user?.age || "",
      gender: user?.gender || "",
      city: user?.city || "",
      occupation: user?.occupation || "",
      languages: user?.languages || "",
      preferences: {
        vibe: user?.preferences?.vibe || "peaceful",
        budget: user?.preferences?.budget || "medium",
        smoking: Boolean(user?.preferences?.smoking),
        drinking: Boolean(user?.preferences?.drinking),
      },
      travelProfile: {
        travelStyle: user?.travelProfile?.travelStyle || "",
        groupRole: user?.travelProfile?.groupRole || "",
        pastTravel: user?.travelProfile?.pastTravel || "",
        currentLife: user?.travelProfile?.currentLife || "",
        whyTravel: user?.travelProfile?.whyTravel || "",
        favoriteThings: user?.travelProfile?.favoriteThings || "",
        boundaries: user?.travelProfile?.boundaries || "",
      },
      compatibility: {
        spendingBehavior: user?.compatibility?.spendingBehavior || "",
        expenseSplit: user?.compatibility?.expenseSplit || "",
        sleepSchedule: user?.compatibility?.sleepSchedule || "",
        morningStyle: user?.compatibility?.morningStyle || "",
        cleanliness: user?.compatibility?.cleanliness || "",
        socialEnergy: user?.compatibility?.socialEnergy || "",
        foodPreference: user?.compatibility?.foodPreference || "",
        activityPreference: user?.compatibility?.activityPreference || "",
        travelPace: user?.compatibility?.travelPace || "",
        communicationStyle: user?.compatibility?.communicationStyle || "",
      },
    });
  }

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.getProfile();
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
    const { files, name, type, value } = event.target;

    if (type === "file") {
      setForm((current) => ({
        ...current,
        profilePhotoFile: files?.[0] || null,
      }));
      return;
    }

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

  function updateTravelProfile(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      travelProfile: {
        ...current.travelProfile,
        [name]: value,
      },
    }));
  }

  function updateCompatibility(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      compatibility: {
        ...current.compatibility,
        [name]: value,
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
      // Profile updates can include an optional photo. Text fields are sent as
      // FormData strings, then backend parses nested JSON fields safely.
      const profileData = new FormData();
      profileData.append("name", form.name);
      profileData.append("bio", form.bio);
      profileData.append("age", form.age);
      profileData.append("gender", form.gender);
      profileData.append("city", form.city);
      profileData.append("occupation", form.occupation);
      profileData.append("languages", form.languages);
      profileData.append("preferences", JSON.stringify(form.preferences));
      profileData.append("travelProfile", JSON.stringify(form.travelProfile));
      profileData.append("compatibility", JSON.stringify(form.compatibility));

      if (form.profilePhotoFile) {
        profileData.append("profilePhoto", form.profilePhotoFile);
      }

      const data = await api.updateProfile(profileData);
      fillForm(data.user);
      setSession({ token: getToken(), user: data.user });
      setStatus((current) => ({
        ...current,
        saving: false,
        success: "Profile saved. Trip admins can now understand your travel fit better.",
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">
          Your travel identity
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">
          Help trip admins know who they are travelling with.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          A stronger profile makes it easier for admins to accept safe,
          genuine, compatible people into a group trip. Add honest details about
          your habits, comfort zone, and travel style.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Basic details</h2>
            <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-3xl bg-slate-950 text-2xl font-black text-white">
                {form.profilePhoto ? (
                  <img
                    src={form.profilePhoto}
                    alt={form.name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  form.name?.charAt(0)?.toUpperCase() || "T"
                )}
              </div>
              <label className="block min-w-0 flex-1">
                <span className="text-sm font-bold text-slate-700">
                  Profile picture
                </span>
                <input
                  name="profilePhoto"
                  type="file"
                  accept="image/*"
                  onChange={updateField}
                  className="mt-2 w-full text-sm font-semibold text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                />
                {form.profilePhotoFile && (
                  <p className="mt-2 truncate text-xs font-bold text-slate-500">
                    Selected: {form.profilePhotoFile.name}
                  </p>
                )}
              </label>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Age</span>
                <input
                  name="age"
                  type="number"
                  min="18"
                  value={form.age}
                  onChange={updateField}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Gender</span>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={updateField}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">City</span>
                <input
                  name="city"
                  value={form.city}
                  onChange={updateField}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                  placeholder="Delhi, Pune, Jaipur..."
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Work / study</span>
                <input
                  name="occupation"
                  value={form.occupation}
                  onChange={updateField}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                  placeholder="Student, developer, designer..."
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Languages</span>
                <input
                  name="languages"
                  value={form.languages}
                  onChange={updateField}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                  placeholder="Hindi, English, Marathi"
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-700">Short bio</span>
              <textarea
                name="bio"
                value={form.bio}
                onChange={updateField}
                rows="3"
                maxLength="240"
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                placeholder="A calm, honest intro about you as a travel buddy"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Travel fit questions</h2>
            <div className="mt-5 space-y-4">
              {[
                ["pastTravel", "Where have you travelled before?"],
                ["currentLife", "What are you currently up to?"],
                ["whyTravel", "Why do you want to travel with a group?"],
                ["favoriteThings", "What do you enjoy on trips?"],
                ["boundaries", "Any boundaries or comfort notes?"],
              ].map(([name, label]) => (
                <label key={name} className="block">
                  <span className="text-sm font-bold text-slate-700">{label}</span>
                  <textarea
                    name={name}
                    value={form.travelProfile[name]}
                    onChange={updateTravelProfile}
                    rows="3"
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Trip habits</h2>
            <div className="mt-5 space-y-4">
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
                <span className="text-sm font-bold text-slate-700">Travel style</span>
                <select
                  name="travelStyle"
                  value={form.travelProfile.travelStyle}
                  onChange={updateTravelProfile}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                >
                  <option value="">Select</option>
                  <option value="planner">Planner</option>
                  <option value="flexible">Flexible</option>
                  <option value="slow-travel">Slow travel</option>
                  <option value="social">Social</option>
                  <option value="quiet">Quiet</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Group role</span>
                <select
                  name="groupRole"
                  value={form.travelProfile.groupRole}
                  onChange={updateTravelProfile}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                >
                  <option value="">Select</option>
                  <option value="organizer">Organizer</option>
                  <option value="photographer">Photographer</option>
                  <option value="navigator">Navigator</option>
                  <option value="food-explorer">Food explorer</option>
                  <option value="easy-going">Easy-going</option>
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
              {[
                ["smoking", "I am comfortable with smoking"],
                ["drinking", "I am comfortable with drinking"],
              ].map(([name, label]) => (
                <label
                  key={name}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                >
                  <span className="text-sm font-bold text-slate-700">{label}</span>
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
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">
              Optional
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Travel compatibility
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              These answers help prevent common group-trip conflicts around
              money, timing, food, and personal habits.
            </p>
            <div className="mt-5 space-y-4">
              {[
                [
                  "spendingBehavior",
                  "Spending behavior",
                  [
                    ["", "Select"],
                    ["strict", "Budget strict"],
                    ["flexible", "Flexible"],
                    ["luxury", "Comfort/luxury"],
                  ],
                ],
                [
                  "expenseSplit",
                  "Expense expectation",
                  [
                    ["", "Select"],
                    ["equal", "Split equally"],
                    ["actual", "Pay actual share"],
                    ["flexible", "Flexible"],
                  ],
                ],
                [
                  "sleepSchedule",
                  "Sleep schedule",
                  [
                    ["", "Select"],
                    ["early", "Early sleeper"],
                    ["late-night", "Late night"],
                    ["flexible", "Flexible"],
                  ],
                ],
                [
                  "morningStyle",
                  "Morning style",
                  [
                    ["", "Select"],
                    ["relaxed", "Relaxed mornings"],
                    ["packed", "Packed schedule"],
                  ],
                ],
                [
                  "cleanliness",
                  "Cleanliness",
                  [
                    ["", "Select"],
                    ["organized", "Organized"],
                    ["chill", "Chill"],
                    ["messy", "Messy but respectful"],
                  ],
                ],
                [
                  "socialEnergy",
                  "Social energy",
                  [
                    ["", "Select"],
                    ["introvert", "Introvert"],
                    ["balanced", "Balanced"],
                    ["extrovert", "Extrovert"],
                  ],
                ],
                [
                  "foodPreference",
                  "Food preference",
                  [
                    ["", "Select"],
                    ["vegetarian", "Vegetarian"],
                    ["non-veg", "Non-veg"],
                    ["vegan", "Vegan"],
                    ["flexible", "Flexible"],
                    ["food-explorer", "Food explorer"],
                  ],
                ],
                [
                  "activityPreference",
                  "Activity preference",
                  [
                    ["", "Select"],
                    ["party", "Party"],
                    ["cafes", "Cafes"],
                    ["trekking", "Trekking"],
                    ["photography", "Photography"],
                    ["relaxation", "Relaxation"],
                    ["adventure", "Adventure"],
                  ],
                ],
                [
                  "travelPace",
                  "Travel pace",
                  [
                    ["", "Select"],
                    ["packed", "Packed itinerary"],
                    ["balanced", "Balanced"],
                    ["slow", "Slow and relaxed"],
                  ],
                ],
                [
                  "communicationStyle",
                  "Communication style",
                  [
                    ["", "Select"],
                    ["direct", "Direct"],
                    ["quiet", "Quiet"],
                    ["social", "Social"],
                    ["planner", "Planner"],
                  ],
                ],
              ].map(([name, label, options]) => (
                <label key={name} className="block">
                  <span className="text-sm font-bold text-slate-700">{label}</span>
                  <select
                    name={name}
                    value={form.compatibility[name]}
                    onChange={updateCompatibility}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950"
                  >
                    {options.map(([value, text]) => (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
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
            {status.saving ? "Saving..." : "Save travel profile"}
          </button>
        </aside>
      </form>
    </main>
  );
}

export default ProfilePage;
