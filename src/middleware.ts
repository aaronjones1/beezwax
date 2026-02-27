import { auth } from "@/auth"

const publicPaths = new Set(["/login"])

export default auth((request) => {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return
  }

  if (publicPaths.has(pathname)) {
    return
  }

  if (!request.auth) {
    const loginUrl = new URL("/login", request.url)
    const callbackUrl = `${pathname}${request.nextUrl.search}`
    loginUrl.searchParams.set("callbackUrl", callbackUrl)
    return Response.redirect(loginUrl)
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
