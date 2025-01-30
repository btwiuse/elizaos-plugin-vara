import type { Plugin } from "@elizaos/core";

import transfer from "./actions/transfer";

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
