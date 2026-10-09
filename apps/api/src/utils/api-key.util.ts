import crypto from "crypto";

export interface GeneratedApiKey {
    rawKey: string;
    keyHash: string;
    keyPreview: string;
}

export function generateApiKey(): GeneratedApiKey {
    const randomHex = crypto.randomBytes(24).toString("hex");
    const rawKey = `rg_live_${randomHex}`;
    const keyHash = hashApiKey(rawKey);
    const keyPreview = `rg_live_${randomHex.slice(0, 4)}••••••••${randomHex.slice(-4)}`;

    return {
        rawKey,
        keyHash,
        keyPreview,
    };
}

export function hashApiKey(rawKey: string): string {
    return crypto.createHash("sha256").update(rawKey.trim()).digest("hex");
}
