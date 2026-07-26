import { logout } from "~/lib/auth.server"
import type { Route } from "./+types/logout"

// Logging out is a POST, not a link. A GET would let any page on the internet
// sign the user out with an <img src="/logout">.
export async function action({ request }: Route.ActionArgs) {
  return logout(request)
}

export async function loader() {
  return Response.redirect("/", 302)
}
