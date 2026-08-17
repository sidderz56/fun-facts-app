import { requireAdminSession } from "@/lib/adminAuth";
import { signOut } from "@/auth";

// The auth gate for every route in this group (spec 5.7: "not reachable by
// URL guess" — an unauthenticated request here redirects to /admin/signin
// rather than rendering anything). Layouts don't re-run on client-side
// navigation (Next's own caution), but this app has no client-side nav
// under /admin — every action is a full form POST — so that caveat doesn't
// apply here. Every Server Action in lib/adminActions.ts still re-checks
// independently as the real enforcement, per that same guidance.
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="mx-auto min-h-screen max-w-[900px] px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin dashboard</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/signin" });
          }}
        >
          <button type="submit" className="text-sm font-medium" style={{ color: "var(--home-link)" }}>
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
