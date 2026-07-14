import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Invalid user or muted user
        if (!user || user.muted) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValid) {
          return null;
        }

        // ✅ Return valid user object ONLY
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],

  callbacks: {
    // 🔐 JWT callback
    async jwt({ token, user }) {
      // On login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: {
          sessionVersion: true,
          muted: true,
        },
      });

      // ❌ invalidate
      if (!dbUser || dbUser.muted) {
        token.invalid = true;
        return token;
      }

      if (dbUser.sessionVersion !== token.sessionVersion) {
        token.invalid = true;
        return token;
      }

      return token;
    },

    // 📦 Session callback
    async session({ session, token }) {
      // If token is missing, just return session safely
      if (!token || !token.id) {
        return session; // ✅ NOT null
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.sessionVersion = token.sessionVersion;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
