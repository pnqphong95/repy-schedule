import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function apiMiddleware(request: NextRequest) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new NextResponse(null, { status: 405 });
  }

  // Check for required headers
  const contentType = request.headers.get('content-type');
  if (contentType !== 'application/json') {
    return new NextResponse(null, { status: 415 });
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'");

  return response;
} 