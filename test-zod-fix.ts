// Test file to verify Zod schema imports work correctly
import { z } from "zod/v4";
import { teamIdSchema } from "./src/core/domain/team/types";
import { userIdSchema } from "./src/core/domain/user/types";

// Test schema creation
export const testSchema = z.object({
  teamId: teamIdSchema,
  userId: userIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
});

export type TestType = z.infer<typeof testSchema>;

console.log("Zod schema imports working correctly!");
