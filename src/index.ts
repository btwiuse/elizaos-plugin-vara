import type { Plugin } from "@elizaos/core";

import transfer from "./actions/transfer";

export { transfer };

export const polkadotPlugin: Plugin = {
  name: "polkadot",
  description: "Polkadot integration plugin",
  providers: [],
  evaluators: [],
  services: [],
  actions: [transfer],
};

export default polkadotPlugin;
