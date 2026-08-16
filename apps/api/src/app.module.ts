import { Module } from "@nestjs/common";
import { ChatController } from "./chat/chat.controller";
import { ChatService } from "./chat/chat.service";
import { ExtractService } from "./extract/extract.service";
import { LeasesController } from "./leases/leases.controller";
import { LeasesService } from "./leases/leases.service";

@Module({
  controllers: [LeasesController, ChatController],
  providers: [LeasesService, ExtractService, ChatService],
})
export class AppModule {}
