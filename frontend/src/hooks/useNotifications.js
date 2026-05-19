import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  respondToJoinRequest,
} from "../services/notification.service";
import { getToken, SOCKET_URL } from "../services/api";

function useNotifications({ enabled = true } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  // Unread count is derived from the notification list, so badge state cannot
  // drift away from the actual data shown in the dropdown.
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const refreshNotifications = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      refreshNotifications();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [refreshNotifications]);

  useEffect(() => {
    if (!enabled || !getToken()) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token: getToken(),
      },
    });

    socket.on("notification:new", () => {
      refreshNotifications();
    });

    socket.on("connect_error", (socketError) => {
      setError(socketError.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled, refreshNotifications]);

  async function toggleDropdown() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);

    // Dropdown rendering is controlled here. When opened, we refresh first so
    // the user sees fresh data. Then unread notifications are marked as read.
    if (nextOpen) {
      await refreshNotifications();

      if (unreadCount > 0) {
        await markAllNotificationsRead();
        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            isRead: true,
          }))
        );
      }
    }
  }

  async function markRead(notificationId) {
    await markNotificationRead(notificationId);
    setNotifications((current) =>
      current.map((notification) =>
        notification._id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }

  async function handleJoinRequest(notification, action) {
    try {
      setActionId(notification._id);
      setError("");
      await respondToJoinRequest(notification, action);
      await markRead(notification._id);
      await refreshNotifications();
    } catch (requestError) {
      if (requestError.message === "This request was already handled") {
        await markRead(notification._id);
        await refreshNotifications();
      } else {
        setError(requestError.message);
      }
    } finally {
      setActionId("");
    }
  }

  // Future realtime socket integration can call refreshNotifications() when a
  // "notification:new" event arrives, without changing UI components.
  return {
    actionId,
    error,
    handleJoinRequest,
    isOpen,
    loading,
    notifications,
    refreshNotifications,
    toggleDropdown,
    unreadCount,
  };
}

export default useNotifications;
