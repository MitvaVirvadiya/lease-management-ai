import { config } from "dotenv";
import { resolve } from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

config({ path: resolve(__dirname, "../../../../.env") });
config({ path: resolve(__dirname, "../../.env") });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

// postgres.js honors sslmode in the URL. Do not branch on hostname.
export const client = postgres(url, { max: 10 });
export const db = drizzle(client, { schema });
