import { randomBytes } from "node:crypto"

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

// A real hash of a value nobody knows, computed once at startup. When the email
// does not exist, the password is compared against this instead of returning
// early - so both answers cost the same. It has to be a genuine hash: bcrypt
// rejects a malformed one immediately, in well under a millisecond against the
// ~200ms of real work, and that gap is enough to tell an attacker which emails
// are registered.
const ABSENT_USER_HASH = bcrypt.hashSync(randomBytes(32).toString("hex"), 12)

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  const ok = await bcrypt.compare(password, user?.passwordHash ?? ABSENT_USER_HASH)

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
