// =============================================================================
// Auth Feature — Type Definitions
// =============================================================================

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

/** Request body for POST /api/auth/forgot-password */
export interface ForgotPasswordRequestBody {
  email: string;
}

/** Request body for POST /api/auth/reset-password */
export interface ResetPasswordRequestBody {
  email: string;
  /** The 6-digit code from the reset email. */
  otp: string;
  newPassword: string;
  /** Alias accepted for robustness. */
  password?: string;
}

/** Request body for POST /api/auth/google */
export interface GoogleLoginRequestBody {
  credential: string; // Google ID token from frontend
}

/** User object returned in auth responses (excludes passwordHash) */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  image?: string | null;
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
  /** Snapshot of User.tokenVersion when issued — bumped on password reset. */
  tokenVersion?: number;
  type: "access";
}

/** JWT payload for refresh tokens */
export interface RefreshTokenPayload {
  userId: string;
  email: string;
  tokenVersion?: number;
  type: "refresh";
}
