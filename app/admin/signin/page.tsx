import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

// Deliberately NOT under app/admin/(dashboard)/ — that route group's layout
// requires an existing session, which this page's entire job is to create.
// Putting it here instead of under app/admin/layout.tsx avoids a redirect
// loop (signin -> requires auth -> redirects to signin -> ...).
export default async function AdminSignInPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-xl font-semibold">Admin sign-in</h1>
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/admin" });
        }}
      >
        <button type="submit" className="btn-primary">
          Sign in with GitHub
        </button>
      </form>
    </main>
  );
}
