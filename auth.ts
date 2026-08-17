import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// spec 5.7: "Single founder account. Use an established auth library or
// hosted provider (magic-link email or OAuth against an existing identity)
// rather than hand-rolling password handling." Auth.js + GitHub OAuth — no
// password storage of any kind exists in this codebase.
//
// JWT session strategy (Auth.js default when there's no database adapter
// configured) — no session table needed, matching this app's existing
// preference for the simpler option where either is defensible (see
// lib/session.ts's array-vs-join-table note in schema.prisma).
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    // The one-person allowlist: only this GitHub login may ever get a
    // session, regardless of who else might authorize the OAuth app.
    async signIn({ profile }) {
      const allowedLogin = process.env.ADMIN_GITHUB_LOGIN;
      return Boolean(allowedLogin) && profile?.login === allowedLogin;
    },
  },
  pages: {
    signIn: "/admin/signin",
  },
});
