import { Form, Link, data } from "react-router"

import { createUserSession, register } from "~/lib/auth.server"
import type { Route } from "./+types/join"

export function meta() {
  return [{ title: "Create an account" }]
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData()
  const email = String(form.get("email") ?? "").trim().toLowerCase()
  const password = String(form.get("password") ?? "")

  if (!email.includes("@") || email.length > 254) {
    return data({ error: "That does not look like an email address." }, { status: 400 })
  }
  if (password.length < 8) {
    return data({ error: "Use at least 8 characters." }, { status: 400 })
  }

  const user = await register(email, password)
  if (!user) {
    return data({ error: "An account with that email already exists." }, { status: 400 })
  }

  return createUserSession(user.id, "/notes")
}

export default function Join({ actionData }: Route.ComponentProps) {
  return (
    <main>
      <h1>Create an account</h1>
      <Form method="post">
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="new-password" minLength={8} required />
        </label>
        {actionData?.error && <p className="error">{actionData.error}</p>}
        <button type="submit">Create account</button>
      </Form>
      <p className="muted">
        Already have one? <Link to="/login">Log in</Link>.
      </p>
    </main>
  )
}
