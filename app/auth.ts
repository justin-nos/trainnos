import NextAuth, {getServerSession} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import {Account, Profile, User} from "next-auth";
import {GoogleProfile} from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({
      user,
      account,
      profile,
      email,
      credentials,
    }: {
      user: User;
      account: Account;
      profile?: Profile | null;
      email?: any;
      credentials?: any;
    }) {
      if (profile && "email_verified" in profile && "email" in profile) {
        const googleProfile = profile as GoogleProfile;
        return (
          googleProfile.email_verified &&
          googleProfile.email.endsWith("@trainnos.com")
        );
      }
      return false;
    },
  },
};
export const nextAuth = NextAuth(authOptions);
export const {handlers, signIn, signOut, auth} = nextAuth;

// Server-side check for admin-only API routes. The /admins pages are only
// guarded in the browser (CheckForAuth), so APIs must call this themselves.
export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  return session?.user?.email?.endsWith("@trainnos.com") ? session : null;
}
