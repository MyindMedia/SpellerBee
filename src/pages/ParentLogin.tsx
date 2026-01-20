import { SignIn } from "@clerk/clerk-react";

export default function ParentLogin() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
      <SignIn redirectUrl="/parent/dashboard" />
    </div>
  );
}
