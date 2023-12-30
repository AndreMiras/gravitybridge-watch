import { Gauge, Registry } from "prom-client";
import {
  getLastObservedEthNonceClientCached,
  getValidatorInfoMapCached,
} from "./utils";

const register = new Registry();

register.setDefaultLabels({
  app: "gravitybridge.watch",
});

const lastObservedEthNonceGauge = new Gauge({
  name: "last_observed_eth_nonce",
  help: "Last observed Ethereum event nonce",
  registers: [register],
});

const nonceGauge = new Gauge({
  name: "orchestrator_nonce",
  help: "Nonce of the orchestrator",
  labelNames: ["validatorAddress", "orchestratorAddress", "moniker"],
  registers: [register],
});

const updateNonceGauge = async () => {
  const validatorInfoMap = await getValidatorInfoMapCached();
  Object.entries(validatorInfoMap).forEach(([valoper, info]) => {
    nonceGauge.set(
      {
        validatorAddress: info.validatorAddress,
        orchestratorAddress: info.orchestratorAddress,
        moniker: info.moniker,
      },
      info.nonce,
    );
  });
};

const updateLastObservedEthNonceGauge = async () => {
  const lastObservedEthNonce = await getLastObservedEthNonceClientCached();
  lastObservedEthNonceGauge.set(lastObservedEthNonce);
};

export { register, updateNonceGauge, updateLastObservedEthNonceGauge };
