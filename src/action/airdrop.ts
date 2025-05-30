import {
  type Action,
  type ActionExample,
  composePrompt,
  composePromptFromState,
  type Content,
  elizaLogger,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type State,
} from "@elizaos/core";
import { validateVaraConfig } from "../environment";
import type { ISubmittableResult } from "@polkadot/types/types/extrinsic";
import type { H256 } from "@polkadot/types/interfaces/runtime";
import { GearApi } from "@gear-js/api";
import {
  formatNumberToBalance,
  getKeyringFromSeed,
  isValidAddress,
} from "../utils.ts";

export interface TransferContent extends Content {
  recipient: string;
  amount: string | number;
}

export function isTransferContent(
  content: TransferContent,
): content is TransferContent {
  // Validate types
  const validTypes = typeof content.recipient === "string" &&
    (typeof content.amount === "string" ||
      typeof content.amount === "number");
  if (!validTypes) {
    return false;
  }

  // Validate addresses
  const validAddresses = isValidAddress(content.recipient);
  return validAddresses;
}

/**
 * This function get the number of decimals from the chain registry.
 *
 * @param {GearApi} api the api promise of the chain.
 *
 * @returns {number} The number of decimals of the chain from the api promise.
 */
export const getDecimals = (api: GearApi): number => {
  return api.registry.chainDecimals[0];
};

const airdropTemplate =
  `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.


Example response:
\`\`\`json
{
    "recipient": "5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK",
    "amount": "1000"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Vara token airdrop:
- Recipient wallet address
- Amount of Vara to airdrop

Respond with a JSON markdown block containing only the extracted values.`;

export default {
  name: "AIRDROP",
  similes: [],
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    await validateVaraConfig(runtime);
    return true;
  },
  description:
    "Airdrop Vara tokens from the agent's wallet to user specified address",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    elizaLogger.log("Starting AIRDROP_VARA handler...");

    // Initialize or update state
    /*
    if (!state) {
      state = await runtime.composeState(message);
    } else {
      await runtime.createMemory(message, "messages");
    }
    */

    // Compose airdrop context
    const prompt = composePromptFromState({
      state,
      template: airdropTemplate,
    });

    // Generate airdrop content
    const content = await runtime.useModel(ModelType.OBJECT_SMALL, {
      prompt,
    });

    // Validate airdrop content
    if (!isTransferContent(content)) {
      console.log(content);
      console.error("Invalid content for AIRDROP action.");
      if (callback) {
        callback({
          text: "Unable to process airdrop request. Invalid content provided.",
          content: { error: "Invalid airdrop content" },
        });
      }
      return false;
    }

    if (content.amount != null && content.recipient != null) {
      try {
        const SEED = runtime.getSetting("VARA_SEED")!;
        const ENDPOINT = runtime.getSetting("VARA_RPC_URL");

        const api = await GearApi.create({ providerAddress: ENDPOINT });
        const keyring = getKeyringFromSeed(SEED);
        const options = { nonce: -1 };
        const decimals = getDecimals(api);
        const amount = formatNumberToBalance(content.amount, decimals);

        const oldBalance: any = await api.query.system.account(
          content.recipient,
        );
        elizaLogger.log(
          `Recipient ${content.recipient} balance before the airdrop call: ${oldBalance.data.free.toHuman()}`,
        );
        const senderBalance: any = await api.query.system.account(
          keyring.address,
        );
        elizaLogger.log(
          `Sender ${keyring.address} balance before the airdrop call: ${senderBalance.data.free.toHuman()}`,
        );

        // Transaction call
        const txResult: ISubmittableResult = await new Promise(
          (res) => {
            api.tx.balances
              .transferKeepAlive(content.recipient, amount)
              .signAndSend(
                keyring,
                options,
                (result) => {
                  elizaLogger.log(
                    `Tx status: ${result.status}`,
                  );
                  if (result.isFinalized || result.isError) {
                    res(result as any);
                  }
                },
              );
          },
        );

        // Error handling
        const error = txResult.dispatchError;
        if (txResult.isError) {
          elizaLogger.log(`Transaction was not executed`);
        } else if (error != undefined) {
          if (error.isModule) {
            const decoded = api.registry.findMetaError(
              error.asModule,
            );
            const { docs, name, section } = decoded;
            elizaLogger.log(
              `${section}.${name}: ${docs.join(" ")}`,
            );
          } else {
            elizaLogger.log(error.toString());
          }
        }

        const newBalance: any = await api.query.system.account(
          content.recipient,
        );
        elizaLogger.log(
          `Balance after the airdrop call: ${newBalance.data.free.toHuman()}`,
        );

        elizaLogger.success(
          "Transfer completed successfully! tx: \n " +
            `Tx Hash: ${txResult.txHash as H256}, Block Hash: ${txResult.status
              .asFinalized as H256}`,
        );
        if (callback) {
          callback({
            text: `Transfer completed successfully! tx hash: ${txResult
              .txHash as H256} Block Hash: ${txResult.status
              .asFinalized as H256} `,
            content: {},
          });
        }

        return true;
      } catch (error) {
        elizaLogger.error("Error during token airdrop:", error);
        if (callback) {
          callback({
            text: `Error airdropping tokens: ${error.message}`,
            content: { error: error.message },
          });
        }
        return false;
      }
    } else {
      elizaLogger.log("Either amount or recipient not specified");
    }
  },

  examples: [
    [
      {
        name: "{{user1}}",
        content: {
          text:
            "Airdrop 1 VARA to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK",
        },
      },
      {
        name: "{{agent}}",
        content: {
          text: "Sure, I'll airdrop 1 VARA to that address now.",
          actions: ["AIRDROP"],
        },
      },
      {
        name: "{{agent}}",
        content: {
          text:
            "Successfully airdropped 1 VARA to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK\nTransaction: 0x748057951ff79cea6de0e13b2ef70a1e9f443e9c83ed90e5601f8b45144a4ed4",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text:
            "Please airdrop 1 VARA tokens to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK",
        },
      },
      {
        name: "{{agent}}",
        content: {
          text: "Of course. Airdropping 1 VARA to that address now.",
          actions: ["AIRDROP"],
        },
      },
      {
        name: "{{agent}}",
        content: {
          text:
            "Successfully airdropped 1 VARA to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK\nTransaction: 0x0b9f23e69ea91ba98926744472717960cc7018d35bc3165bdba6ae41670da0f0",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
