import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { ChatService } from "./chat.service";

@Controller("api/chat")
export class ChatController {
  constructor(@Inject(ChatService) private readonly chat: ChatService) {}

  @Get("threads")
  threads() {
    return this.chat.listThreads();
  }

  @Get("threads/:id")
  thread(@Param("id") id: string) {
    return this.chat.getThread(id);
  }

  @Post()
  ask(@Body() body: { message: string; threadId?: string }) {
    return this.chat.ask(body.message, body.threadId);
  }
}
