import { useCallback } from "react";
import { router } from "expo-router";

export function useBack(fallback: string): () => void {
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as any);
    }
  }, [fallback]);
}
