import { Bell } from "lucide-react";
import useNotifications from "../../hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";

function NotificationBell() {
  const {
    actionId,
    error,
    handleJoinRequest,
    isOpen,
    loading,
    notifications,
    toggleDropdown,
    unreadCount,
  } = useNotifications();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 hover:text-slate-950"
        aria-label="Open notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-cyan-400 px-1 text-[11px] font-black text-slate-950 ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* The dropdown only mounts when open, keeping navbar render light. */}
      {isOpen && (
        <NotificationDropdown
          actionId={actionId}
          error={error}
          loading={loading}
          notifications={notifications}
          onRespond={handleJoinRequest}
        />
      )}
    </div>
  );
}

export default NotificationBell;
