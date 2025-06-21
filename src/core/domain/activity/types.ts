import { z } from "zod/v4";
import { userIdSchema } from "../user/types";

export const activityIdSchema = z.uuid().brand("activityId");
export type ActivityId = z.infer<typeof activityIdSchema>;

export const activitySchema = z.object({
  id: activityIdSchema,
  userId: userIdSchema,
  type: z.enum(["okr_update", "review_created", "team_joined"]),
  message: z.string(),
  createdAt: z.date(),
});
export type Activity = z.infer<typeof activitySchema>;
