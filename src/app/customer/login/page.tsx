import Link from "next/link";
import { AuthForm } from "@/components/forms/AuthForm";

export default function CustomerLoginPage() {
  return (
    <main className="container-app py-16">
      <AuthForm mode="login" role="customer" />
      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account? <Link className="text-pink-600" href="/customer/signup">Sign up</Link>
      </p>
    </main>
  );
}
