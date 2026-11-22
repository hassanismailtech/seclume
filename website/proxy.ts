// Retired pages must return 404 before the catch-all can stream a response.
export function proxy() {
  return new Response(null, { status: 404 });
}

export const config = { matcher: ["/press", "/company/careers"] };
