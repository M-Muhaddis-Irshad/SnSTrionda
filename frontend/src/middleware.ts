import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

const STOREFRONT_ROUTES = [
  "/",
  "/shop",
  "/products",
  "/account",
  "/checkout",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/returns",
  "/shipping",
  "/terms-and-conditions",
];
const ADMIN_ROUTES = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets, API routes, auth pages
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin/login")
  ) {
    return NextResponse.next();
  }

  // Check if route is admin
  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is storefront
  const isStorefrontRoute = STOREFRONT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Get token from cookies
  const token = request.cookies.get("authToken")?.value;

  if (!token) {
    // No token — logged out
    if (isAdminRoute) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // Token exists — decode and check role
  let userRole = null;
  try {
    const decoded = jwtDecode<{ role?: string }>(token);
    userRole = decoded.role || "CUSTOMER";
  } catch (err) {
    // Invalid token
    const response = NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
    response.cookies.delete("authToken");
    return response;
  }

  // ADMIN on storefront → redirect to /admin
  if (userRole === "ADMIN" && isStorefrontRoute) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // ADMIN on admin route → allow
  if (userRole === "ADMIN" && isAdminRoute) {
    return NextResponse.next();
  }

  // CUSTOMER on storefront → allow
  if (userRole === "CUSTOMER" && isStorefrontRoute) {
    return NextResponse.next();
  }

  // CUSTOMER on /admin → redirect to /
  if (userRole === "CUSTOMER" && isAdminRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};