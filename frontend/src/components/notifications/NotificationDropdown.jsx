import { Bell } from "lucide-react";
import NotificationItem from "./NotificationItem";

function NotificationSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex gap-3">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationDropdown({
  actionId,
  error,
  loading,
  notifications,
  onRespond,
}) {
  return (
    <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:w-96">
      <div className="border-b border-slate-100 bg-slate-950 px-5 py-4 text-white">
        <p className="text-sm font-black">Notifications</p>
        <p className="mt-1 text-xs font-semibold text-slate-300">
          Trip requests, expenses, and payments
        </p>
      </div>

      {error && (
        <p className="m-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <NotificationSkeleton />
      ) : notifications.length ? (
        <div className="max-h-[26rem] overflow-y-auto">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              actionId={actionId}
              onRespond={onRespond}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Bell size={22} />
          </div>
          <p className="mt-4 text-sm font-black text-slate-950">
            No new notifications
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Trip activity will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
