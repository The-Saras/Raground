import { OAuth2Client } from "google-auth-library";
import { PrismaClient, User } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-this-in-production";

export class AuthService {
    async verifyGoogleToken(idToken: string): Promise<{ email: string; name?: string }> {
        try {
            // Support mock tokens in non-production environments
            if (process.env.NODE_ENV !== "production" && idToken.startsWith("mock_google_token_")) {
                const suffix = idToken.replace("mock_google_token_", "");
                const email = `${suffix || "user"}@example.com`;
                return {
                    email,
                    name: suffix ? `Mock User ${suffix}` : "Mock User",
                };
            }

            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw new Error("Invalid token payload: missing email");
            }
            return {
                email: payload.email,
                name: payload.name,
            };
        } catch (error: any) {
            console.error("Google token verification failed:", error);
            throw new Error(`Google authentication failed: ${error.message || "Unknown error"}`);
        }
    }

    async loginOrRegisterWithGoogle(idToken: string): Promise<{ token: string; user: User }> {
        const { email } = await this.verifyGoogleToken(idToken);

        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    passwordHash: null, // set to null since we are using Google sign-in
                },
            });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return { token, user };
    }
}
