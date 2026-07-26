import { Form, Link, redirect } from "react-router"

import { getUser } from "~/lib/auth.server"
import type { Route } from "./+types/home"

export function meta() {
  return [{ title: "React Router stack" }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request)
  if (user) throw redirect("/notes")
  return { user }
}

export default function Home() {
  return (
    <main>
      <h1>React Router stack</h1>
      <p className="muted">
        Accounts, sessions and per-user data on Postgres. Sign up and it works —
        there is nothing left to wire together.
      </p>
      <div className="row">
        <Link className="button" to="/join">
          Create an account
        </Link>
        <Link className="button ghost" to="/login">
          Log in
        </Link>
      </div>
    </main>
  )
}
