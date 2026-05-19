import { Link, NavLink, useNavigate } from "react-router-dom";
import NotificationBell from "./notifications/NotificationBell";
import { clearSession, getStoredUser, getToken } from "../services/api";

function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(getToken());
  const user = getStoredUser();

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  const linkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-slate-950 text-white shadow-sm"
        : "text-slate-600 hover:bg-white hover:text-slate-950"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-sm">
            TB
          </span>
          <div>
            <p className="text-base font-black leading-5 text-slate-950">
              Travel Buddy
            </p>
            <p className="hidden text-xs font-medium text-slate-500 sm:block">
              Find people. Plan better.
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-100 p-1 md:flex">
          <NavLink to="/" className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/trips" className={linkClass}>
            Trips
          </NavLink>
          {isLoggedIn && (
            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
                {user?.name || "Traveler"}
              </span>
              <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-slate-950 text-sm font-black text-white">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={user?.name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || "T"
                )}
              </span>
              <NotificationBell />
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-950 hover:text-slate-950"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      <div className="flex gap-2 overflow-x-auto border-t border-slate-200 px-4 py-2 md:hidden">
        <NavLink to="/" className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/trips" className={linkClass}>
          Trips
        </NavLink>
        {isLoggedIn && (
          <NavLink to="/profile" className={linkClass}>
            Profile
          </NavLink>
        )}
      </div>
    </header>
  );
}

export default Navbar;
