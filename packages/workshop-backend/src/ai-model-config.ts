import type { AiModelConfig } from "@gadgets/workshop-shared/api";

/** Whether a model carries the credentials needed to bypass deployment AI Gateway routing. */
export function isDirectModelConfig(config: AiModelConfig): boolean {
  if (config.provider === "cloudflare") {
    return Boolean(config.accountId?.trim() && config.apiToken.trim());
  }
  if (config.provider === "ollama") {
    return Boolean(config.apiUrl?.trim());
  }
  return Boolean(config.apiUrl?.trim() && config.apiToken.trim());
}
