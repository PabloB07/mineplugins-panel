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
  callbacks: {
    async jwt({ token, user }) {
      // Ensure user id is in token
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Copy user id to session
      if (token.id && session.user) {
        session.user.id = token.id as string;
        
        // Get user role from database
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
          console.error("Session error:", e);
          session.user.role = UserRole.CUSTOMER;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
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