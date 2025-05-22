import type { Plugin } from "@elizaos/core";

import AirdropAction from "./action/airdrop.ts";
import LookupBalanceAction from "./action/lookup_balance.ts";
import WalletConnectAction from "./action/wallet_connect.ts";
import SignMessageAction from "./action/sign_message.ts";
import SignTransferTransactionAction from "./action/sign_transfer_transaction.ts";
import GearApiService from "./service/GearApi.ts";
import SignClientService from "./service/SignClient.ts";

export const varaPlugin: Plugin = {
  name: "vara",
  description: "Vara integration plugin",
  providers: [],
  evaluators: [],
  services: [
    GearApiService,
    SignClientService,
  ],
  actions: [
    AirdropAction,
    LookupBalanceAction,
    WalletConnectAction,
    SignMessageAction,
    SignTransferTransactionAction,
  ],
};

export default varaPlugin;
