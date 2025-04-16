import {
  type Action,
  type Content,
  type GenerateTextParams,
  type HandlerCallback,
  type IAgentRuntime,
  logger,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  Service,
  type State,
} from "@elizaos/core";
import qrcode from "qrcode-generator";
import { SignClient } from "@walletconnect/sign-client";
import { KeyValueStorage } from "@walletconnect/keyvaluestorage";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

// Function to generate QR code as data URL
function generateQRCodeDataURL(
  text: string,
  errorCorrectionLevel: ErrorCorrectionLevel = "Q",
): string {
  const qr = qrcode(0, errorCorrectionLevel); // Type 0 auto-detects size, 'L' is error correction level
  qr.addData(text);
  qr.make();
  return "data:image/svg+xml;utf8," + encodeURIComponent(qr.createSvgTag());
}

/**
 * Represents an action that responds with a simple wallet connect message.
 *
 * @typedef {Object} Action
 * @property {string} name - The name of the action
 * @property {string[]} similes - The related similes of the action
 * @property {string} description - Description of the action
 * @property {Function} validate - Validation function for the action
 * @property {Function} handler - The function that handles the action
 * @property {Object[]} examples - Array of examples for the action
 */
export const WalletConnectAction: Action = {
  name: "WALLET_CONNECT",
  similes: [],
  description:
    "Responds with a simple wallet connect message for connecting wallet via WalletConnect",
  suppressInitialMessage: true,

  validate: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State,
  ): Promise<boolean> => {
    return true;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[],
  ) => {
    try {
      logger.info("Handling WALLET_CONNECT action");

      const signClientService = runtime.getService("sign_client");

      const { uri, approved } = await signClientService.createNewApprovalUri();

      // Simple response content
      const responseContent: Content = {
        // text: uri,
        text: `waiting for approval...`,
        actions: ["WALLET_CONNECT"],
        source: message.content.source,
        attachments: [
          {
            type: "image",
            url: generateQRCodeDataURL(uri),
          },
        ],
      };

      // Call back with the qr code message
      // await callback(responseContent);

      await callback({
        text: `waiting for approval...\n\n${uri}`,
        actions: ["WALLET_CONNECT"],
        source: message.content.source,
      });

      const session = await approved;

      const addresses = signClientService.sessionAccounts().map((a) =>
        a.address
      );

      await callback({
        text: `you are connected as ${JSON.stringify(addresses)}`,
        actions: ["WALLET_CONNECT"],
      });

      return responseContent;
    } catch (error) {
      logger.error("Error in WALLET_CONNECT action:", error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me QR code for walletconnect",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "TODO!",
          actions: ["WALLET_CONNECT"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Connect wallet",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "TODO!",
          actions: ["WALLET_CONNECT"],
        },
      },
    ],
  ],
};

export default WalletConnectAction;
