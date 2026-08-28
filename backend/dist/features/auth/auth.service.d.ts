import type { RegisterRequestBody, LoginRequestBody, AuthTokensResponse } from "./auth.types";
export declare function register(body: RegisterRequestBody): Promise<AuthTokensResponse>;
export declare function login(body: LoginRequestBody): Promise<AuthTokensResponse>;
/**
 * JUDGMENT CALL: Refresh token rotation is enabled.
 * When a refresh token is used, a NEW refresh token is issued.
 * This limits the window of exposure if a refresh token is stolen,
 * because the old token becomes invalid after first use.
 */
export declare function refreshToken(token: string): Promise<AuthTokensResponse>;
/**
 * JUDGMENT CALL: Logout is currently a client-side operation.
 * Since we don't store refresh tokens server-side (no revocation list/table),
 * we cannot truly invalidate tokens. The client should discard both tokens.
 *
 * FUTURE CONSIDERATION: For real server-side invalidation, implement one of:
 * 1. A token blacklist table (store revoked token JTIs with expiry)
 * 2. Store active refresh tokens in the DB per user (and delete on logout)
 * 3. Use short-lived access tokens + HttpOnly cookies for session management
 *
 * For now, this endpoint confirms the intent to logout and instructs the client.
 */
export declare function logout(): {
    message: string;
};
export declare class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
//# sourceMappingURL=auth.service.d.ts.map