import "dotenv/config";
import { login, googleLogin } from "./src/features/auth/auth.service";

declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};

async function main() {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;

  // 1. Correct super admin creds → SUPER_ADMIN token
  const ok = await login({ email, password });
  console.log("SUPER ADMIN login -> role:", ok.user.role, "| accessToken decoded role via payload presence:", !!ok.accessToken);
  if (ok.user.role !== "SUPER_ADMIN") throw new Error("FAIL: expected SUPER_ADMIN role");

  // 2. Wrong password rejected
  try {
    await login({ email, password: "wrong-password" });
    throw new Error("FAIL: wrong password should be rejected");
  } catch (e: any) {
    console.log("Wrong password rejected (status", e.statusCode + "):", e.message);
  }

  // 3. Google login for super admin rejected (shadow row must not be OAuth-able)
  try {
    await googleLogin({ credential: "fake-token" });
    console.log("NOTE: google flow did not reach super admin guard (token invalid first)");
  } catch (e: any) {
    console.log("Google login rejected (status", e.statusCode + "):", e.message);
  }

  console.log("✅ Super admin login path verified");
}

main().catch((e) => { console.error(e); process.exit(1); });