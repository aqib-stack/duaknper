import Link from "next/link";
import { AuthForm } from "@/components/forms/AuthForm";

export default function CustomerSignupPage() {
  return (
    <main className="container-app py-16">
      <AuthForm mode="signup" role="customer" />
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account? <Link className="text-pink-600" href="/customer/login">Login</Link>
      </p>
    </main>
  );
}
