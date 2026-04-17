import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "discord" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (existingUser && user.image) {
          const cleanImage = user.image.split('?')[0];
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: user.name || existingUser.name,
              image: cleanImage,
            },
          });
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (user && session.user) {
        session.user.id = user.id;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, image: true, name: true },
        });

        session.user.role = dbUser?.role || "CUSTOMER";
        session.user.image = dbUser?.image || user.image;
        session.user.name = dbUser?.name || user.name;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});