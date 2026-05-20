const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
const TOKEN_KEY = "travelBuddyToken";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("travelBuddyUser", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("travelBuddyUser");
}

export function getStoredUser() {
  const rawUser = localStorage.getItem("travelBuddyUser");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  // Most APIs send JSON. Upload flows send FormData, and the browser must set
  // the multipart boundary itself, so we skip Content-Type for FormData.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

function toQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== "all" && value !== undefined && value !== null) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export const api = {
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getProfile: () => request("/users/profile"),

  updateProfile: (payload) =>
    request("/users/profile", {
      method: "PATCH",
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    }),

  getTrips: (params) => request(`/trips${toQueryString(params)}`),

  getTrip: (tripId) => request(`/trips/${tripId}`),

  createTrip: (payload) =>
    request("/trips", {
      method: "POST",
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    }),

  joinTrip: (tripId) =>
    request(`/trips/${tripId}/join`, {
      method: "POST",
    }),

  getPendingRequests: (tripId) => request(`/trips/${tripId}/requests`),

  acceptRequest: (tripId, memberId) =>
    request(`/trips/${tripId}/accept/${memberId}`, {
      method: "PATCH",
    }),

  rejectRequest: (tripId, memberId) =>
    request(`/trips/${tripId}/reject/${memberId}`, {
      method: "PATCH",
    }),

  deleteTrip: (tripId) =>
    request(`/trips/${tripId}`, {
      method: "DELETE",
    }),

  getMessages: (tripId) => request(`/messages/${tripId}`),

  markMessagesRead: (tripId) =>
    request(`/messages/read/${tripId}`, {
      method: "PATCH",
    }),

  getExpenses: (tripId) => request(`/expenses/${tripId}`),

  createExpense: (tripId, payload) =>
    request(`/expenses/${tripId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  settlePayment: (tripId, payload) =>
    request(`/expenses/${tripId}/settle`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
