import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";
import { getSecuritySecret } from "./security";

const isProduction = process.env.NODE_ENV === "production";

const discordClientId = process.env.DISCORD_CLIENT_ID;
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;

console.log("[Auth] Discord Client ID configured:", !!discordClientId);
console.log("[Auth] Discord Client Secret configured:", !!discordClientSecret);
console.log("[Auth] NextAuth URL:", process.env.NEXTAUTH_URL);

if (!discordClientId || !discordClientSecret) {
  console.error("[Auth] ERROR: Discord credentials not configured!");
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    DiscordProvider({
      clientId: discordClientId || "missing",
      clientSecret: discordClientSecret || "missing",
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
      console.log("[Auth] JWT callback - provider:", account?.provider);
      
      if (account?.provider === "discord" && account?.access_token) {
        try {
          const response = await fetch("https://discord.com/api/users/@me", {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          });
          
          if (response.ok) {
            const discordUser = await response.json();
            console.log("[Auth] Discord user fetched:", discordUser.username);
            
            if (discordUser.avatar && (token.sub || user?.id)) {
              const targetUserId = token.sub || user?.id;
              const avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`;
              
              await prisma.user.update({
                where: { id: targetUserId },
                data: { image: avatarUrl },
              });
              
              token.picture = avatarUrl;
              console.log("[Auth] Avatar updated for user:", targetUserId);
            }
          }
        } catch (error) {
          console.error("[Auth] Discord avatar error:", error);
        }
      }
      
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[Auth] Session callback - user id:", token.id);
      
      if (session.user) {
        session.user.id = token.id as string;
        
        if (token.picture) {
          session.user.image = token.picture as string;
        }
        
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });
        
        session.user.role = dbUser?.role || UserRole.CUSTOMER;
        console.log("[Auth] User role:", session.user.role);
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
  debug: !isProduction,
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