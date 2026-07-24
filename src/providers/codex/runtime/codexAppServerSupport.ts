import type { ProviderId } from '../../../core/providers/types';
import type ClaudianPlugin from '../../../main';
import { getEnhancedPath, parseEnvironmentVariables } from '../../../utils/env';
import { getVaultPath } from '../../../utils/path';
import type { InitializeResult } from './codexAppServerTypes';
import { buildCodexLaunchSpec } from './CodexLaunchSpecBuilder';
import type { CodexLaunchSpec } from './codexLaunchTypes';
import type { CodexRpcTransport } from './CodexRpcTransport';

const CODEX_APP_SERVER_CLIENT_INFO = Object.freeze({
  name: 'claudian',
  version: '1.0.0',
});

// Cold start of `codex app-server` (auth check, MCP server startup, first-run setup)
// can legitimately exceed the transport's 30s default. Give the handshake more room.
const CODEX_APP_SERVER_INITIALIZE_TIMEOUT_MS = 60_000;

export function getCodexAppServerWorkingDirectory(plugin: ClaudianPlugin): string {
  return getVaultPath(plugin.app) ?? process.cwd();
}

export function buildCodexAppServerEnvironment(
  plugin: ClaudianPlugin,
  providerId: ProviderId = 'codex',
): Record<string, string> {
  const customEnv = parseEnvironmentVariables(plugin.getActiveEnvironmentVariables(providerId));
  const baseEnv = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  const enhancedPath = getEnhancedPath(customEnv.PATH);

  return {
    ...baseEnv,
    ...customEnv,
    PATH: enhancedPath,
  };
}

export function resolveCodexAppServerLaunchSpec(
  plugin: ClaudianPlugin,
  providerId: ProviderId = 'codex',
): CodexLaunchSpec {
  return buildCodexLaunchSpec({
    settings: plugin.settings,
    resolvedCliCommand: plugin.getResolvedProviderCliPath(providerId),
    hostVaultPath: getCodexAppServerWorkingDirectory(plugin),
    env: buildCodexAppServerEnvironment(plugin, providerId),
  });
}

export async function initializeCodexAppServerTransport(
  transport: CodexRpcTransport,
  timeoutMs?: number,
): Promise<InitializeResult> {
  const result = await transport.request<InitializeResult>(
    'initialize',
    {
      clientInfo: CODEX_APP_SERVER_CLIENT_INFO,
      capabilities: { experimentalApi: true },
    },
    timeoutMs ?? CODEX_APP_SERVER_INITIALIZE_TIMEOUT_MS,
  );

  transport.notify('initialized');
  return result;
}
