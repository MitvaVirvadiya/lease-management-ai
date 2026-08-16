import "reflect-metadata";
import { config } from "dotenv";
import { resolve } from "path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

config({ path: resolve(__dirname, "../../../.env") });
config({ path: resolve(__dirname, "../../.env") });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origin = process.env.WEB_ORIGIN || "http://localhost:3015";
  app.enableCors({
    origin,
    credentials: true,
  });
  const port = Number(process.env.API_PORT || process.env.PORT || 4005);
  await app.listen(port);
  console.log(`Lease OS API on :${port} (CORS ${origin})`);
}

bootstrap();
