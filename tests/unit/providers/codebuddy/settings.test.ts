import {
  CODEBUDDY_KNOWN_MODEL_IDS,
  CODEBUDDY_KNOWN_MODELS,
} from '@/providers/codebuddy/models';
import {
  getCodeBuddyProviderSettings,
  updateCodeBuddyProviderSettings,
} from '@/providers/codebuddy/settings';

describe('CodeBuddy settings normalization', () => {
  it('seeds recent CodeBuddy models when no runtime discovery is cached', () => {
    const settings = getCodeBuddyProviderSettings({});

    expect(settings.discoveredModels).toEqual(CODEBUDDY_KNOWN_MODELS);
    expect(settings.visibleModels).toEqual(CODEBUDDY_KNOWN_MODEL_IDS);
    expect(settings.visibleModels).toEqual(expect.arrayContaining([
      'gpt-5.5',
      'gpt-5.4',
      'gpt-5.3-codex',
      'gpt-5.1-codex',
      'gpt-5.1-codex-mini',
      'gemini-3.1-pro',
      'gemini-3.5-flash',
      'glm-5.2-ioa',
    ]));
  });

  it('falls back to known models for older empty CodeBuddy configs', () => {
    const settings = getCodeBuddyProviderSettings({
      providerConfigs: {
        codebuddy: {
          discoveredModels: [],
          visibleModels: [],
        },
      },
    });

    expect(settings.discoveredModels).toEqual(CODEBUDDY_KNOWN_MODELS);
    expect(settings.visibleModels).toEqual(CODEBUDDY_KNOWN_MODEL_IDS);
  });

  it('appends known models to older non-empty discovery caches', () => {
    const settings = getCodeBuddyProviderSettings({
      providerConfigs: {
        codebuddy: {
          discoveredModels: [
            { rawId: 'gpt-5.4', label: 'GPT-5.4', description: null },
          ],
          visibleModels: ['gpt-5.4'],
        },
      },
    });

    expect(settings.discoveredModels.map((model) => model.rawId)).toEqual(expect.arrayContaining([
      'gpt-5.4',
      'glm-5.2-ioa',
    ]));
    expect(settings.visibleModels).toEqual(['gpt-5.4']);
  });

  it('filters seeded visible models to the runtime discovered list when discovery refreshes', () => {
    const settings: Record<string, unknown> = {};

    const next = updateCodeBuddyProviderSettings(settings, {
      discoveredModels: [
        { rawId: 'gpt-5.4', label: 'GPT-5.4', description: null },
      ],
    });

    expect(next.discoveredModels).toEqual([
      { rawId: 'gpt-5.4', label: 'GPT-5.4', description: null },
    ]);
    expect(next.visibleModels).toEqual(['gpt-5.4']);
  });
});
