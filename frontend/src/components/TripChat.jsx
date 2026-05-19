import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api, getStoredUser, getToken, SOCKET_URL } from "../services/api";

function TripChat({ tripId, canChat }) {
  const user = getStoredUser();
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [status, setStatus] = useState({
    loading: true,
    sending: false,
    error: "",
    connected: false,
  });

  useEffect(() => {
    async function loadMessages() {
      if (!canChat) {
        setStatus((current) => ({ ...current, loading: false }));
        return;
      }

      try {
        const data = await api.getMessages(tripId);
        setMessages(data.messages || []);
        await api.markMessagesRead(tripId).catch(() => {});
        setStatus((current) => ({ ...current, loading: false }));
      } catch (error) {
        setStatus((current) => ({
          ...current,
          loading: false,
          error: error.message,
        }));
      }
    }

    loadMessages();
  }, [canChat, tripId]);

  useEffect(() => {
    if (!canChat) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token: getToken(),
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus((current) => ({ ...current, connected: true, error: "" }));
      socket.emit("join-trip", { tripId, userId: user?._id });
    });

    socket.on("connect_error", (error) => {
      setStatus((current) => ({
        ...current,
        connected: false,
        error: error.message,
      }));
    });

    socket.on("receive-message", (message) => {
      setMessages((current) => [...current, message]);
    });

    socket.on("trip-presence", (members) => {
      setOnlineMembers(Array.isArray(members) ? members : []);
    });

    socket.on("error-message", (message) => {
      setStatus((current) => ({ ...current, error: message }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [canChat, tripId, user?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event) {
    event.preventDefault();

    if (!messageText.trim() || !socketRef.current) {
      return;
    }

    setStatus((current) => ({ ...current, sending: true, error: "" }));

    socketRef.current.emit("send-message", {
      tripId,
      content: messageText.trim(),
      type: "text",
    });

    setMessageText("");
    setStatus((current) => ({ ...current, sending: false }));
  }

  if (!canChat) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Trip chat</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Chat unlocks after the admin accepts the join request. This is
          role-based rendering: admin and accepted members can chat.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">Trip chat</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {status.connected
              ? `${onlineMembers.length || 1} online`
              : "Connecting socket..."}
          </p>
          {onlineMembers.length > 0 && (
            <p className="mt-1 text-xs font-bold text-slate-400">
              {onlineMembers
                .map((member) =>
                  member._id === user?._id ? "You" : member.name || "Traveler"
                )
                .join(", ")}
            </p>
          )}
        </div>
        <span
          className={`h-3 w-3 rounded-full ${
            status.connected ? "bg-emerald-500" : "bg-amber-400"
          }`}
        />
      </div>

      {status.error && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {status.error}
        </p>
      )}

      <div className="mt-5 h-80 overflow-y-auto rounded-2xl bg-slate-50 p-4">
        {status.loading ? (
          <p className="text-sm font-semibold text-slate-500">
            Loading messages...
          </p>
        ) : messages.length ? (
          <div className="space-y-3">
            {messages.map((message) => {
              const senderId = message.sender?._id || message.sender;
              const isOwnMessage = senderId === user?._id;

              return (
                <div
                  key={message._id || `${message.createdAt}-${message.content}`}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                      isOwnMessage
                        ? "bg-slate-950 text-white"
                        : "bg-white text-slate-800 shadow-sm"
                    }`}
                  >
                    <p className="text-xs font-black opacity-70">
                      {isOwnMessage ? "You" : message.sender?.name || "Traveler"}
                    </p>
                    <p className="mt-1 text-sm leading-6">{message.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-500">
            No messages yet. Send the first one.
          </p>
        )}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-3">
        <input
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 focus:bg-white"
          placeholder="Type a message"
        />
        <button
          disabled={status.sending || !status.connected}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default TripChat;
