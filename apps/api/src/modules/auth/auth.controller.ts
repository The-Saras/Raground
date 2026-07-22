import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { googleLoginSchema } from "./auth.validation";

const authService = new AuthService();

export class AuthController {
    async googleLogin(req: Request, res: Response) {
        const result = googleLoginSchema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({
                error: result.error.issues[0].message,
            });
            return;
        }

        try {
            const { idToken } = result.data;
            const { token, user } = await authService.loginOrRegisterWithGoogle(idToken);

            res.status(200).json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    createdAt: user.createdAt,
                },
            });
        } catch (error: any) {
            res.status(401).json({
                error: error.message || "Failed to sign in with Google",
            });
        }
    }
}
