import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;

  if (token && ["/", "/auth", "/login", "/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!token && pathname.startsWith("/dashboard")) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/auth", "/login", "/signup", "/dashboard/:path*"],
};
