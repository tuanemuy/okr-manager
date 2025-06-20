import type { RepositoryError } from "@/lib/error";
import type { Result } from "neverthrow";
import type {
  CreateReviewParams,
  ListReviewQuery,
  OkrId,
  Review,
  ReviewId,
  ReviewWithReviewer,
  UpdateReviewParams,
} from "../types";

export interface ReviewRepository {
  create(params: CreateReviewParams): Promise<Result<Review, RepositoryError>>;
  findById(
    id: ReviewId,
  ): Promise<Result<ReviewWithReviewer | null, RepositoryError>>;
  update(
    id: ReviewId,
    params: UpdateReviewParams,
  ): Promise<Result<Review, RepositoryError>>;
  delete(id: ReviewId): Promise<Result<void, RepositoryError>>;
  list(
    query: ListReviewQuery,
  ): Promise<
    Result<{ items: ReviewWithReviewer[]; count: number }, RepositoryError>
  >;
  listByOkr(
    okrId: OkrId,
  ): Promise<Result<ReviewWithReviewer[], RepositoryError>>;
}
