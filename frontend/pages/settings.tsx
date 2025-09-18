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
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-8 bg-slate-900 rounded-xl shadow-lg mt-12 text-green-100">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="mb-2"><strong>Username:</strong> {user.username}</div>
      <div className="mb-2"><strong>Email:</strong> {user.email}</div>
      <div className="mt-6 text-sm text-green-400">(Add more settings here as needed)</div>
    </div>
  );
}
