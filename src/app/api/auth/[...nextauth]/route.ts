import { context } from "@/context";

const authResult = context.authService.getHandlers();
export const { GET, POST } = authResult.handlers;
