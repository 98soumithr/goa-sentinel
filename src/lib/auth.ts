import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./db";
import type { DbUser } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data: user, error } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("email", credentials.email as string)
          .eq("is_active", true)
          .single<DbUser>();

        if (error || !user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );
        if (!passwordMatch) return null;

        // Update last login
        await supabaseAdmin
          .from("users")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { role: string }).role = token.role as string;
        (session.user as unknown as { id: string }).id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
});
