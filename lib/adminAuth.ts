import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Data Access Layer pattern (Next.js's own recommended shape for this):
// centralizes the "is this actually the founder" check so every admin page
// AND every write action re-verifies independently — a layout-only check
// isn't sufficient on its own since Server Actions can be invoked directly
// (spec 5.7's access-control requirement; Next's authentication guide is
// explicit that client-side/layout-only gating doesn't stop a Server Action
// from being called out of band).
export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/signin");
  }
  return session;
}
