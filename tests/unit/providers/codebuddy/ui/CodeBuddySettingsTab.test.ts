import { codeBuddySettingsTabRenderer } from '@/providers/codebuddy/ui/CodeBuddySettingsTab';

const mockEnsureReady = jest.fn().mockResolvedValue(false);
const mockCleanup = jest.fn();
const mockNotice = jest.fn();

jest.mock('obsidian', () => {
  class MockSetting {
    public name = '';
    public buttonComponents: any[] = [];

    constructor(_container: unknown) {
      createdSettings.push(this);
    }

    setName(name: string) {
      this.name = name;
      return this;
    }

    setDesc(_desc: string) {
      return this;
    }

    setHeading() {
      return this;
    }

    addToggle(callback: (toggle: any) => void) {
      const toggle = {
        setValue: jest.fn().mockReturnThis(),
        onChange: jest.fn().mockReturnThis(),
      };
      callback(toggle);
      return this;
    }

    addText(callback: (text: any) => void) {
      const text = {
        inputEl: { toggleClass: jest.fn() },
        setPlaceholder: jest.fn().mockReturnThis(),
        setValue: jest.fn().mockReturnThis(),
        onChange: jest.fn().mockReturnThis(),
      };
      callback(text);
      return this;
    }

    addButton(callback: (button: any) => void) {
      const button: any = {
        disabled: false,
        text: '',
        onClickCallback: null,
      };
      button.setButtonText = jest.fn((value: string) => {
        button.text = value;
        return button;
      });
      button.setDisabled = jest.fn((value: boolean) => {
        button.disabled = value;
        return button;
      });
      button.setTooltip = jest.fn(() => button);
      button.onClick = jest.fn((onClick: () => void) => {
        button.onClickCallback = onClick;
        return button;
      });
      this.buttonComponents.push(button);
      callback(button);
      return this;
    }
  }

  return {
    Notice: class MockNotice {
      constructor(...args: unknown[]) {
        mockNotice(...args);
      }
    },
    Setting: MockSetting,
  };
});

jest.mock('@/features/settings/ui/EnvironmentSettingsSection', () => ({
  renderEnvironmentSettingsSection: jest.fn(),
}));

jest.mock('@/providers/codebuddy/app/CodeBuddyWorkspaceServices', () => ({
  maybeGetCodeBuddyWorkspaceServices: jest.fn(() => ({
    cliResolver: { reset: jest.fn() },
  })),
}));

jest.mock('@/providers/codebuddy/runtime/CodeBuddyChatRuntime', () => ({
  CodeBuddyChatRuntime: class MockCodeBuddyChatRuntime {
    ensureReady(...args: unknown[]) {
      return mockEnsureReady(...args);
    }

    cleanup() {
      return mockCleanup();
    }
  },
}));

jest.mock('@/utils/env', () => ({
  ...jest.requireActual('@/utils/env'),
  getHostnameKey: () => 'host-a',
  getLegacyHostnameKey: () => 'legacy-host',
}));

const createdSettings: Array<{
  name: string;
  buttonComponents: Array<{
    disabled: boolean;
    text: string;
    onClickCallback: (() => void) | null;
  }>;
}> = [];

function createPlugin(): any {
  return {
    app: {
      vault: {
        adapter: { basePath: '/tmp/claudian-test-vault' },
      },
    },
    settings: {
      providerConfigs: {
        codebuddy: {
          discoveredModels: [],
          enabled: true,
          visibleModels: [],
        },
      },
    },
    saveSettings: jest.fn().mockResolvedValue(undefined),
  };
}

describe('CodeBuddySettingsTab', () => {
  beforeEach(() => {
    createdSettings.length = 0;
    jest.clearAllMocks();
    mockEnsureReady.mockResolvedValue(false);
  });

  it('reports a failed model refresh when the runtime cannot start', async () => {
    const plugin = createPlugin();
    const context = {
      plugin,
      refreshModelSelectors: jest.fn(),
      renderCustomContextLimits: jest.fn(),
    } as any;
    const container = {
      createDiv: jest.fn(() => ({ setText: jest.fn(), toggleClass: jest.fn() })),
      empty: jest.fn(),
    } as any;

    codeBuddySettingsTabRenderer.render(container, context);

    const setting = createdSettings.find((candidate) => candidate.name === 'Discovered models');
    const button = setting?.buttonComponents[0];
    if (!button?.onClickCallback) {
      throw new Error('Expected CodeBuddy refresh button');
    }
    button.onClickCallback();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockEnsureReady).toHaveBeenCalledWith({ allowSessionCreation: true });
    expect(mockCleanup).toHaveBeenCalledTimes(1);
    expect(context.refreshModelSelectors).not.toHaveBeenCalled();
    expect(container.empty).not.toHaveBeenCalled();
    expect(mockNotice).toHaveBeenCalledWith(
      'Failed to discover CodeBuddy models: CodeBuddy could not start. Check the CLI path and login state.',
    );
    expect(button).toMatchObject({ disabled: false, text: 'Refresh' });
  });
});
