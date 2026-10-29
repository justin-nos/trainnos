// Admins are Google accounts on the trainnos.com domain.
export const ADMIN_DOMAIN = "trainnos.com";

export function isAdminUser(user) {
  const email = user?.email?.toLowerCase() ?? "";
  return Boolean(user?.email_confirmed_at) && email.endsWith(`@${ADMIN_DOMAIN}`);
}

// Only same-site paths survive the OAuth round-trip (no open redirects).
export function safeNext(next, fallback = "/admins") {
  return typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
    ? next
    : fallback;
}
