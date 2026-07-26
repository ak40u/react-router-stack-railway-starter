import { Form, data } from "react-router"

import { requireUser } from "~/lib/auth.server"
import { prisma } from "~/lib/prisma.server"
import type { Route } from "./+types/notes"

export function meta() {
  return [{ title: "Your notes" }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request)
  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return { user, notes }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request)
  const form = await request.formData()
  const intent = form.get("intent")

  if (intent === "delete") {
    const id = String(form.get("id") ?? "")
    // Scoped by userId as well as id. Without that, anyone could delete anyone
    // else's note by guessing an id - ownership has to be part of the query,
    // not a check the caller is trusted to have made.
    await prisma.note.deleteMany({ where: { id, userId: user.id } })
    return data({ ok: true })
  }

  const title = String(form.get("title") ?? "").trim()
  const body = String(form.get("body") ?? "").trim()

  if (!title || title.length > 120) {
    return data({ error: "A title is required, up to 120 characters." }, { status: 400 })
  }
  if (!body || body.length > 4000) {
    return data({ error: "A body is required, up to 4000 characters." }, { status: 400 })
  }

  await prisma.note.create({ data: { title, body, userId: user.id } })
  return data({ ok: true })
}

export default function Notes({ loaderData, actionData }: Route.ComponentProps) {
  const { user, notes } = loaderData

  return (
    <main>
      <header className="bar">
        <div>
          <h1>Your notes</h1>
          <p className="muted">Signed in as {user.email}</p>
        </div>
        <Form method="post" action="/logout">
          <button type="submit" className="ghost">
            Log out
          </button>
        </Form>
      </header>

      <Form method="post" key={notes.length}>
        <label>
          Title
          <input name="title" maxLength={120} required />
        </label>
        <label>
          Body
          <textarea name="body" maxLength={4000} required />
        </label>
        {actionData && "error" in actionData && <p className="error">{actionData.error}</p>}
        <button type="submit">Save note</button>
      </Form>

      {notes.length === 0 && <p className="muted line">Nothing yet.</p>}

      {notes.map((note) => (
        <article key={note.id}>
          <div className="bar">
            <h2>{note.title}</h2>
            <Form method="post">
              <input type="hidden" name="id" value={note.id} />
              <button type="submit" name="intent" value="delete" className="ghost small">
                Delete
              </button>
            </Form>
          </div>
          <p>{note.body}</p>
          <time dateTime={new Date(note.createdAt).toISOString()}>
            {new Date(note.createdAt).toLocaleString()}
          </time>
        </article>
      ))}
    </main>
  )
}
