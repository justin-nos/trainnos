import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import {Account, Profile, User} from "next-auth";
import {GoogleProfile} from "next-auth/providers/google";
import {FirestoreAdapter} from "@auth/firebase-adapter";
import {getAuth, signInWithCustomToken} from "firebase/auth";

const authOptions = {
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
export const {handlers, signIn, signOut, auth} = NextAuth(authOptions);
