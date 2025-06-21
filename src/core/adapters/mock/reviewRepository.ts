import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
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
import type { UserId } from "@/core/domain/user/types";
import { RepositoryError } from "@/lib/error";

export class MockReviewRepository implements ReviewRepository {
  private reviews: Map<ReviewId, Review> = new Map();
  private userProfiles: Map<UserId, { displayName: string; email: string }> =
    new Map();
  private shouldFailCreate = false;
  private shouldFailFindById = false;
  private shouldFailUpdate = false;
  private shouldFailDelete = false;
  private shouldFailList = false;
  private shouldFailListByOkr = false;
  private createErrorMessage = "Failed to create review";
  private findByIdErrorMessage = "Failed to find review by ID";
  private updateErrorMessage = "Failed to update review";
  private deleteErrorMessage = "Failed to delete review";
  private listErrorMessage = "Failed to list reviews";
  private listByOkrErrorMessage = "Failed to list reviews by OKR";

  async create(
    params: CreateReviewParams,
  ): Promise<Result<Review, RepositoryError>> {
    if (this.shouldFailCreate) {
      return err(new RepositoryError(this.createErrorMessage));
    }

    const id = uuidv7() as ReviewId;
    const review: Review = {
      id,
      okrId: params.okrId,
      type: params.type,
      content: params.content,
      reviewerId: params.reviewerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.reviews.set(id, review);
    return ok(review);
  }

  async findById(
    id: ReviewId,
  ): Promise<Result<ReviewWithReviewer | null, RepositoryError>> {
    if (this.shouldFailFindById) {
      return err(new RepositoryError(this.findByIdErrorMessage));
    }

    const review = this.reviews.get(id);
    if (!review) {
      return ok(null);
    }

    const reviewerProfile = this.userProfiles.get(review.reviewerId) || {
      displayName: `User ${review.reviewerId}`,
      email: `user${review.reviewerId}@example.com`,
    };

    const reviewWithReviewer: ReviewWithReviewer = {
      ...review,
      reviewer: reviewerProfile,
    };

    return ok(reviewWithReviewer);
  }

  async update(
    id: ReviewId,
    params: UpdateReviewParams,
  ): Promise<Result<Review, RepositoryError>> {
    if (this.shouldFailUpdate) {
      return err(new RepositoryError(this.updateErrorMessage));
    }

    const review = this.reviews.get(id);
    if (!review) {
      return err(new RepositoryError("Review not found"));
    }

    const updatedReview: Review = {
      ...review,
      ...params,
      updatedAt: new Date(),
    };

    this.reviews.set(id, updatedReview);
    return ok(updatedReview);
  }

  async delete(id: ReviewId): Promise<Result<void, RepositoryError>> {
    if (this.shouldFailDelete) {
      return err(new RepositoryError(this.deleteErrorMessage));
    }

    if (!this.reviews.has(id)) {
      return err(new RepositoryError("Review not found"));
    }

    this.reviews.delete(id);
    return ok(undefined);
  }

  async list(
    query: ListReviewQuery,
  ): Promise<
    Result<{ items: ReviewWithReviewer[]; count: number }, RepositoryError>
  > {
    if (this.shouldFailList) {
      return err(new RepositoryError(this.listErrorMessage));
    }

    const reviews = Array.from(this.reviews.values());

    // Apply filters
    let filteredReviews = reviews;
    if (query.filter?.okrId) {
      filteredReviews = filteredReviews.filter(
        (review) => review.okrId === query.filter?.okrId,
      );
    }
    if (query.filter?.type) {
      filteredReviews = filteredReviews.filter(
        (review) => review.type === query.filter?.type,
      );
    }
    if (query.filter?.reviewerId) {
      filteredReviews = filteredReviews.filter(
        (review) => review.reviewerId === query.filter?.reviewerId,
      );
    }

    // Convert to ReviewWithReviewer
    const reviewsWithReviewer: ReviewWithReviewer[] = filteredReviews.map(
      (review) => {
        const reviewerProfile = this.userProfiles.get(review.reviewerId) || {
          displayName: `User ${review.reviewerId}`,
          email: `user${review.reviewerId}@example.com`,
        };

        return {
          ...review,
          reviewer: reviewerProfile,
        };
      },
    );

    // Apply pagination
    const offset = (query.pagination.page - 1) * query.pagination.limit;
    const paginatedReviews = reviewsWithReviewer.slice(
      offset,
      offset + query.pagination.limit,
    );

    return ok({
      items: paginatedReviews,
      count: filteredReviews.length,
    });
  }

  async listByOkr(
    okrId: OkrId,
  ): Promise<Result<ReviewWithReviewer[], RepositoryError>> {
    if (this.shouldFailListByOkr) {
      return err(new RepositoryError(this.listByOkrErrorMessage));
    }

    const reviews = Array.from(this.reviews.values()).filter(
      (review) => review.okrId === okrId,
    );

    const reviewsWithReviewer: ReviewWithReviewer[] = reviews.map((review) => {
      const reviewerProfile = this.userProfiles.get(review.reviewerId) || {
        displayName: `User ${review.reviewerId}`,
        email: `user${review.reviewerId}@example.com`,
      };

      return {
        ...review,
        reviewer: reviewerProfile,
      };
    });

    return ok(reviewsWithReviewer);
  }

  // Helper methods for testing
  clear(): void {
    this.reviews.clear();
    this.userProfiles.clear();
    this.shouldFailCreate = false;
    this.shouldFailFindById = false;
    this.shouldFailUpdate = false;
    this.shouldFailDelete = false;
    this.shouldFailList = false;
    this.shouldFailListByOkr = false;
  }

  seed(reviews: Review[]): void {
    this.clear();
    for (const review of reviews) {
      this.reviews.set(review.id, review);
    }
  }

  setUserProfile(
    userId: UserId,
    profile: { displayName: string; email: string },
  ): void {
    this.userProfiles.set(userId, profile);
  }

  addReview(review: Review): void {
    this.reviews.set(review.id, review);
  }

  getByOkrId(okrId: OkrId): Review[] {
    return Array.from(this.reviews.values()).filter(
      (review) => review.okrId === okrId,
    );
  }

  setShouldFailCreate(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailCreate = shouldFail;
    if (errorMessage) {
      this.createErrorMessage = errorMessage;
    }
  }

  setShouldFailFindById(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailFindById = shouldFail;
    if (errorMessage) {
      this.findByIdErrorMessage = errorMessage;
    }
  }

  setShouldFailUpdate(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailUpdate = shouldFail;
    if (errorMessage) {
      this.updateErrorMessage = errorMessage;
    }
  }

  setShouldFailDelete(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailDelete = shouldFail;
    if (errorMessage) {
      this.deleteErrorMessage = errorMessage;
    }
  }

  setShouldFailList(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailList = shouldFail;
    if (errorMessage) {
      this.listErrorMessage = errorMessage;
    }
  }

  setShouldFailListByOkr(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailListByOkr = shouldFail;
    if (errorMessage) {
      this.listByOkrErrorMessage = errorMessage;
    }
  }
}
