import { api, getToken } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function notificationRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Notification request failed");
  }

  return data;
}

export async function fetchNotifications() {
  return notificationRequest("/notifications");
}

export async function markNotificationRead(notificationId) {
  return notificationRequest(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead() {
  return notificationRequest("/notifications/read-all", {
    method: "PATCH",
  });
}

export async function respondToJoinRequest(notification, action) {
  const tripId = notification.tripId?._id || notification.tripId;
  const senderId = notification.sender?._id || notification.sender;
  const memberId = notification.memberId;

  if (!tripId || !senderId) {
    throw new Error("Notification is missing trip or sender details");
  }

  if (memberId) {
    return action === "accept"
      ? api.acceptRequest(tripId, memberId)
      : api.rejectRequest(tripId, memberId);
  }

  // The notification stores sender + trip. The existing trip API needs memberId,
  // so the service resolves the matching pending request before accepting/rejecting.
  const data = await api.getPendingRequests(tripId);
  const request = (data.requests || []).find(
    (item) => item.userId?._id === senderId || item.userId === senderId
  );

  if (!request?._id) {
    throw new Error("This request was already handled");
  }

  if (action === "accept") {
    return api.acceptRequest(tripId, request._id);
  }

  return api.rejectRequest(tripId, request._id);
}
