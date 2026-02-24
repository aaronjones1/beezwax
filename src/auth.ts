import NextAuth from "next-auth"
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraId({
      clientId: process.env.AUTH_MICROSOFTENTRA_ID,
      clientSecret: process.env.AUTH_MICROSOFTENTRA_SECRET,
      issuer: process.env.AUTH_MICROSOFTENTRA_ISSUER,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
      }
      return session
    },
  },
})
