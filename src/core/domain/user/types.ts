import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

export const userIdSchema = z.string().uuid().brand("userId");
export type UserId = z.infer<typeof userIdSchema>;

export const userSchema = z.object({
  id: userIdSchema,
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  hashedPassword: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof userSchema>;

export const createUserParamsSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  hashedPassword: z.string(),
});
export type CreateUserParams = z.infer<typeof createUserParamsSchema>;

export const updateUserParamsSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  hashedPassword: z.string().optional(),
});
export type UpdateUserParams = z.infer<typeof updateUserParamsSchema>;

export const userProfileSchema = z.object({
  id: userIdSchema,
  email: z.string().email(),
  displayName: z.string(),
  createdAt: z.date(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const changePasswordParamsSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});
export type ChangePasswordParams = z.infer<typeof changePasswordParamsSchema>;

export const listUserQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      email: z.string().email().optional(),
      displayName: z.string().optional(),
    })
    .optional(),
});
export type ListUserQuery = z.infer<typeof listUserQuerySchema>;
