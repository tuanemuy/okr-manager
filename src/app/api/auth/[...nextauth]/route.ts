import { context } from "@/context";

const { handlers } = context.authService.getHandlers();
export const { GET, POST } = handlers;
