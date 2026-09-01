import type { PreparedChatTurn } from '@/core/runtime/types';
import type { StreamChunk } from '@/core/types';
import { CodeBuddyChatRuntime } from '@/providers/codebuddy/runtime/CodeBuddyChatRuntime';

function createMockPlugin(settings: Record<string, unknown> = {}): any {
  return {
    settings,
    manifest: { version: '0.0.0-test' },
    getResolvedProviderCliPath: jest.fn().mockReturnValue('/usr/local/bin/codebuddy'),
    app: {
      vault: {
        adapter: {
          basePath: '/tmp/claudian-test-vault',
        },
      },
    },
  };
}

function createTurn(text = 'hello'): PreparedChatTurn {
  return {
    isCompact: false,
    mcpMentions: new Set(),
    persistedContent: text,
    prompt: text,
    request: { text },
  };
}

async function collectChunks(stream: AsyncGenerator<StreamChunk>): Promise<StreamChunk[]> {
  const chunks: StreamChunk[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return chunks;
}

function createRuntimeWithPromptResponse(response: Record<string, unknown>): CodeBuddyChatRuntime {
  const runtime = new CodeBuddyChatRuntime(createMockPlugin());
  runtime.syncConversationState({ providerState: {}, sessionId: 'session-1' });
  jest.spyOn(runtime, 'ensureReady').mockResolvedValue(true);
  (runtime as any).connection = {
    prompt: jest.fn().mockResolvedValue(response),
  };
  (runtime as any).applySelectedMode = jest.fn().mockResolvedValue(undefined);
  (runtime as any).applySelectedModel = jest.fn().mockResolvedValue(undefined);
  (runtime as any).applySelectedEffort = jest.fn().mockResolvedValue(undefined);
  return runtime;
}

describe('CodeBuddyChatRuntime permission mode', () => {
  it('applies bypass permissions before the first prompt in a new session', async () => {
    const plugin = createMockPlugin({
      settingsProvider: 'codebuddy',
      permissionMode: 'yolo',
      providerConfigs: { codebuddy: { enabled: true } },
      savedProviderPermissionMode: {},
    });
    const runtime = new CodeBuddyChatRuntime(plugin);
    const setConfigOption = jest.fn().mockResolvedValue({
      configOptions: [{
        category: 'mode',
        currentValue: 'bypassPermissions',
        id: 'mode',
        options: [],
        type: 'select',
      }],
    });
    (runtime as any).connection = {
      newSession: jest.fn().mockResolvedValue({
        configOptions: [{
          category: 'mode',
          currentValue: 'default',
          id: 'mode',
          options: [],
          type: 'select',
        }],
        sessionId: 'session-1',
      }),
      prompt: jest.fn().mockResolvedValue({ stopReason: 'end_turn' }),
      setConfigOption,
    };
    jest.spyOn(runtime, 'ensureReady').mockResolvedValue(true);
    (runtime as any).syncSessionModelState = jest.fn().mockResolvedValue(undefined);
    (runtime as any).applySelectedModel = jest.fn().mockResolvedValue(undefined);
    (runtime as any).applySelectedEffort = jest.fn().mockResolvedValue(undefined);
    const permissionModeSync = jest.fn((mode: string) => {
      plugin.settings.permissionMode = mode;
      plugin.settings.savedProviderPermissionMode.codebuddy = mode;
    });
    runtime.setPermissionModeSyncCallback(permissionModeSync);

    await collectChunks(runtime.query(createTurn()));

    expect(permissionModeSync).not.toHaveBeenCalledWith('normal');
    expect(setConfigOption).toHaveBeenCalledWith({
      configId: 'mode',
      sessionId: 'session-1',
      type: 'select',
      value: 'bypassPermissions',
    });
  });
});

describe('CodeBuddyChatRuntime prompt stop reasons', () => {
  it('treats end_turn as a successful completion', async () => {
    const runtime = createRuntimeWithPromptResponse({ stopReason: 'end_turn' });

    await expect(collectChunks(runtime.query(createTurn()))).resolves.toEqual([
      { type: 'done' },
    ]);
  });

  it('surfaces the provider error message for a refused turn', async () => {
    const runtime = createRuntimeWithPromptResponse({
      errorMessage: 'Authentication failed',
      stopReason: 'refusal',
    });

    await expect(collectChunks(runtime.query(createTurn()))).resolves.toEqual([
      { type: 'error', content: 'Authentication failed' },
      { type: 'done' },
    ]);
  });

  it('reads the CodeBuddy error message from ACP metadata', async () => {
    const runtime = createRuntimeWithPromptResponse({
      _meta: { 'codebuddy.ai/errorMessage': 'Model request failed' },
      stopReason: 'error',
    });

    await expect(collectChunks(runtime.query(createTurn()))).resolves.toEqual([
      { type: 'error', content: 'Model request failed' },
      { type: 'done' },
    ]);
  });

  it('treats cancellation as a non-error completion', async () => {
    const runtime = createRuntimeWithPromptResponse({
      errorMessage: 'Request cancelled',
      stopReason: 'cancelled',
    });

    await expect(collectChunks(runtime.query(createTurn()))).resolves.toEqual([
      { type: 'done' },
    ]);
  });

  it.each([
    ['refusal', 'CodeBuddy refused the request.'],
    ['max_tokens', 'CodeBuddy stopped the turn (max_tokens).'],
  ])('surfaces a fallback error for %s', async (stopReason, expectedMessage) => {
    const runtime = createRuntimeWithPromptResponse({ stopReason });

    await expect(collectChunks(runtime.query(createTurn()))).resolves.toEqual([
      { type: 'error', content: expectedMessage },
      { type: 'done' },
    ]);
  });
});
