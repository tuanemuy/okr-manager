import { and, eq, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { ReviewRepository } from "@/core/domain/okr/ports/reviewRepository";
import type {
  CreateReviewParams,
  ListReviewQuery,
  OkrId,
  Review,
  ReviewId,
  ReviewWithReviewer,
  UpdateReviewParams,
} from "@/core/domain/okr/types";
import {
  reviewSchema,
  reviewWithReviewerSchema,
} from "@/core/domain/okr/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { reviews, users } from "./schema";

export class DrizzleSqliteReviewRepository implements ReviewRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateReviewParams,
  ): Promise<Result<Review, RepositoryError>> {
    try {
      const result = await this.db.insert(reviews).values(params).returning();

      const review = result[0];
      if (!review) {
        return err(new RepositoryError("Failed to create review"));
      }

      return validate(reviewSchema, review).mapErr((error) => {
        return new RepositoryError("Invalid review data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create review", error));
    }
  }

  async findById(
    id: ReviewId,
  ): Promise<Result<ReviewWithReviewer | null, RepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: reviews.id,
          okrId: reviews.okrId,
          type: reviews.type,
          content: reviews.content,
          reviewerId: reviews.reviewerId,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
          reviewer: {
            displayName: users.displayName,
            email: users.email,
          },
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.reviewerId, users.id))
        .where(eq(reviews.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const review = result[0];
      return validate(reviewWithReviewerSchema, review)
        .map((validReview) => validReview)
        .mapErr((error) => {
          return new RepositoryError("Invalid review data", error);
        });
    } catch (error) {
      return err(new RepositoryError("Failed to find review", error));
    }
  }

  async list(
    query: ListReviewQuery,
  ): Promise<
    Result<{ items: ReviewWithReviewer[]; count: number }, RepositoryError>
  > {
    const { pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.okrId ? eq(reviews.okrId, filter.okrId) : undefined,
      filter?.type ? eq(reviews.type, filter.type) : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select({
            id: reviews.id,
            okrId: reviews.okrId,
            type: reviews.type,
            content: reviews.content,
            reviewerId: reviews.reviewerId,
            createdAt: reviews.createdAt,
            updatedAt: reviews.updatedAt,
            reviewer: {
              displayName: users.displayName,
              email: users.email,
            },
          })
          .from(reviews)
          .innerJoin(users, eq(reviews.reviewerId, users.id))
          .where(and(...filters))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(reviews)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) =>
            validate(reviewWithReviewerSchema, item).unwrapOr(null),
          )
          .filter((item) => item !== null),
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list reviews", error));
    }
  }

  async update(
    id: ReviewId,
    params: UpdateReviewParams,
  ): Promise<Result<Review, RepositoryError>> {
    try {
      const result = await this.db
        .update(reviews)
        .set(params)
        .where(eq(reviews.id, id))
        .returning();

      const review = result[0];
      if (!review) {
        return err(new RepositoryError("Review not found"));
      }

      return validate(reviewSchema, review).mapErr((error) => {
        return new RepositoryError("Invalid review data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update review", error));
    }
  }

  async delete(id: ReviewId): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(reviews)
        .where(eq(reviews.id, id))
        .returning();

      if (result.length === 0) {
        return err(new RepositoryError("Review not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete review", error));
    }
  }

  async listByOkr(
    okrId: OkrId,
  ): Promise<Result<ReviewWithReviewer[], RepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: reviews.id,
          okrId: reviews.okrId,
          type: reviews.type,
          content: reviews.content,
          reviewerId: reviews.reviewerId,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
          reviewer: {
            displayName: users.displayName,
            email: users.email,
          },
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.reviewerId, users.id))
        .where(eq(reviews.okrId, okrId));

      return ok(
        result
          .map((item) =>
            validate(reviewWithReviewerSchema, item).unwrapOr(null),
          )
          .filter((item) => item !== null),
      );
    } catch (error) {
      return err(new RepositoryError("Failed to list reviews by OKR", error));
    }
  }
}
