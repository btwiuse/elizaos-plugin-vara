import type { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const polkadotEnvSchema = z.object({
    POLKADOT_ADDRESS: z.string().min(1, "Polkadot address is required"),
    POLKADOT_SEED: z.string().min(1, "Polkadot account seed phrase is required"),
});

export type polkadotConfig = z.infer<typeof polkadotEnvSchema>;

export async function validatePolkadotConfig(
    runtime: IAgentRuntime
): Promise<polkadotConfig> {
    try {
        const config = {
            POLKADOT_ADDRESS:
                runtime.getSetting("POLKADOT_ADDRESS") ||
                process.env.POLKADOT_ADDRESS,
            POLKADOT_SEED:
                runtime.getSetting("POLKADOT_SEED") || process.env.POLKADOT_SEED,
        };

        return polkadotEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Polkadot configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
