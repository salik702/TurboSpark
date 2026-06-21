import type { ProviderDriver } from '../driver-types.ts';
import { fetchQwenModelsViaSharedAcp } from '../../../turbospark-agent.ts';

export const qwenDriver: ProviderDriver = {
  provider: 'turbospark',
  buildRuntime: ({ resolvedPaths }) => ({
    paths: {
      qwenCli: resolvedPaths.turbosparkCliPath,
      node: resolvedPaths.nodeRuntimePath,
    },
  }),
  fetchModels: ({ hostRuntime, timeoutMs }) =>
    fetchQwenModelsViaSharedAcp({
      hostRuntime,
      timeoutMs,
    }),
  validateStoredConnection: async () => ({
    success: true,
    shouldRefreshModels: true,
  }),
  testConnection: async () => null,
};
