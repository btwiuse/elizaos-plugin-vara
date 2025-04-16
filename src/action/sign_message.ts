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

export interface MessageContent extends Content {
  message: string;
  address: string | null;
}

export function isSignMessageContent(
  content: MessageContent,
): content is MessageContent {
  // Validate types
  const validTypes = typeof content.message === "string" &&
    (typeof content.address === "string" ||
      content.address === null);
  if (!validTypes) {
    return false;
  }

  // Validate addresses
  const validAddresses = isValidAddress(content.sender);
  return validAddresses;
}

const signMessageTemplate =
  `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
  
  
  Example response:
  \`\`\`json
  {
      "address": "5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK",
      "message": "Hello world!"
  }
  \`\`\`
  
  {{recentMessages}}
  
  Given the recent messages, extract the following information about the requested sign-message request:
  - message: Message to sign
  - address: Signing wallet address, possibly null
  
  Respond with a JSON markdown block containing only the extracted values.`;

export default {
  name: "SIGN_MESSAGE",
  similes: [],
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    return true;
  },
  description: "Sign a message using the connected wallet address",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    elizaLogger.log("Starting SIGN_MESSAGE handler...");

    // Compose sign message context
    const prompt = composePromptFromState({
      state,
      template: signMessageTemplate,
    });

    // Generate sign message content
    const content = await runtime.useModel(ModelType.OBJECT_SMALL, {
      prompt,
    });
    console.log(content);

    // Validate sign message content
    if (!isSignMessageContent(content)) {
      console.error("Invalid content for SIGN_MESSAGE action.");
      if (callback) {
        callback({
          text:
            "Unable to process sign message request. Invalid content provided.",
          content: { error: "Invalid sign message content" },
        });
      }
      return false;
    }

    if (content.message != null) {
      try {
        elizaLogger.log(
          `Signing: ${JSON.stringify(content)}`,
        );

        const signClientService = runtime.getService("sign_client");

        const { signature } = await signClientService.signMessage(
          content.message,
          content.address,
        );

        elizaLogger.success(
          `Signature: ${signature}`,
        );

        if (callback) {
          callback({
            text: `Signature: ${signature}`,
            actions: ["SIGN_MESSAGE"],
            content: {},
          });
        }

        return true;
      } catch (error) {
        elizaLogger.error("Error during message signing:", error);
        if (callback) {
          callback({
            text: `Error signing message: ${error.message}`,
            content: { error: error.message },
          });
        }
        return false;
      }
    } else {
      elizaLogger.log("Message not specified");
    }
  },

  examples: [
    [
      {
        name: "{{user1}}",
        content: {
          text: "Sign the message: Hello World!",
        },
      },
      {
        name: "{{agent}}",
        content: {
          text: "Sure, sign the message using your current address.",
          actions: ["SIGN_MESSAGE"],
        },
      },
      {
        name: "{{agent}}",
        content: {
          text:
            "Signature: 0x748057951ff79cea6de0e13b2ef70a1e9f443e9c83ed90e5601f8b45144a4ed4",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text:
            "Please sign the message with address 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK: Hello World!",
        },
      },
      {
        name: "{{agent}}",
        content: {
          text: "Of course. Signing the message with that address now.",
          actions: ["SIGN_MESSAGE"],
        },
      },
      {
        name: "{{agent}}",
        content: {
          text:
            "Signature: 0x0b9f23e69ea91ba98926744472717960cc7018d35bc3165bdba6ae41670da0f0",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
