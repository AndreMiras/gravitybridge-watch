import {
  getClient,
  lastEventNonceByAddr,
  getLastObservedEthNonce,
  lastValsetRequests,
  getDelegateKeyByEth,
} from "./grpc";
import {
  CacheMissError,
  getClient as getCacheClient,
  withCache,
} from "./cache/interface";
import { getFunction, setFunction } from "./cache/gcp-bucket";

interface GetDelegateKeyByEthsResponse {
  [ethAddress: string]: {
    validatorAddress: string;
    orchestratorAddress: string;
  };
}

interface ValoperNonceMap {
  [valoperAddress: string]: number;
}

// to avoid cache miss during ISR build, `forceUpdate` the cache before the timeout
const cacheTimeoutSeconds = 10 * 60;

const getRpcClient = () => getClient(process.env.GRPC_SERVER!);

const getDefaultCacheClient = () => {
  const config = {
    bucketName: process.env.GCP_BUCKET!,
    clientEmail: process.env.GCP_CLIENT_EMAIL!,
    privateKey: process.env.GCP_PRIVATE_KEY!.split(String.raw`\n`).join("\n"),
  };
  return getCacheClient(getFunction, setFunction, config);
};

const lastEventNonceByAddrClient = (orchestratorAddress: string) =>
  lastEventNonceByAddr(getRpcClient())({ address: orchestratorAddress });

const lastValsetRequestsClient = () => lastValsetRequests(getRpcClient())({});

const getLastObservedEthNonceClient = async (client: any) => {
  const { nonce: nonceString } = await getLastObservedEthNonce(getRpcClient())(
    {},
  );
  return Number(nonceString);
};

const getLastObservedEthNonceClientCached = withCache(
  getLastObservedEthNonceClient,
  getDefaultCacheClient(),
  cacheTimeoutSeconds,
  false,
  "getLastObservedEthNonceClient",
);

const getDelegateKeyByEthClient = (ethAddress: string) =>
  getDelegateKeyByEth(getRpcClient())({
    eth_address: ethAddress,
  });

const getDelegateKeyByEths = async (
  validatorEthAddresses: string[],
): Promise<GetDelegateKeyByEthsResponse> => {
  const client = getRpcClient();
  const promises = validatorEthAddresses.map(async (ethAddress) => {
    const delegateKey = await getDelegateKeyByEthClient(ethAddress);
    return {
      [ethAddress]: {
        validatorAddress: delegateKey.validator_address,
        orchestratorAddress: delegateKey.orchestrator_address,
      },
    };
  });
  const results = await Promise.all(promises);
  return Object.assign({}, ...results);
};

const getEthValoperMap = async (): Promise<GetDelegateKeyByEthsResponse> => {
  const client = getRpcClient();
  const lastValset = await lastValsetRequestsClient();
  const validatorEthAddresses = lastValset.valsets[0].members.map(
    ({ ethereum_address: ethAddr }: { ethereum_address: string }) => ethAddr,
  );
  // sort it so (if we do cache) caching keys match when the validator set is the same
  const validatorEthAddressesSorted = [...validatorEthAddresses].sort((a, b) =>
    a.localeCompare(b),
  );
  return getDelegateKeyByEths(validatorEthAddressesSorted);
};

const getValoperNonceMap = async (): Promise<ValoperNonceMap> => {
  const client = getRpcClient();
  const ethValoperMap = await getEthValoperMap();
  const valoperNonceMap = await Promise.all(
    Object.entries(ethValoperMap).map(async ([ethAddress, valoperAddress]) => ({
      [valoperAddress.validatorAddress]: (
        await lastEventNonceByAddrClient(valoperAddress.orchestratorAddress)
      ).event_nonce,
    })),
  );
  return Object.assign({}, ...valoperNonceMap);
};

const getValoperNonceMapCached = withCache(
  getValoperNonceMap,
  getDefaultCacheClient(),
  cacheTimeoutSeconds,
  false,
  "getValoperNonceMap",
);

export type { GetDelegateKeyByEthsResponse, ValoperNonceMap };
export {
  cacheTimeoutSeconds,
  getRpcClient,
  getDefaultCacheClient,
  getLastObservedEthNonceClient,
  getLastObservedEthNonceClientCached,
  getDelegateKeyByEths,
  getEthValoperMap,
  getValoperNonceMap,
  getValoperNonceMapCached,
};
