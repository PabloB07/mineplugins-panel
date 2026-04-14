import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";
import { getSecuritySecret } from "./security";

const isProduction = process.env.NODE_ENV === "production";
const baseUrl = process.env.NEXTAUTH_URL || "https://mineplugins.vercel.app";

console.log("[Auth] Initializing with baseUrl:", baseUrl);
console.log("[Auth] Discord Client ID set:", !!process.env.DISCORD_CLIENT_ID);
console.log("[Auth] Discord Client Secret set:", !!process.env.DISCORD_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    }),
  ],
  secret: getSecuritySecret("NEXTAUTH_SECRET", {
    devFallback: "dev-nextauth-secret-change-me-now",
  }),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      console.log("[Auth] JWT callback", { trigger, accountProvider: account?.provider, hasUser: !!user });
      
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[Auth] Session callback", { hasToken: !!token, hasSession: !!session.user });
      
      if (!token.id) {
        console.error("[Auth] ERROR: token.id is missing!");
        return session;
      }
      
      if (session.user) {
        session.user.id = token.id;
        
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, image: true },
          });
          
          session.user.role = dbUser?.role || UserRole.CUSTOMER;
          if (dbUser?.image) {
            session.user.image = dbUser.image;
          }
          console.log("[Auth] User role set:", session.user.role);
        } catch (e) {
          console.error("[Auth] Error fetching user:", e);
          session.user.role = UserRole.CUSTOMER;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  useSecureCookies: isProduction,
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-session" : "session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role: UserRole;
  }
}