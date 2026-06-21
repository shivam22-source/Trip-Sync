import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setSession } from "../services/api";

function GoogleAuthSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const rawUser = searchParams.get("user");

    if (!token || !rawUser) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(rawUser);
      setSession({ token, user });
      navigate("/profile");
    } catch {
      navigate("/login");
    }
  }, [navigate, searchParams]);

  return (
    <main className="grid min-h-[calc(100vh-96px)] place-items-center px-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-black text-slate-950">Signing you in...</p>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Please wait while TripSync finishes Google login.
        </p>
      </div>
    </main>
  );
}

export default GoogleAuthSuccessPage;
