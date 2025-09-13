import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth(enabled: boolean = true) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled, // Only fetch when enabled
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
