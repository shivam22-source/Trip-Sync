function getInitial(name = "T") {
  return name.trim().charAt(0).toUpperCase() || "T";
}

function getRelativeTime(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.floor(diffHours / 24)}d ago`;
}

function NotificationItem({ notification, actionId, onRespond }) {
  const senderName = notification.sender?.name || "Traveler";
  const tripTitle = notification.tripId?.title || "Trip";
  const isJoinRequest = notification.type === "join-request";
  const canRespond = isJoinRequest && notification.requestStatus === "pending";
  const isWorking = actionId === notification._id;

  return (
    <article className="group border-b border-slate-100 p-4 transition hover:bg-slate-50 last:border-b-0">
      <div className="flex gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-sm">
          {notification.sender?.profilePhoto ? (
            <img
              src={notification.sender.profilePhoto}
              alt={senderName}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            getInitial(senderName)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">
                {senderName}
              </p>
              <p className="truncate text-xs font-bold text-slate-500">
                {tripTitle}
              </p>
            </div>
            <span className="shrink-0 text-xs font-bold text-slate-400">
              {getRelativeTime(notification.createdAt)}
            </span>
          </div>

          <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">
            {notification.message}
          </p>

          {canRespond ? (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onRespond(notification, "accept")}
                disabled={isWorking}
                className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => onRespond(notification, "reject")}
                disabled={isWorking}
                className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-300 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          ) : isJoinRequest ? (
            <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black capitalize text-slate-500">
              {notification.requestStatus === "missing"
                ? "Request handled"
                : notification.requestStatus}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default NotificationItem;
