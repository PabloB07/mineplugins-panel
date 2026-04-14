import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";
import { getSecuritySecret } from "./security";

const isProduction = process.env.NODE_ENV === "production";

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
      // On initial sign in, user will have id
      if (user) {
        token.id = user.id;
      }
      // If we have an account but no token.id yet, try to get it from account
      if (!token.id && account) {
        // The sub from account should contain the user id
        token.id = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // Make sure we have a valid token id
      if (!token || !token.id) {
        console.error("[Auth] No token or token.id in session");
        return session;
      }
      
      if (session.user) {
        session.user.id = token.id as string;
        
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, image: true },
          });
          
          if (dbUser) {
            session.user.role = dbUser.role || UserRole.CUSTOMER;
            if (dbUser.image) {
              session.user.image = dbUser.image;
            }
          } else {
            session.user.role = UserRole.CUSTOMER;
          }
        } catch (e) {
          console.error("[Auth] Error:", e);
          session.user.role = UserRole.CUSTOMER;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  useSecureCookies: isProduction,
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