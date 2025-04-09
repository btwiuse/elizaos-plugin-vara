import type { Plugin } from "@elizaos/core";

import transfer from "./action/transfer";

export { transfer };

export const varaPlugin: Plugin = {
  name: "vara",
  description: "Vara integration plugin",
  providers: [],
  evaluators: [],
  services: [],
  actions: [transfer],
};

export default varaPlugin;
