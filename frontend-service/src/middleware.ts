import { NextResponse, type NextRequest } from "next/server";

// Protected routes requiring authentication
const protectedRoutes = ["/applications", "/customers", "/workflows", "/team"];

// Public routes (accessible only when NOT logged in)
const authRoutes = ["/login"];

// Role-restricted routes
const roleRestrictedRoutes: Record<string, string[]> = {
  "/workflows": ["admin"],
  "/team": ["admin", "manager"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const userCookie = request.cookies.get("user")?.value;

  const isAuthenticated = Boolean(token || refreshToken);

  // 1. Redirect unauthenticated users trying to access protected paths
  const isAccessingProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isAccessingProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect authenticated users away from /login
  const isAccessingAuth = authRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isAccessingAuth && isAuthenticated) {
    return NextResponse.redirect(new URL("/applications", request.url));
  }

  // 3. Role-based access control check
  for (const [route, allowedRoles] of Object.entries(roleRestrictedRoutes)) {
    if (pathname.startsWith(route) && isAuthenticated && userCookie) {
      try {
        const user = JSON.parse(userCookie);
        if (!allowedRoles.includes(user.role)) {
          return NextResponse.redirect(new URL("/applications", request.url));
        }
      } catch {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/applications/:path*",
    "/customers/:path*",
    "/workflows/:path*",
    "/team/:path*",
    "/login",
  ],
};
