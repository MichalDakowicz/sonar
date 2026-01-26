import { useAuth } from "../features/auth/AuthContext";
import { Disc } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { user, login } = useAuth();

  if (user) return <Navigate to="/" />;

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-950 text-neutral-200">
      <div className="mb-8 flex flex-col items-center gap-4">
        <Disc size={64} className="text-emerald-500 animate-spin" />
        <h1 className="text-4xl font-bold tracking-tight">Music Tracker</h1>
        <p className="text-neutral-500">Curate your physical & digital collection.</p>
      </div>
      
      <button
        onClick={login}
        className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-black transition-transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="h-4 w-4" />
        Sign in with Google
      </button>
    </div>
  );
}
