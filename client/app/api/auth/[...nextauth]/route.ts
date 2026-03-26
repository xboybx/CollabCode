import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    adapter: MongoDBAdapter(clientPromise),
    session: { strategy: "jwt" },
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
            allowDangerousEmailAccountLinking: true,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_ID as string,
            clientSecret: process.env.GOOGLE_SECRET as string,
            allowDangerousEmailAccountLinking: true,
        }),
        CredentialsProvider({
            name: "Login",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "john@gmail.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing Credentials")
                }
                
                const client = await clientPromise;
                const db = client.db()
                const user = await db.collection("users").findOne({ email: credentials.email })

                if (!user || !user.password || !user.name) {
                    throw new Error("No user found with this email!")
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
                if (!isPasswordValid) {
                    throw new Error("Incorrect Password")
                }

                return { id: user._id.toString(), email: user.email, name: user.name };
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        }
    }
});

export { handler as GET, handler as POST };
