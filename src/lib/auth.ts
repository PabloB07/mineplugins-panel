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
      authorization: {
        params: {
          scope: "identify email",
        },
      },
    }),
  ],
  secret: getSecuritySecret("NEXTAUTH_SECRET", {
    devFallback: "dev-nextauth-secret-change-me-now",
  }),
  callbacks: {
    async jwt({ token, user, account }) {
      // Set user id on first sign in
      if (user?.id && !token.id) {
        token.id = user.id;
      }
      
      // Update Discord avatar on sign in
      if (account?.provider === "discord" && account?.access_token && token.id) {
        try {
          const response = await fetch("https://discord.com/api/users/@me", {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          });
          
          if (response.ok) {
            const discordUser = await response.json();
            
            if (discordUser.avatar) {
              const avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`;
              
              await prisma.user.update({
                where: { id: token.id },
                data: { image: avatarUrl },
              });
              
              token.picture = avatarUrl;
            }
          }
        } catch (error) {
          console.error("[Auth] Discord avatar error:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Ensure token has id
      if (!token.id) {
        console.error("[Auth] ERROR: No token.id in session callback");
        return session;
      }
      
      if (session.user) {
        session.user.id = token.id;
        
        if (token.picture) {
          session.user.image = token.picture as string;
        }
        
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          
          session.user.role = dbUser?.role || UserRole.CUSTOMER;
        } catch (error) {
          console.error("[Auth] Session error:", error);
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