import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { verifyGoogleIdToken } from "@/lib/google";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "pending",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "pending",
      // Izinkan login Google untuk email yang sudah terdaftar walau belum
      // punya baris Account tertaut (hasil daftar via form / daftar-google).
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Username / Password",
      credentials: {
        username: { label: "Username / Email", type: "text" },
        password: { label: "Password", type: "password" },
        googleIdToken: { label: "Google ID Token", type: "text" },
      },
      async authorize(credentials) {
        // 1) Google One Tap: login pakai ID token Google (email wajib terdaftar).
        const googleIdToken = credentials?.googleIdToken;
        if (googleIdToken) {
          const email = await verifyGoogleIdToken(googleIdToken);
          if (!email) return null;
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            username: user.username,
          };
        }

        // 2) Username/email + password.
        const identifier = (credentials?.username ?? "").trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!identifier || !password) return null;

        const user = await prisma.user.findFirst({
          where: { OR: [{ username: identifier }, { email: identifier }] },
        });
        if (!user || !user.passwordHash) return null;
        if (!verifyPassword(password, user.passwordHash)) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          username: user.username,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Google OAuth = LOGIN saja: email harus sudah terdaftar dulu.
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase();
        if (!email) return false;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) return "/login?error=EmailNotRegistered";
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id?: string; role?: string; username?: string | null };
        token.id = u.id;
        token.role = u.role ?? "USER";
        token.username = u.username ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
        session.user.username = (token.username as string | null) ?? null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const email = user.email?.toLowerCase();
      const data: { role?: string; username?: string } = {};
      if (email && ADMIN_EMAILS.includes(email)) data.role = "ADMIN";
      if (!user.username) {
        data.username = makeUsername(user.name ?? null, email ?? null);
      }
      if (Object.keys(data).length > 0) {
        await prisma.user.update({ where: { id: user.id }, data });
      }
    },
    async signIn({ user }) {
      // Catat aktivitas login: hitung jumlah login + waktu login terakhir.
      await prisma.user
        .update({
          where: { id: user.id },
          data: { loginCount: { increment: 1 }, lastLoginAt: new Date() },
        })
        .catch(() => {});
    },
  },
};

function makeUsername(name: string | null, email: string | null): string {
  const base = (name || email?.split("@")[0] || "user")
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "")
    .slice(0, 30);
  return base || "user";
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}
