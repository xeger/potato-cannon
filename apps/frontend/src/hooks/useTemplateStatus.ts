// src/hooks/useTemplateStatus.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface TemplateStatus {
  current: string | null;
  available: string | null;
  upgradeType: "major" | "minor" | "patch" | null;
}

export function useTemplateStatus(projectId: string | undefined) {
  return useQuery({
    queryKey: ["template-status", projectId],
    queryFn: async (): Promise<TemplateStatus> => {
      if (!projectId) {
        return { current: null, available: null, upgradeType: null };
      }
      return api.getTemplateStatus(projectId);
    },
    enabled: !!projectId,
    staleTime: 30000, // Check every 30 seconds
  });
}

export function useUpgradeTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, force }: { projectId: string; force?: boolean }) => {
      return api.upgradeTemplate(projectId, force);
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["template-status", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
