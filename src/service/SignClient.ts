import type { Plugin } from "@elizaos/core";
import { type IAgentRuntime, logger, Service } from "@elizaos/core";
import qrcode from "qrcode-generator";
import { SignClient } from "@walletconnect/sign-client";
import { KeyValueStorage } from "@walletconnect/keyvaluestorage";

const PROJECT_ID = "4fae85e642724ee66587fa9f37b997e2";
const CLIENT_METADATA = {
  description: "WalletConnect RPC Server",
  url: "https://github.com/btwiuse/elizaos-project-v2",
  icons: [
    "https://raw.githubusercontent.com/btwiuse/seacrest/refs/heads/main/logo.png",
  ],
  name: "José",
};
const CAIPS = {
  "polkadot": "polkadot:91b171bb158e2d3848fa23a9f1c25182",
  "westend": "polkadot:e143f23803ac50e8f6f8e62695d1ce9e",
  "kusama": "polkadot:b0a8d493285c2df73290dfb7e61f870f",
  "rococo": "polkadot:6402de9248192d349f9625764fad3357",
  "vara": "polkadot:fe1b4c55fd4d668101126434206571a7",
  "tvara": "polkadot:525639f713f397dcf839bd022cd821f3",
};

export class SignClientService extends Service {
  static serviceType = "sign_client";
  capabilityDescription =
    "This is a SignClient service which is attached to the agent through the starter plugin.";
  public signClient = null;
  public session = null;
  public chainCAIP = CAIPS.vara;

  constructor(protected runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("*** Starting sign client service ***");
    const service = new SignClientService(runtime);
    await service.initialize();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("*** Stopping sign client service ***");
    // get the service from the runtime
    const service = runtime.getService(SignClientService.serviceType);
    if (!service) {
      throw new Error("Starter service not found");
    }
    service.stop();
  }

  public async initialize() {
    logger.info(`*** Initializing sign client ***`);
    this.signClient = await SignClient.init({
      projectId: PROJECT_ID,
      metadata: CLIENT_METADATA,
      storage: new KeyValueStorage(),
    });
    logger.info(`*** Initialized sign client ***`);
    this.session = await this.getExistingSession();
  }

  public async getExistingSession() {
    const sessions = this.signClient.session.getAll();
    return sessions.find((session) =>
      session.namespaces.polkadot.chains.includes(this.chainCAIP)
    );
  }

  public async createNewApprovalUri() {
    const { uri, approval } = await this.signClient.connect({
      requiredNamespaces: {
        polkadot: {
          methods: [
            "polkadot_signTransaction",
            "polkadot_signMessage",
          ],
          events: ["chainChanged", "accountsChanged"],
          chains: [this.chainCAIP],
        },
      },
    });

    if (!uri) throw new Error("Failed to generate connection URI");

    const approved = new Promise((resolve, reject) => {
      approval().then((s) => {
        this.session = s;
        resolve(s);
      });
    });

    return { uri, approved };
  }

  public sessionAccounts() {
    const [expectedNamespace, expectedChainId] = this.chainCAIP.split(":");

    const accounts = this.session.namespaces.polkadot.accounts.map(
      (account) => {
        const [namespace, chainId, address] = account.split(":");
        return {
          namespace,
          chainId,
          address,
          caip: `${namespace}:${chainId}`,
        };
      },
    );

    const invalidAccounts = accounts.filter(
      (account) => account.caip !== this.chainCAIP,
    );

    if (invalidAccounts.length > 0) {
      throw new Error(
        `Network mismatch! Expected ${this.chainCAIP}, ` +
          `found: ${invalidAccounts.map((a) => a.caip).join(", ")}`,
      );
    }

    return accounts.map((account) => ({
      address: account.address,
      caip: account.caip,
      chainId: account.chainId,
      namespace: account.namespace,
    }));
  }

  public async signMessage(
    message,
    address,
  ) {
    return this.signClient.request({
      topic: this.session.topic,
      chainId: this.chainCAIP,
      request: {
        method: "polkadot_signMessage",
        params: {
          message,
          address: address || this.sessionAccounts()[0].address,
        },
      },
    });
  }

  public async signTransaction(
    transactionPayload,
    address,
  ) {
    return this.signClient.request({
      topic: this.session.topic,
      chainId: this.chainCAIP,
      request: {
        method: "polkadot_signTransaction",
        params: {
          transactionPayload,
          address: address ?? this.sessionAccounts()[0].address,
        },
      },
    });
  }

  async stop() {
    logger.info("*** Stopping sign client service instance ***");
  }
}

export default SignClientService;
