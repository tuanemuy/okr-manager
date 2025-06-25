import { useState } from "react";
import { toast } from "sonner";

interface UseToastActionOptions {
  successMessage?: string;
  errorMessage?: string;
}

export function useToastAction(options: UseToastActionOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const executeAction = async <T>(
    action: () => Promise<T>,
    customOptions?: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    },
  ): Promise<T | null> => {
    setIsLoading(true);
    try {
      const result = await action();

      const successMsg =
        customOptions?.successMessage || options.successMessage;
      if (successMsg) {
        toast.success(successMsg);
      }

      customOptions?.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMsg =
        customOptions?.errorMessage ||
        options.errorMessage ||
        "エラーが発生しました。もう一度お試しください。";
      toast.error(errorMsg);

      customOptions?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, executeAction };
}
