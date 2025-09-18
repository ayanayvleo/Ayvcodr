
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function SettingsPage() {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => router.push("/login"));
  }, [router]);

  if (!user) {
    return <div className="p-8 text-center text-green-100">Loading settings...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-lg p-8 bg-slate-900 rounded-2xl shadow-2xl border border-green-900/30">
        <h1 className="text-3xl font-bold text-green-100 mb-2">Settings</h1>
        <p className="text-green-400 mb-6">Manage your account, API keys, and privacy preferences.</p>
        <div className="bg-slate-800 rounded-xl p-6 mb-4 flex items-center gap-4">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-900 text-green-300 text-2xl font-bold">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-semibold text-green-100">{user.username}</div>
            <div className="text-green-400 text-sm">{user.email}</div>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-2">
            <span className="font-semibold text-green-200">Username:</span> <span className="text-green-100">{user.username}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-green-200">Email:</span> <span className="text-green-100">{user.email}</span>
          </div>
          <div className="mt-6 text-sm text-green-400">(Add more settings here as needed)</div>
        </div>
      </div>
    </div>
  );
}
