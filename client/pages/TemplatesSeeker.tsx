import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export default function TemplatesSeeker() {
  const { user, logout, loading } = useAuth();
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold">Seeker Templates</h1>
        <p className="text-white/80">Welcome {user?.uid ? `(${user.uid})` : ""}. Starter templates for seekers will appear here.</p>

        <ul className="list-disc pl-6 space-y-2 text-white/90">
          <li>Define your learning goals</li>
          <li>Pick a recommended track</li>
          <li>Book a first session</li>
        </ul>

        <div className="flex gap-3">
          <Link to="/" className="px-4 py-2 rounded border">Home</Link>
          <button onClick={logout} disabled={loading} className="px-4 py-2 rounded bg-white text-black disabled:opacity-60">Logout</button>
        </div>
      </div>
    </div>
  );
}
