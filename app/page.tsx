import { redirect } from "next/navigation";

// Middleware normally redirects "/" to the role landing (or /login).
// This is a fallback so the root route never 404s.
export default function RootPage() {
  redirect("/login");
}
