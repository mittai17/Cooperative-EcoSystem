import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/about',
  '/programmes(.*)',
  '/courses(.*)',
  '/jobs(.*)',
  '/verify-certificate(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/demo(.*)',
  '/api/v1/certificates/(.*)/verify',
  '/kiosk(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // If demo role cookie is set, allow access to all routes without auth.protect()
  const demoRole = req.cookies.get('coopsetu_demo_role')?.value;
  if (demoRole) {
    return;
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
