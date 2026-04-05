import Link from "next/link";
import { AuthForm } from "@/components/forms/AuthForm";

export default function SignupPage() {
  return (
    <main className="container-app py-16">
      <AuthForm mode="signup" />
      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-pink-600 hover:text-pink-700">
          Login here
        </Link>
      </p>
    </main>
  );
}
