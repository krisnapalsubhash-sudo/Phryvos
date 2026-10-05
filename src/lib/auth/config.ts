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
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production-min-32-chars-long',
    trustHost: true,
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
          token.username = (user as any).username;
          token.demoMode = user.demoMode || false;
        }
        if (trigger === 'update' && session) {
          token.name = session.name;
          token.image = session.image;
          if (session.username) {
            token.username = session.username;
          }
        }
        return token;
      },
      async session({ session, token }: any) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.username = token.username as string;
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
              username: 'build_user',
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

          // Auto-provision or sign in demo user
          if (identifier === 'demo@phryvos.com' && credentials.password === 'demo123456') {
            let demoUser = await prisma.user.findFirst({
              where: { email: 'demo@phryvos.com' },
            });
            if (!demoUser) {
              const demoHash = await bcrypt.hash('demo123456', 10);
              demoUser = await prisma.user.create({
                data: {
                  username: 'demo_user',
                  email: 'demo@phryvos.com',
                  displayName: 'Demo User',
                  passwordHash: demoHash,
                  avatar: '⚡',
                  interests: ['Tech', 'Social'],
                  demoMode: true,
                },
              });
            }
            return {
              id: demoUser.id,
              email: demoUser.email,
              name: demoUser.displayName,
              username: demoUser.username,
              image: demoUser.avatar,
              demoMode: true,
            };
          }

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

          // Enforcement of ban and suspension policy
          if (user.isBanned) {
            throw new Error(user.banReason ? `Account is banned: ${user.banReason}` : 'Account is permanently banned');
          }

          if (user.isSuspended) {
            if (user.suspendedUntil && user.suspendedUntil > new Date()) {
              throw new Error(`Account suspended until ${user.suspendedUntil.toISOString()}`);
            } else if (!user.suspendedUntil) {
              throw new Error('Account is suspended');
            } else {
              // Expired suspension: automatically clear
              await prisma.user.update({
                where: { id: user.id },
                data: { isSuspended: false, suspendedUntil: null },
              });
            }
          }

          // Enforcement of Option A Email Verification Policy:
          // Unverified users are blocked from logging in with credentials until their email is confirmed.
          // Demo accounts or pre-verified OAuth accounts are exempt.
          if (!user.emailVerified && !user.demoMode) {
            throw new Error('EMAIL_NOT_VERIFIED: Please verify your email before logging in. Check your inbox for the verification link.');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            username: user.username,
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

export { handlers, auth, signIn, signOut };