import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("join", "routes/join.tsx"),
  route("logout", "routes/logout.tsx"),
  route("notes", "routes/notes.tsx"),
  route("healthz", "routes/healthz.ts"),
] satisfies RouteConfig
