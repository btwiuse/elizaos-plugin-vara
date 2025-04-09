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

export const isValidAddress = (address: string): boolean => {
  return true;
};

export interface TransferContent extends Content {
  sender: string;
  recipient: string;
  amount: string | number;
}

export function isTransferContent(
  content: TransferContent,
): content is TransferContent {
  // Validate types
  const validTypes = typeof content.sender === "string" &&
    typeof content.recipient === "string" &&
    (typeof content.amount === "string" ||
      typeof content.amount === "number");
  if (!validTypes) {
    return false;
  }

  // Validate addresses
  const validAddresses = isValidAddress(content.recipient);
  return validAddresses;
}

const signTransferTransactionTemplate =
  `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
    
    
    Example response:
    \`\`\`json
    {
        "sender": "5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK",
        "recipient": "5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK",
        "amount": "123"
    }
    \`\`\`
    
    {{recentMessages}}
    
    Given the recent messages, extract the following information about the requested token transfer transaction signing request:
    - sender: Sender wallet address, possibly null
    - recipient: Recipient wallet address
    - amount: Amount of Vara to transfer
    
    Respond with a JSON markdown block containing only the extracted values.`;

export default {
  name: "SIGN_TRANSFER_TRANSACTION",
  similes: [],
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    return true;
  },
  description:
    "Sign a transfer token transaction using the specified wallet address, or by default the connected one",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    elizaLogger.log("Starting SIGN_TRANSFER_TRANSACTION handler...");

    const signClientService = runtime.getService("sign_client");

    // Compose transfer token context
    const prompt = composePromptFromState({
      state,
      template: signTransferTransactionTemplate,
    });

    // Generate transfer token content
    const content = await runtime.useModel(ModelType.OBJECT_SMALL, {
      prompt,
    });

    if (!content.sender) {
      content.sender = signClientService.sessionAccounts()[0].address;
    }

    // Validate transfer token content
    if (!isTransferContent(content)) {
      console.log(content);
      console.error("Invalid content for SIGN_TRANSFER_TRANSACTION action.");
      if (callback) {
        callback({
          text:
            "Unable to process sign message request. Invalid content provided.",
          content: { error: "Invalid sign message content" },
        });
      }
      return false;
    }

    if (content.amount != null && content.recipient != null) {
      try {
        elizaLogger.log(
          `Signing: ${JSON.stringify(content)}`,
        );
        const gearApiService = runtime.getService("gear_api");

        const api = gearApiService.api;

        const sender = content.sender;

        const recipient = content.recipient;

        const unsignedTransactionPayload = await createUnsignedTransaction(
          api,
          sender,
          recipient,
          content.amount,
        );

        const { signature, signedTransaction } = await signClientService
          .signTransaction(
            unsignedTransactionPayload,
            sender,
          );

        // send tx withSignedTransaction: true
        const txHash = await api.rpc.author.submitExtrinsic(
          signedTransaction,
        );
        console.log("txHash", txHash.toHex());

        elizaLogger.success(
          `Tx hash: ${txHash.toHex()}`,
        );

        if (callback) {
          callback({
            text: `Tx hash: ${txHash.toHex()}`,
            content: {},
          });
        }

        return true;
      } catch (error) {
        elizaLogger.error("Error during tx signing:", error);
        if (callback) {
          callback({
            text: `Error signing tx: ${error.message}`,
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
            "Please send 1 VARA to address 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK, using my current address",
        },
      },
      {
        name: "{{agent}}",
        content: {
          text: "Sure, sign the message using your current address.",
          actions: ["SIGN_TRANSFER_TRANSACTION"],
        },
      },
      {
        name: "{{agent}}",
        content: {
          text:
            "Tx hash: 0x748057951ff79cea6de0e13b2ef70a1e9f443e9c83ed90e5601f8b45144a4ed4",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text:
            "Please send 1 VARA to address 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK",
        },
      },
      {
        name: "{{agent}}",
        content: {
          text: "Of course. Signing the tx with that address now.",
          actions: ["SIGN_TRANSFER_TRANSACTION"],
        },
      },
      {
        name: "{{agent}}",
        content: {
          text:
            "Tx hash: 0x0b9f23e69ea91ba98926744472717960cc7018d35bc3165bdba6ae41670da0f0",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;

async function createUnsignedTransaction(api, sender, recipient, amount) {
  const lastHeader = await api.rpc.chain.getHeader();
  const blockHash = lastHeader.hash;
  const blockNumber = api.registry.createType(
    "BlockNumber",
    lastHeader.number.toNumber(),
  );
  const tx = api.tx.balances.transferKeepAlive(recipient, amount);
  const method = api.createType("Call", tx);

  const era = api.registry.createType("ExtrinsicEra", {
    current: lastHeader.number.toNumber(),
    period: 64,
  });

  const address = sender;

  const nonce = await api.rpc.system.accountNextIndex(address);

  const unsignedTransaction = {
    specVersion: api.runtimeVersion.specVersion.toHex(),
    transactionVersion: api.runtimeVersion.transactionVersion.toHex(),
    address: address,
    blockHash: blockHash.toHex(),
    blockNumber: blockNumber.toHex(),
    era: era.toHex(),
    genesisHash: api.genesisHash.toHex(),
    method: method.toHex(),
    nonce: nonce.toHex(),
    signedExtensions: api.registry.signedExtensions,
    tip: api.registry.createType("Compact<Balance>", 0).toHex(),
    version: tx.version,
    withSignedTransaction: true,
  };

  return unsignedTransaction;
}
