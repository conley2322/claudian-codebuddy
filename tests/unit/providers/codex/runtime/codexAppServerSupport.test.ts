import { initializeCodexAppServerTransport } from '@/providers/codex/runtime/codexAppServerSupport';
import type { CodexRpcTransport } from '@/providers/codex/runtime/CodexRpcTransport';

function createMockTransport(): jest.Mocked<CodexRpcTransport> {
  return {
    request: jest.fn(),
    notify: jest.fn(),
  } as unknown as jest.Mocked<CodexRpcTransport>;
}

describe('initializeCodexAppServerTransport', () => {
  it('sends initialize with the default 60s handshake timeout when no override is given', async () => {
    const transport = createMockTransport();
    transport.request.mockResolvedValue({
      userAgent: 'codex/0.1',
      codexHome: '/tmp',
      platformFamily: 'unix',
      platformOs: 'macos',
    });

    await initializeCodexAppServerTransport(transport);

    expect(transport.request).toHaveBeenCalledWith(
      'initialize',
      expect.objectContaining({
        clientInfo: { name: 'claudian', version: '1.0.0' },
        capabilities: { experimentalApi: true },
      }),
      60_000,
    );
  });

  it('passes a caller-provided timeout override through to transport.request', async () => {
    const transport = createMockTransport();
    transport.request.mockResolvedValue({
      userAgent: 'codex/0.1',
      codexHome: '/tmp',
      platformFamily: 'unix',
      platformOs: 'macos',
    });

    await initializeCodexAppServerTransport(transport, 120_000);

    expect(transport.request).toHaveBeenCalledWith(
      'initialize',
      expect.objectContaining({
        clientInfo: { name: 'claudian', version: '1.0.0' },
      }),
      120_000,
    );
  });

  it('notifies initialized after a successful handshake', async () => {
    const transport = createMockTransport();
    transport.request.mockResolvedValue({
      userAgent: 'codex/0.1',
      codexHome: '/tmp',
      platformFamily: 'unix',
      platformOs: 'macos',
    });

    await initializeCodexAppServerTransport(transport);

    expect(transport.notify).toHaveBeenCalledWith('initialized');
  });

  it('does not notify initialized when the handshake rejects', async () => {
    const transport = createMockTransport();
    transport.request.mockRejectedValue(new Error('Request timeout: initialize (60000ms)'));

    await expect(initializeCodexAppServerTransport(transport)).rejects.toThrow(/initialize/);
    expect(transport.notify).not.toHaveBeenCalled();
  });
});
