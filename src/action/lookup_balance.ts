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
  import {
    isValidAddress,
  } from "../utils.ts";
  import { type GearApiService } from "../service/GearApi.ts";
  
  const lookupTemplate =
    `Respond with a JSON markdown block containing only the extracted values.
  
  
  Example response:
  \`\`\`json
  {
      "address": "5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK"
  }
  \`\`\`
  
  {{recentMessages}}
  
  Given the recent messages, extract the following information about the requested account balance lookup:
  - Address of the wallet in question
  
  Respond with a JSON markdown block containing only the extracted values.`;
  
  export default {
    name: "LOOKUP_BALANCE",
    similes: [],
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
      await validateVaraConfig(runtime);
      return true;
    },
    description:
      "Lookup free balance of the user specified address",
    handler: async (
      runtime: IAgentRuntime,
      message: Memory,
      state: State,
      _options: { [key: string]: unknown },
      callback?: HandlerCallback,
    ): Promise<boolean> => {
      elizaLogger.log("Starting LOOKUP_BALANCE handler...");
  
      // Initialize or update state
      /*
      if (!state) {
        state = await runtime.composeState(message);
      } else {
        await runtime.createMemory(message, "messages");
      }
      */
  
      // Compose lookup context
      const prompt = composePromptFromState({
        state,
        template: lookupTemplate,
      });
  
      // Generate lookup content
      const content = await runtime.useModel(ModelType.OBJECT_SMALL, {
        prompt,
      });
  
      // Validate lookup content
      if (!isValidAddress(content)) {
        console.log(content);
        console.error("Invalid content for LOOKUP_BALANCE action.");
        if (callback) {
          callback({
            text: "Unable to process lookup request. Invalid content provided.",
            content: { error: "Invalid lookup content" },
          });
        }
        return false;
      }
  
      if (content.address != null) {
        try {
          const gearApiService : GearApiService = runtime.getService("gear_api");

          const api = gearApiService.api;
  
          const balance: any = await api.query.system.account(
            content.address,
          );
          elizaLogger.log(
            `${content.address} balance: ${balance.data.free.toHuman()}`,
          );

          if (callback) {
            callback({
              text: `Address balance of ${content.address}: ${balance.data.free.toHuman()} `,
              content: {},
            });
          }
  
          return true;
        } catch (error) {
          elizaLogger.error("Error during balance lookup:", error);
          if (callback) {
            callback({
              text: `Error looking up balance: ${error.message}`,
              content: { error: error.message },
            });
          }
          return false;
        }
      } else {
        elizaLogger.log("Address not specified");
      }
    },
  
    examples: [
      [
        {
          name: "{{user1}}",
          content: {
            text:
              "How many VARA does the address have? 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK",
          },
        },
        {
          name: "{{agent}}",
          content: {
            text: "Sure, I'll query the balance of the provided address.",
            actions: ["LOOKUP_BALANCE"],
          },
        },
        {
          name: "{{agent}}",
          content: {
            text:
              "Address balance of 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK: 1 VARA",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text:
              "Check account balance of 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK",
          },
        },
        {
          name: "{{agent}}",
          content: {
            text: "Of course. Looking up the account balance for you.",
            actions: ["LOOKUP_BALANCE"],
          },
        },
        {
          name: "{{agent}}",
          content: {
            text:
              "Address balance of 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK: 42 MVARA",
          },
        },
      ],
    ] as ActionExample[][],
  } as Action;
  