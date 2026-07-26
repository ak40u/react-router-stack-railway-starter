import bcrypt from "bcryptjs"
import { createCookieSessionStorage, redirect } from "react-router"

import { prisma } from "./prisma.server"

const sessionSecret = process.env.SESSION_SECRET

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is not set - sessions would be forgeable")
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    // Cookies are only sent over HTTPS in production. Locally that would mean no
    // session at all, since dev runs on plain http.
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  },
})

export async function register(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return null

  // 12 rounds: slow enough that a leaked table is expensive to attack, fast
  // enough that a login does not feel broken.
  const passwordHash = await bcrypt.hash(password, 12)
  return prisma.user.create({ data: { email, passwordHash } })
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  // Hash against a throwaway value when the user does not exist, so a missing
  // account and a wrong password take the same amount of time to answer. The
  // difference is otherwise measurable, and it tells an attacker which emails
  // are registered.
  const hash = user?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin"
  const ok = await bcrypt.compare(password, hash)

  return user && ok ? user : null
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession()
  session.set("userId", userId)
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await storage.commitSession(session) },
  })
}

export async function getUser(request: Request) {
  const session = await storage.getSession(request.headers.get("Cookie"))
  const userId = session.get("userId")
  if (typeof userId !== "string") return null
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } })
}

export async function requireUser(request: Request) {
  const user = await getUser(request)
  if (!user) throw redirect("/login")
  return user
}

export async function logout(request: Request) {
  const session = await storage.getSession(request.headers.get("Cookie"))
  return redirect("/", {
    headers: { "Set-Cookie": await storage.destroySession(session) },
  })
}
