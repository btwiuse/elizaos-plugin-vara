import type { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const varaEnvSchema = z.object({
  VARA_ADDRESS: z.string().min(1, "Vara address is required"),
  VARA_SEED: z.string().min(1, "Vara account seed phrase is required"),
});

export type varaConfig = z.infer<typeof varaEnvSchema>;

export async function validateVaraConfig(
  runtime: IAgentRuntime,
): Promise<varaConfig> {
  try {
    const config = {
      VARA_ADDRESS: runtime.getSetting("VARA_ADDRESS") ||
        process.env.VARA_ADDRESS,
      VARA_SEED: runtime.getSetting("VARA_SEED") ||
        process.env.VARA_SEED,
      VARA_RPC_URL: runtime.getSetting("VARA_RPC_URL") ||
        process.env.VARA_RPC_URL,
    };

    return varaEnvSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(
        `Vara configuration validation failed:\n${errorMessages}`,
      );
    }
    throw error;
  }
}
