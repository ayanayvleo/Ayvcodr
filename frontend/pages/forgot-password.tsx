import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to request password reset");
      setMessage("Password reset link sent! (Demo: check response)");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-100 mb-4">Forgot Password</h1>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-slate-800 text-green-100 border border-green-900/30"
          required
        />
        <button type="submit" className="w-full bg-green-700 text-white py-2 rounded font-semibold">Request Reset</button>
        {message && <div className="mt-4 text-green-400">{message}</div>}
        {error && <div className="mt-4 text-red-400">{error}</div>}
      </form>
    </div>
  );
}
