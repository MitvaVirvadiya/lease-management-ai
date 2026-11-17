import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { pool } from "./db/pool.js";

const app = Fastify({ logger: true });
await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });

app.get("/health", async () => {
  await pool.query("select 1");
  return { ok: true };
});

// TODO(you): POST /documents (M1 step 6)

await app.listen({ port: Number(process.env.PORT ?? 3000), host: "0.0.0.0" });
