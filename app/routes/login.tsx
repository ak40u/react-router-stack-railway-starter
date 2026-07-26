import { Form, Link, data } from "react-router"

import { createUserSession, login } from "~/lib/auth.server"
import type { Route } from "./+types/login"

export function meta() {
  return [{ title: "Log in" }]
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData()
  const email = String(form.get("email") ?? "").trim().toLowerCase()
  const password = String(form.get("password") ?? "")

  const user = await login(email, password)
  if (!user) {
    // One message for both cases. Saying "no such account" would turn the login
    // form into a way to find out who has registered.
    return data({ error: "Email or password is wrong." }, { status: 400 })
  }

  return createUserSession(user.id, "/notes")
}

export default function Login({ actionData }: Route.ComponentProps) {
  return (
    <main>
      <h1>Log in</h1>
      <Form method="post">
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        {actionData?.error && <p className="error">{actionData.error}</p>}
        <button type="submit">Log in</button>
      </Form>
      <p className="muted">
        No account yet? <Link to="/join">Create one</Link>.
      </p>
    </main>
  )
}
