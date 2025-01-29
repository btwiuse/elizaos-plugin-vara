import type { Plugin } from "@elizaos/core";

export * from "./actions/transfer";

import transfer from "./actions/transfer";

export const polkadotPlugin: Plugin = {
    name: "polkadot",
    description: "Polkadot integration plugin",
    providers: [],
    evaluators: [],
    services: [],
    actions: [transfer],
};

export default polkadotPlugin;
