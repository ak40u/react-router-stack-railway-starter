import { defineConfig, env } from "prisma/config"

// Prisma 7 removed `url` from the datasource block. The CLI reads the connection
// string from here; the application gets its own through a driver adapter.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: env("DATABASE_URL") },
})
