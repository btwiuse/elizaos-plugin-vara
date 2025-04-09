import type { Plugin } from "@elizaos/core";
import { type IAgentRuntime, logger, Service } from "@elizaos/core";
import { GearApi } from "@gear-js/api";

export class GearApiService extends Service {
  static serviceType = "gear_api";
  capabilityDescription =
    "This is a Gear API service which is attached to the agent through the starter plugin.";
  public api = null;

  constructor(protected runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("*** Starting gear api service ***");
    const service = new GearApiService(runtime);
    await service.initialize();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("*** Stopping gear api service ***");
    // get the service from the runtime
    const service = runtime.getService(GearApiService.serviceType);
    if (!service) {
      throw new Error("Starter service not found");
    }
    service.stop();
  }

  public async initialize() {
    logger.info(`*** Initializing gear api ***`);
    const providerAddress = runtime.getSetting("VARA_RPC_URL");
    this.api = await GearApi.create({ providerAddress });
    await this.api.isReady;
    logger.info(`*** Initialized gear api ***`);
  }

  async stop() {
    logger.info("*** Stopping gear api service instance ***");
  }
}

export default GearApiService;
