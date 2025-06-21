import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";
import { teamIdSchema } from "../team/types";
import { userIdSchema } from "../user/types";

export const okrIdSchema = z.string().uuid().brand("okrId");
export type OkrId = z.infer<typeof okrIdSchema>;

export const keyResultIdSchema = z.string().uuid().brand("keyResultId");
export type KeyResultId = z.infer<typeof keyResultIdSchema>;

export const reviewIdSchema = z.string().uuid().brand("reviewId");
export type ReviewId = z.infer<typeof reviewIdSchema>;

export const okrTypeSchema = z.enum(["team", "personal"]);
export type OkrType = z.infer<typeof okrTypeSchema>;

export const quarterSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  quarter: z.number().int().min(1).max(4),
});
export type Quarter = z.infer<typeof quarterSchema>;

export const okrSchema = z.object({
  id: okrIdSchema,
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: okrTypeSchema,
  teamId: teamIdSchema,
  ownerId: userIdSchema.optional(),
  quarterYear: z.number().int().min(2020).max(2100),
  quarterQuarter: z.number().int().min(1).max(4),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Okr = z.infer<typeof okrSchema>;

export const createOkrParamsSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: okrTypeSchema,
  teamId: teamIdSchema,
  ownerId: userIdSchema.optional(),
  quarterYear: z.number().int().min(2020).max(2100),
  quarterQuarter: z.number().int().min(1).max(4),
});
export type CreateOkrParams = z.infer<typeof createOkrParamsSchema>;

export const updateOkrParamsSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
});
export type UpdateOkrParams = z.infer<typeof updateOkrParamsSchema>;

export const keyResultSchema = z.object({
  id: keyResultIdSchema,
  okrId: okrIdSchema,
  title: z.string().min(1).max(200),
  targetValue: z.number().min(0),
  currentValue: z.number().min(0).default(0),
  unit: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type KeyResult = z.infer<typeof keyResultSchema>;

export const createKeyResultParamsSchema = z.object({
  okrId: okrIdSchema,
  title: z.string().min(1).max(200),
  targetValue: z.number().min(0),
  currentValue: z.number().min(0).default(0),
  unit: z.string().optional(),
});
export type CreateKeyResultParams = z.infer<typeof createKeyResultParamsSchema>;

export const updateKeyResultParamsSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  targetValue: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().optional(),
});
export type UpdateKeyResultParams = z.infer<typeof updateKeyResultParamsSchema>;

export const reviewTypeSchema = z.enum(["progress", "final"]);
export type ReviewType = z.infer<typeof reviewTypeSchema>;

export const reviewSchema = z.object({
  id: reviewIdSchema,
  okrId: okrIdSchema,
  type: reviewTypeSchema,
  content: z.string().min(1),
  reviewerId: userIdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Review = z.infer<typeof reviewSchema>;

export const createReviewParamsSchema = z.object({
  okrId: okrIdSchema,
  type: reviewTypeSchema,
  content: z.string().min(1),
  reviewerId: userIdSchema,
});
export type CreateReviewParams = z.infer<typeof createReviewParamsSchema>;

export const updateReviewParamsSchema = z.object({
  content: z.string().min(1).optional(),
});
export type UpdateReviewParams = z.infer<typeof updateReviewParamsSchema>;

export const okrWithKeyResultsSchema = z.object({
  id: okrIdSchema,
  title: z.string(),
  description: z.string().optional(),
  type: okrTypeSchema,
  teamId: teamIdSchema,
  ownerId: userIdSchema.optional(),
  quarterYear: z.number().int().min(2020).max(2100),
  quarterQuarter: z.number().int().min(1).max(4),
  createdAt: z.date(),
  updatedAt: z.date(),
  keyResults: z.array(keyResultSchema),
  progress: z.number().min(0).max(100).optional(),
  owner: z
    .object({
      displayName: z.string(),
      email: z.string().email(),
    })
    .optional(),
});
export type OkrWithKeyResults = z.infer<typeof okrWithKeyResultsSchema>;

export const reviewWithReviewerSchema = z.object({
  id: reviewIdSchema,
  okrId: okrIdSchema,
  type: reviewTypeSchema,
  content: z.string(),
  reviewerId: userIdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  reviewer: z.object({
    displayName: z.string(),
    email: z.string().email(),
  }),
});
export type ReviewWithReviewer = z.infer<typeof reviewWithReviewerSchema>;

export const listOkrQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      teamId: teamIdSchema.optional(),
      ownerId: userIdSchema.optional(),
      type: okrTypeSchema.optional(),
      year: z.number().int().min(2020).max(2100).optional(),
      quarter: z.number().int().min(1).max(4).optional(),
      title: z.string().optional(),
    })
    .optional(),
});
export type ListOkrQuery = z.infer<typeof listOkrQuerySchema>;

export const listKeyResultQuerySchema = z.object({
  pagination: paginationSchema,
  okrId: okrIdSchema,
});
export type ListKeyResultQuery = z.infer<typeof listKeyResultQuerySchema>;

export const listReviewQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      okrId: okrIdSchema.optional(),
      type: reviewTypeSchema.optional(),
      reviewerId: userIdSchema.optional(),
    })
    .optional(),
});
export type ListReviewQuery = z.infer<typeof listReviewQuerySchema>;
