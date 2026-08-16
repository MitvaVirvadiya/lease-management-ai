import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { LeasesService } from "./leases.service";

@Controller()
export class LeasesController {
  constructor(@Inject(LeasesService) private readonly leases: LeasesService) {}

  @Get("health")
  async health() {
    let dbOk = false;
    try {
      const { client } = await import("../db/client");
      await client`select 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }
    return {
      ok: dbOk,
      db: dbOk,
      gemini: Boolean(process.env.GEMINI_API_KEY),
      service: "lease-os",
    };
  }

  @Get("api/stages")
  stages() {
    return this.leases.stages();
  }

  @Get("api/pipeline")
  pipeline() {
    return this.leases.pipeline();
  }

  @Get("api/dashboard")
  dashboard() {
    return this.leases.dashboard();
  }

  @Get("api/alerts")
  alerts() {
    return this.leases.alertList();
  }

  @Get("api/samples")
  samples() {
    return this.leases.samples();
  }

  @Post("api/samples/:slug/load")
  loadSample(@Param("slug") slug: string) {
    return this.leases.loadSample(slug);
  }

  @Get("api/leases")
  list() {
    return this.leases.list();
  }

  @Get("api/leases/:id")
  get(@Param("id") id: string) {
    return this.leases.get(id);
  }

  @Post("api/leases/upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 12 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: "Attach a PDF or text instrument as `file`." };
    }
    return this.leases.upload(file);
  }

  @Patch("api/leases/:id/fields")
  patchFields(
    @Param("id") id: string,
    @Body() body: { updates: { key: string; value: string | null }[] },
  ) {
    return this.leases.patchFields(id, body.updates ?? []);
  }

  @Post("api/leases/:id/commit")
  commit(@Param("id") id: string) {
    return this.leases.commit(id);
  }

  @Patch("api/leases/:id/stage")
  setStage(@Param("id") id: string, @Body() body: { stage: string }) {
    return this.leases.setStage(id, body.stage);
  }
}
