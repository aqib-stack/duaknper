import Link from "next/link";
import { AuthForm } from "@/components/forms/AuthForm";

export default function LoginPage() {
  return (
    <main className="container-app py-16">
      <AuthForm mode="login" />
      <p className="mt-5 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-pink-600 hover:text-pink-700">
          Create one here
        </Link>
      </p>
    </main>
  );
}
