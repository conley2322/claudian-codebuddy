import type { ProviderReasoningOption, ProviderUIOption } from '../../core/providers/types';

export const CODEBUDDY_SYNTHETIC_MODEL_ID = 'codebuddy';
export const CODEBUDDY_MODEL_PREFIX = 'codebuddy:';
export const CODEBUDDY_DEFAULT_MODEL = 'gpt-5.5';
export const CODEBUDDY_DEFAULT_REASONING_LEVEL = 'enabled';
export const CODEBUDDY_DEFAULT_CONTEXT_WINDOW = 200_000;

export interface CodeBuddyDiscoveredModel {
  description?: string | null;
  label: string;
  rawId: string;
}

export const CODEBUDDY_KNOWN_MODELS: CodeBuddyDiscoveredModel[] = [
  { rawId: 'default-model', label: 'Default', description: null },
  { rawId: 'gemini-3.1-pro', label: 'Gemini-3.1-Pro', description: null },
  { rawId: 'gemini-3.0-flash', label: 'Gemini-3.0-Flash', description: null },
  { rawId: 'gemini-3.5-flash', label: 'Gemini-3.5-Flash', description: 'Well-rounded model for everyday use' },
  { rawId: 'gemini-2.5-pro', label: 'Gemini-2.5-Pro', description: null },
  { rawId: 'gemini-2.5-flash', label: 'Gemini-2.5-Flash', description: null },
  { rawId: 'gemini-3.1-flash-lite', label: 'Gemini-3.1-flash-lite', description: null },
  { rawId: 'gpt-5.5', label: 'GPT-5.5', description: 'OpenAI\'s flagship model, excelling at long-horizon tasks' },
  { rawId: 'gpt-5.4', label: 'GPT-5.4', description: null },
  { rawId: 'gpt-5.3-codex', label: 'GPT-5.3-Codex', description: null },
  { rawId: 'gpt-5.1-codex', label: 'GPT-5.1-Codex', description: null },
  { rawId: 'gpt-5.1-codex-mini', label: 'GPT-5.1-Codex-Mini', description: null },
  { rawId: 'deepseek-v3-2-volc', label: 'DeepSeek-V3.2', description: null },
  { rawId: 'glm-5.2-ioa', label: 'GLM-5.2', description: null },
  { rawId: 'glm-5.0', label: 'GLM-5.0', description: null },
  { rawId: 'kimi-k2.5', label: 'Kimi-K2.5', description: null },
];

export const CODEBUDDY_KNOWN_MODEL_IDS = CODEBUDDY_KNOWN_MODELS.map((model) => model.rawId);

export function mergeCodeBuddyKnownModels(discoveredModels: CodeBuddyDiscoveredModel[]): CodeBuddyDiscoveredModel[] {
  if (discoveredModels.length === 0) {
    return CODEBUDDY_KNOWN_MODELS;
  }

  const seen = new Set(discoveredModels.map((model) => model.rawId));
  const merged = [...discoveredModels];
  for (const model of CODEBUDDY_KNOWN_MODELS) {
    if (!seen.has(model.rawId)) {
      merged.push(model);
    }
  }
  return merged;
}

export const CODEBUDDY_DEFAULT_REASONING_OPTIONS: ProviderReasoningOption[] = [
  { value: 'enabled', label: 'On' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'xhigh', label: 'X-High' },
  { value: 'max', label: 'Max' },
];

export function encodeCodeBuddyModelId(rawId: string): string {
  const trimmed = rawId.trim();
  return trimmed ? `${CODEBUDDY_MODEL_PREFIX}${trimmed}` : CODEBUDDY_SYNTHETIC_MODEL_ID;
}

export function decodeCodeBuddyModelId(modelId: string): string | null {
  const trimmed = modelId.trim();
  if (!trimmed.startsWith(CODEBUDDY_MODEL_PREFIX)) {
    return null;
  }
  const rawId = trimmed.slice(CODEBUDDY_MODEL_PREFIX.length).trim();
  return rawId || null;
}

export function isCodeBuddyModelSelectionId(modelId: string): boolean {
  return modelId === CODEBUDDY_SYNTHETIC_MODEL_ID || decodeCodeBuddyModelId(modelId) !== null;
}

export function normalizeCodeBuddyDiscoveredModels(value: unknown): CodeBuddyDiscoveredModel[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const models: CodeBuddyDiscoveredModel[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const rawId = typeof record.rawId === 'string' ? record.rawId.trim() : '';
    if (!rawId || seen.has(rawId)) {
      continue;
    }
    seen.add(rawId);
    const label = typeof record.label === 'string' && record.label.trim()
      ? record.label.trim()
      : formatCodeBuddyModelLabel(rawId);
    const description = typeof record.description === 'string' ? record.description : null;
    models.push({ rawId, label, description });
  }
  return models;
}

export function normalizeCodeBuddyVisibleModels(value: unknown, discoveredModels: CodeBuddyDiscoveredModel[]): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const knownIds = new Set(discoveredModels.map((model) => model.rawId));
  const seen = new Set<string>();
  const visible: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') {
      continue;
    }
    const rawId = entry.trim();
    if (!rawId || seen.has(rawId)) {
      continue;
    }
    if (knownIds.size > 0 && !knownIds.has(rawId)) {
      continue;
    }
    seen.add(rawId);
    visible.push(rawId);
  }
  return visible;
}

export function buildCodeBuddyModelOption(model: CodeBuddyDiscoveredModel, alias?: string): ProviderUIOption {
  return {
    description: model.description || 'CodeBuddy Code model',
    label: alias || model.label,
    value: encodeCodeBuddyModelId(model.rawId),
  };
}

export function formatCodeBuddyModelLabel(rawId: string): string {
  return rawId
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-') || 'CodeBuddy';
}
