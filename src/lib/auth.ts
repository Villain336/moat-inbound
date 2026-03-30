import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getUserByEmail, createUser, seedDefaultsForUser, upsertConnectedAccount } from '@/lib/db/queries';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        let user = await getUserByEmail(profile.email);

        if (!user) {
          user = await createUser({
            email: profile.email,
            name: profile.name ?? undefined,
            avatarUrl: (profile as Record<string, string>).picture ?? undefined,
          });
          await seedDefaultsForUser(user.id);
        }

        token.userId = user.id;
        token.plan = user.plan ?? 'free';

        if (account.access_token) {
          await upsertConnectedAccount({
            userId: user.id,
            provider: account.provider === 'google' ? 'gmail' : account.provider,
            providerAccountId: account.providerAccountId ?? profile.email,
            accessToken: account.access_token,
            refreshToken: account.refresh_token ?? undefined,
            tokenExpiry: account.expires_at
              ? new Date(account.expires_at * 1000)
              : undefined,
          });
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.userId;
        (session.user as Record<string, unknown>).plan = token.plan;
      }
      return session;
    },
  },
};
