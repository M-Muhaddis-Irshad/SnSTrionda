"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * JUDGMENT CALL: /admin/login now redirects to the unified /login page.
 * The unified login detects admin role and redirects to /admin.
 * This preserves backward compatibility if anyone has /admin/login bookmarked.
 */
export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="font-body text-sm text-muted">Redirecting to login...</p>
    </div>
  );
}
