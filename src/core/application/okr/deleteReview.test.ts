import { beforeEach, describe, expect, it } from "vitest";
import { err, ok } from "neverthrow";
import { ApplicationError } from "@/lib/error";
import { RepositoryError } from "@/lib/error";
import { createMockContext } from "../testUtils";
import { deleteReview, type DeleteReviewInput } from "./deleteReview";
import type { Review } from "@/core/domain/okr/types";

describe("deleteReview", () => {
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe("正常系", () => {
    it("レビューの作成者が自分のレビューを削除できる", async () => {
      const mockReview: Review = {
        id: "review-123" as any,
        okrId: "okr-123" as any,
        reviewerId: "user-123" as any,
        period: {
          year: 2024,
          quarter: "Q1",
        },
        content: "レビュー内容",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.reviewRepository.findById.mockResolvedValue(ok(mockReview));
      mockContext.reviewRepository.delete.mockResolvedValue(ok(undefined));

      const input: DeleteReviewInput = {
        reviewId: "review-123" as any,
        userId: "user-123" as any,
      };

      const result = await deleteReview(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockContext.reviewRepository.findById).toHaveBeenCalledWith(
        "review-123",
      );
      expect(mockContext.reviewRepository.delete).toHaveBeenCalledWith(
        "review-123",
      );
    });

    it("異なるユーザーが作成したレビューを削除できる", async () => {
      const mockReview: Review = {
        id: "review-456" as any,
        okrId: "okr-456" as any,
        reviewerId: "user-456" as any,
        period: {
          year: 2024,
          quarter: "Q2",
        },
        content: "別のユーザーのレビュー",
        createdAt: new Date("2024-04-01T00:00:00Z"),
        updatedAt: new Date("2024-04-01T00:00:00Z"),
      };

      mockContext.reviewRepository.findById.mockResolvedValue(ok(mockReview));
      mockContext.reviewRepository.delete.mockResolvedValue(ok(undefined));

      const input: DeleteReviewInput = {
        reviewId: "review-456" as any,
        userId: "user-456" as any,
      };

      const result = await deleteReview(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockContext.reviewRepository.findById).toHaveBeenCalledWith(
        "review-456",
      );
      expect(mockContext.reviewRepository.delete).toHaveBeenCalledWith(
        "review-456",
      );
    });
  });

  describe("異常系", () => {
    it("無効なreviewIdでエラーが返される", async () => {
      const input = {
        reviewId: "invalid-review-id",
        userId: "user-123" as any,
      } as any;

      const result = await deleteReview(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }

      expect(mockContext.reviewRepository.findById).not.toHaveBeenCalled();
      expect(mockContext.reviewRepository.delete).not.toHaveBeenCalled();
    });

    it("無効なuserIdでエラーが返される", async () => {
      const input = {
        reviewId: "review-123" as any,
        userId: "invalid-user-id",
      } as any;

      const result = await deleteReview(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("存在しないレビューでエラーが返される", async () => {
      mockContext.reviewRepository.findById.mockResolvedValue(ok(null));

      const input: DeleteReviewInput = {
        reviewId: "nonexistent-review" as any,
        userId: "user-123" as any,
      };

      const result = await deleteReview(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Review not found");
      }

      expect(mockContext.reviewRepository.delete).not.toHaveBeenCalled();
    });

    it("レビューの作成者でないユーザーが削除しようとした場合エラーが返される", async () => {
      const mockReview: Review = {
        id: "review-123" as any,
        okrId: "okr-123" as any,
        reviewerId: "user-owner" as any,
        period: {
          year: 2024,
          quarter: "Q1",
        },
        content: "オーナーのレビュー",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.reviewRepository.findById.mockResolvedValue(ok(mockReview));

      const input: DeleteReviewInput = {
        reviewId: "review-123" as any,
        userId: "user-other" as any,
      };

      const result = await deleteReview(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe(
          "Unauthorized: You can only delete your own reviews",
        );
      }

      expect(mockContext.reviewRepository.delete).not.toHaveBeenCalled();
    });

    it("レビュー取得でリポジトリエラーが発生した場合エラーが返される", async () => {
      const repositoryError = new RepositoryError("Database connection failed");
      mockContext.reviewRepository.findById.mockResolvedValue(
        err(repositoryError),
      );

      const input: DeleteReviewInput = {
        reviewId: "review-123" as any,
        userId: "user-123" as any,
      };

      const result = await deleteReview(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to get review");
        expect(result.error.cause).toBe(repositoryError);
      }

      expect(mockContext.reviewRepository.delete).not.toHaveBeenCalled();
    });

    it("レビュー削除でリポジトリエラーが発生した場合エラーが返される", async () => {
      const mockReview: Review = {
        id: "review-123" as any,
        okrId: "okr-123" as any,
        reviewerId: "user-123" as any,
        period: {
          year: 2024,
          quarter: "Q1",
        },
        content: "レビュー内容",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      const repositoryError = new RepositoryError("Database connection failed");

      mockContext.reviewRepository.findById.mockResolvedValue(ok(mockReview));
      mockContext.reviewRepository.delete.mockResolvedValue(err(repositoryError));

      const input: DeleteReviewInput = {
        reviewId: "review-123" as any,
        userId: "user-123" as any,
      };

      const result = await deleteReview(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Failed to delete review");
        expect(result.error.cause).toBe(repositoryError);
      }
    });

    it("必須パラメータが不足している場合エラーが返される", async () => {
      const input = {
        reviewId: "review-123" as any,
        // userId missing
      } as any;

      const result = await deleteReview(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });

    it("空のオブジェクトが渡された場合エラーが返される", async () => {
      const input = {} as any;

      const result = await deleteReview(mockContext, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid input");
      }
    });
  });

  describe("境界値テスト", () => {
    it("UUID形式のIDで正常に動作する", async () => {
      const mockReview: Review = {
        id: "550e8400-e29b-41d4-a716-446655440000" as any,
        okrId: "550e8400-e29b-41d4-a716-446655440001" as any,
        reviewerId: "550e8400-e29b-41d4-a716-446655440002" as any,
        period: {
          year: 2024,
          quarter: "Q1",
        },
        content: "UUIDテストレビュー",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.reviewRepository.findById.mockResolvedValue(ok(mockReview));
      mockContext.reviewRepository.delete.mockResolvedValue(ok(undefined));

      const input: DeleteReviewInput = {
        reviewId: "550e8400-e29b-41d4-a716-446655440000" as any,
        userId: "550e8400-e29b-41d4-a716-446655440002" as any,
      };

      const result = await deleteReview(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      expect(mockContext.reviewRepository.findById).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
      );
      expect(mockContext.reviewRepository.delete).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
      );
    });

    it("異なるクォーターのレビューも正常に削除できる", async () => {
      const quarters = ["Q1", "Q2", "Q3", "Q4"] as const;

      for (const quarter of quarters) {
        const mockReview: Review = {
          id: `review-${quarter}` as any,
          okrId: "okr-123" as any,
          reviewerId: "user-123" as any,
          period: {
            year: 2024,
            quarter,
          },
          content: `${quarter}のレビュー`,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        };

        mockContext.reviewRepository.findById.mockResolvedValue(ok(mockReview));
        mockContext.reviewRepository.delete.mockResolvedValue(ok(undefined));

        const input: DeleteReviewInput = {
          reviewId: `review-${quarter}` as any,
          userId: "user-123" as any,
        };

        const result = await deleteReview(mockContext, input);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBeUndefined();
        }
      }
    });

    it("長いコンテンツのレビューも正常に削除できる", async () => {
      const longContent = "a".repeat(1000);
      const mockReview: Review = {
        id: "review-long" as any,
        okrId: "okr-123" as any,
        reviewerId: "user-123" as any,
        period: {
          year: 2024,
          quarter: "Q1",
        },
        content: longContent,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockContext.reviewRepository.findById.mockResolvedValue(ok(mockReview));
      mockContext.reviewRepository.delete.mockResolvedValue(ok(undefined));

      const input: DeleteReviewInput = {
        reviewId: "review-long" as any,
        userId: "user-123" as any,
      };

      const result = await deleteReview(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });

    it("異なる年のレビューも正常に削除できる", async () => {
      const mockReview: Review = {
        id: "review-2025" as any,
        okrId: "okr-123" as any,
        reviewerId: "user-123" as any,
        period: {
          year: 2025,
          quarter: "Q1",
        },
        content: "2025年のレビュー",
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-01-01T00:00:00Z"),
      };

      mockContext.reviewRepository.findById.mockResolvedValue(ok(mockReview));
      mockContext.reviewRepository.delete.mockResolvedValue(ok(undefined));

      const input: DeleteReviewInput = {
        reviewId: "review-2025" as any,
        userId: "user-123" as any,
      };

      const result = await deleteReview(mockContext, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });
  });
});