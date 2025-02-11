import {
  type Action,
  type ActionExample,
  composeContext,
  type Content,
  elizaLogger,
  generateObjectDeprecated,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelClass,
  type State,
} from "@elizaos/core";
import { validateVaraConfig } from "../environment";
import { GearApi, decodeAddress, encodeAddress } from "@gear-js/api";
import { Keyring } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { BN, hexToU8a, isHex, u8aToHex } from "@polkadot/util";
import type { ISubmittableResult } from "@polkadot/types/types/extrinsic";
import type { H256 } from "@polkadot/types/interfaces/runtime";

/**
 * This function checks if a given address is valid.
 *
 * @param {string} address The address to validate.
 *
 * @returns {boolean} A boolean value indicating whether the address is valid or not.
 */
export const isValidAddress = (address: string): boolean => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Formats a number to balance.
 *
 * @param {number | string} value The number value to format.
 * @param {number} [decimals] The number of decimal places to include in the formatted balance. Defaults to 18.
 *
 * @returns {BN} The converted BN value.
 */
export const formatNumberToBalance = (
  value: number | string,
  decimals: number = 12,
): BN => {
  const MAX_NUMBER_VALUES = 10;
  const [integerPart, fractionalPart] = value.toString().split(".");

  if (
    typeof value === "number" &&
    ((integerPart && integerPart.length > MAX_NUMBER_VALUES) ||
      (fractionalPart && fractionalPart.length > MAX_NUMBER_VALUES))
  ) {
    throw new Error(
      "For big representation of number, please use a string instead of a number",
    );
  }
  const integerBN = new BN(integerPart).mul(new BN(10).pow(new BN(decimals)));
  if (!fractionalPart) return integerBN;
  const fractionalBN = new BN(
    `${fractionalPart}${"0".repeat(decimals)}`.slice(0, decimals),
  );
  return integerBN.add(fractionalBN);
};

/**
 * Generates a new keyring.
 *
 * @returns {Keyring} The newly generated Keyring instance.
 */
export const generateKeyring = (): Keyring => {
  return new Keyring({ type: "sr25519" });
};

/**
 * Retrieves a keyring pair from a given seed.
 *
 * @param {string} seed The seed value used to generate the keypair.
 * @returns {KeyringPair} The KeyringPair generated from the seed.
 */
export const getKeyringFromSeed = (seed: string): KeyringPair => {
  const keyring = generateKeyring();
  return keyring.addFromUri(seed);
};

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

const transferTemplate =
  `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.


Example response:
\`\`\`json
{
    "recipient": "5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK",
    "amount": "1000"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Vara token transfer:
- Recipient wallet address
- Amount of Vara to transfer

Respond with a JSON markdown block containing only the extracted values.`;

export default {
  name: "SEND_VARA",
  similes: [
    "TRANSFER_VARA_TOKEN",
    "TRANSFER_TOKEN",
    "TRANSFER_TOKENS_ON_VARA",
    "TRANSFER_TOKEN_ON_VARA",
    "SEND_TOKENS_ON_VARA",
    "SEND_TOKENS_ON_VARA_NETWORK",
    "SEND_VARA_ON_VARA_NETWORK",
    "SEND_VARA_TOKEN_ON_VARA",
    "PAY_ON_VARA",
  ],
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    await validateVaraConfig(runtime);
    return true;
  },
  description:
    "Transfer Vara tokens from the agent's wallet to another address",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    elizaLogger.log("Starting SEND_VARA handler...");

    // Initialize or update state
    if (!state) {
      state = (await runtime.composeState(message)) as State;
    } else {
      state = await runtime.updateRecentMessageState(state);
    }

    // Compose transfer context
    const transferContext = composeContext({
      state,
      template: transferTemplate,
    });

    // Generate transfer content
    const content = await generateObjectDeprecated({
      runtime,
      context: transferContext,
      modelClass: ModelClass.SMALL,
    });

    // Validate transfer content
    if (!isTransferContent(content)) {
      console.log(content);
      console.error("Invalid content for TRANSFER_TOKEN action.");
      if (callback) {
        callback({
          text: "Unable to process transfer request. Invalid content provided.",
          content: { error: "Invalid transfer content" },
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
          `Recipient ${content.recipient} balance before the transfer call: ${oldBalance.data.free.toHuman()}`,
        );
        const senderBalance: any = await api.query.system.account(
          keyring.address,
        );
        elizaLogger.log(
          `Sender ${keyring.address} balance before the transfer call: ${senderBalance.data.free.toHuman()}`,
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
          `Balance after the transfer call: ${newBalance.data.free.toHuman()}`,
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
        elizaLogger.error("Error during token transfer:", error);
        if (callback) {
          callback({
            text: `Error transferring tokens: ${error.message}`,
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
        user: "{{user1}}",
        content: {
          text:
            "Send 1 VARA to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Sure, I'll send 1 VARA to that address now.",
          action: "SEND_VARA",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text:
            "Successfully sent 1 VARA to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK\nTransaction: 0x748057951ff79cea6de0e13b2ef70a1e9f443e9c83ed90e5601f8b45144a4ed4",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text:
            "Please send 1 VARA tokens to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Of course. Sending 1 VARA to that address now.",
          action: "SEND_VARA",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text:
            "Successfully sent 1 VARA to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK\nTransaction: 0x0b9f23e69ea91ba98926744472717960cc7018d35bc3165bdba6ae41670da0f0",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
