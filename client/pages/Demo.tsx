import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DemoResponse } from "@shared/api";
import { useAuth } from "@/hooks/useAuth";

export default function Demo() {
  const [data, setData] = useState<DemoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    api<DemoResponse>("/api/demo")
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Demo</h1>

      <section className="rounded border p-4">
        <h2 className="font-medium">/api/demo</h2>
        {error && <p className="text-red-600">{error}</p>}
        {data ? <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre> : <p>Loading…</p>}
      </section>

      <section className="rounded border p-4">
        <h2 className="font-medium">Current User</h2>
        {loading ? (
          <p>Checking session…</p>
        ) : user ? (
          <div className="space-y-2">
            <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
            <button onClick={logout} className="px-3 py-1 rounded bg-white text-black">Logout</button>
          </div>
        ) : (
          <p>No session</p>
        )}
      </section>
    </div>
  );
}
