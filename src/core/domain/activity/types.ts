import { z } from "zod/v4";

export const activityIdSchema = z.uuid().brand("activityId");
export type ActivityId = z.infer<typeof activityIdSchema>;

export const activitySchema = z.object({
  id: activityIdSchema,
  type: z.enum(["okr_update", "review_created", "team_joined"]),
  message: z.string(),
  createdAt: z.date(),
});
export type Activity = z.infer<typeof activitySchema>;
