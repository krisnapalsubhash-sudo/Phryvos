import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { getPrismaClient } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

function createAuthConfig() {
  const baseConfig = {
    pages: {
      signIn: '/login',
      error: '/login',
    },
    callbacks: {
      async jwt({ token, user, trigger, session }: any) {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.image = user.image;
          token.demoMode = user.demoMode || false;
        }
        if (trigger === 'update' && session) {
          token.name = session.name;
          token.image = session.image;
        }
        return token;
      },
      async session({ session, token }: any) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          session.user.name = token.name as string;
          session.user.image = token.image as string;
          session.user.demoMode = token.demoMode as boolean;
        }
        return session;
      },
    },
  };

  if (isBuildTime) {
    // Minimal config for build - no database, no real providers
    return {
      ...baseConfig,
      adapter: undefined,
      session: { strategy: 'jwt' as const },
      providers: [
        Credentials({
          name: 'credentials',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
          },
          authorize: async (credentials) => {
            return {
              id: 'build-mock-user',
              email: credentials?.email as string || 'build@test.com',
              name: 'Build User',
              image: '😊',
              demoMode: false,
            };
          },
        }),
      ],
    };
  }

  // Runtime config with full database and providers
  const { PrismaAdapter } = require('@auth/prisma-adapter');

  return {
    ...baseConfig,
    adapter: PrismaAdapter(getPrismaClient()),
    session: { strategy: 'jwt' as const },
    providers: [
      Credentials({
        name: 'credentials',
        credentials: {
          identifier: { label: 'Username or Email', type: 'text' },
          password: { label: 'Password', type: 'password' },
        },
        authorize: async (credentials) => {
          if (!credentials?.identifier || !credentials?.password) {
            throw new Error('Username/email and password required');
          }

          const prisma = getPrismaClient();
          const identifier = (credentials.identifier as string).trim().toLowerCase();

          // Find by email OR username
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: identifier },
                { username: identifier },
              ],
            },
          });

          if (!user || !user.passwordHash) {
            throw new Error('Invalid credentials');
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!isValid) {
            throw new Error('Invalid credentials');
          }

          // NOTE: email verification gate removed — verification emails not yet implemented.
          // Re-enable once email sending is configured.

          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            image: user.avatar,
            demoMode: user.demoMode,
          };
        },
      }),
      ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? [Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          })]
        : []),
      ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
        ? [GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          })]
        : []),
    ],
  };
}

const config = createAuthConfig();
const { handlers, auth, signIn, signOut } = NextAuth(config);

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string;
      demoMode?: boolean;
    };
  }
}

export { handlers, auth, signIn, signOut };