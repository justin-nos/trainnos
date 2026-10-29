import Link from "next/link";

export const metadata = {title: "Not an admin account"};

export default function DeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg text-gray-800">
        That Google account isn&apos;t a NOS admin account. Sign in with your
        @trainnos.com account.
      </p>
      <Link
        href="/auth/login"
        prefetch={false}
        className="font-semibold text-indigo-600 hover:text-indigo-500"
      >
        Sign in again
      </Link>
    </div>
  );
}
