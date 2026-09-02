/** Request body for POST /api/auth/register */
export interface RegisterRequestBody {
    email: string;
    password: string;
    name: string;
    phone?: string;
}
/** Request body for POST /api/auth/login */
export interface LoginRequestBody {
    email: string;
    password: string;
}
/** Request body for POST /api/auth/refresh */
export interface RefreshRequestBody {
    refreshToken: string;
}
/** User object returned in auth responses (excludes passwordHash) */
export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
/** Standard auth response with tokens */
export interface AuthTokensResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
}
/** JWT payload for access tokens */
export interface AccessTokenPayload {
    userId: string;
    email: string;
    role: string;
    type: "access";
}
/** JWT payload for refresh tokens */
export interface RefreshTokenPayload {
    userId: string;
    email: string;
    type: "refresh";
}
//# sourceMappingURL=auth.types.d.ts.map