import { context } from "@/context";

const handlers = context.authService.getHandlers() as {
  handlers: {
    GET: (req: Request) => Promise<Response>;
    POST: (req: Request) => Promise<Response>;
  };
};

export const { GET, POST } = handlers.handlers;
