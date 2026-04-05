"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  mode: "login" | "signup";
  role?: "seller" | "customer";
};

export function AuthForm({ mode, role = "seller" }: Props) {
  const router = useRouter();
  const { login, signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "signup") {
        await signup(name, email, password, role);
        router.push(role === "seller" ? "/app/dashboard" : "/account");
      } else {
        const resolvedRole = await login(email, password);
        router.push(resolvedRole === "super_admin" ? "/admin" : resolvedRole === "customer" ? "/account" : "/app/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === "signup"
    ? role === "seller" ? "Create your seller account" : "Create your customer account"
    : role === "seller" ? "Welcome back, seller" : "Welcome back";

  const subtitle = mode === "signup"
    ? role === "seller"
      ? "Start your free trial and create your online store."
      : "Create an account to track orders and view your order history."
    : role === "seller"
      ? "Login to manage your store dashboard."
      : "Login to track orders and see past purchases.";

  return (
    <form onSubmit={handleSubmit} className="card mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>

      <div className="mt-6 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maynor Larrieu"
              required
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={role === "seller" ? "seller@example.com" : "customer@example.com"}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            minLength={6}
            required
          />
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full">
        {submitting ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
      </button>
    </form>
  );
}
