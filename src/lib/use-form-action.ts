import { useState } from "react";
import { toast } from "sonner";

export function useFormAction() {
  const [isLoading, setIsLoading] = useState(false);

  const executeAction = async (action: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } catch {
      toast.error("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, executeAction };
}
