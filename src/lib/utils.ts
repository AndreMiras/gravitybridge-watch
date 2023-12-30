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

interface ArrayToObjectItem {
  [key: string]: any;
}

interface CosmosValidatorDescription {
  moniker: string;
  identity: string;
  website: string;
  details: string;
}

interface CosmosValidatorCommissionRate {
  rate: string;
  max_rate: string;
  max_change_rate: string;
}

interface CosmosValidatorCommission {
  commission_rates: CosmosValidatorCommissionRate;
  update_time: string;
}

interface CosmosValidatorPubKey {
  "@type": string;
  key: string;
}

interface CosmosValidator {
  operator_address: string;
  consensus_pubkey: CosmosValidatorPubKey;
  jailed: boolean;
  status: number;
  tokens: string;
  delegator_shares: string;
  description: CosmosValidatorDescription;
  unbonding_height: string;
  unbonding_time: string;
  commission: CosmosValidatorCommission;
  min_self_delegation: string;
}

interface ValidatorInfoBase {
  validatorAddress: string;
  orchestratorAddress: string;
}

interface GetDelegateKeyByEthsResponse {
  [ethAddress: string]: ValidatorInfoBase;
}

interface ValidatorInfo extends ValidatorInfoBase {
  moniker: string;
  nonce: number;
}

interface ValidatorInfoMap {
  [valoperAddress: string]: ValidatorInfo;
}

// to avoid cache miss during ISR build, `forceUpdate` the cache before the timeout
const cacheTimeoutSeconds = 10 * 60;

const handleHttpError = (response: Response) => {
  if (!response.ok) {
    const errorMessage = `${response.status} ${response.statusText}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

const getRpcClient = () => getClient(process.env.GRPC_SERVER!);

const getDefaultCacheClient = () => {
  const config = {
    bucketName: process.env.GCP_BUCKET!,
    clientEmail: process.env.GCP_CLIENT_EMAIL!,
    privateKey: process.env.GCP_PRIVATE_KEY!.split(String.raw`\n`).join("\n"),
  };
  return getCacheClient(getFunction, setFunction, config);
};

const lastEventNonceByAddrClient = async (orchestratorAddress: string) =>
  (await lastEventNonceByAddr(getRpcClient())({ address: orchestratorAddress }))
    .event_nonce;

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

/**
 * Fetches validators metadata (moniker, consensus pubkey, operator address...).
 */
const fetchValidators = async (restUrl: string, paginationOffset = 0) => {
  const params = new URLSearchParams({
    "pagination.offset": paginationOffset.toString(),
  });
  const url = `${restUrl}/cosmos/staking/v1beta1/validators?${params.toString()}`;
  const response = await fetch(url);
  handleHttpError(response);
  const { validators } = await response.json();
  return validators;
};

const fetchAllValidators = async (
  restUrl: string,
): Promise<CosmosValidator[]> => {
  let allValidators: CosmosValidator[] = [];
  let validators = [];
  do {
    validators = await fetchValidators(restUrl, allValidators.length);
    allValidators = [...allValidators, ...validators];
  } while (validators.length > 0);
  return allValidators;
};

const fetchAllValidatorsCached = withCache(
  fetchAllValidators,
  getDefaultCacheClient(),
  cacheTimeoutSeconds,
  false,
  "fetchAllValidators",
);

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

/**
 * Converts an array of objects into an object using a specified key from each array item.
 * Each array item becomes a property of the resulting object, with the property key being
 * the value from the specified keyField in the item, and the value being the item itself minus the keyField.
 *
 * @param array - The array to convert.
 * @param keyField - The field within each array item to use as the key for the resulting object.
 * @returns An object with keys derived from the keyField of each array item and values as the corresponding items.
 */
const convertArrayToObject = (
  array: ArrayToObjectItem[],
  keyField: string,
): Record<string, ArrayToObjectItem> =>
  array.reduce(
    (acc: Record<string, ArrayToObjectItem>, item: ArrayToObjectItem) => {
      const key = item[keyField];
      const { [keyField]: _, ...rest } = item;
      acc[key] = rest;
      return acc;
    },
    {},
  );

const getValidatorInfoMap = async (): Promise<ValidatorInfoMap> => {
  const client = getRpcClient();
  const ethValoperMap = await getEthValoperMap();
  const allValidators = await fetchAllValidatorsCached(
    process.env.REST_SERVER!,
  );
  const validatorsByAddress = convertArrayToObject(
    allValidators,
    "operator_address",
  );
  const validatorInfoMap = await Promise.all(
    Object.entries(ethValoperMap).map(async ([ethAddress, validatorInfo]) => {
      const moniker =
        await validatorsByAddress[validatorInfo.validatorAddress].description
          .moniker;
      const nonce = await lastEventNonceByAddrClient(
        validatorInfo.orchestratorAddress,
      );
      return {
        [validatorInfo.validatorAddress]: {
          ...validatorInfo,
          ...{ nonce, moniker },
        },
      };
    }),
  );
  return Object.assign({}, ...validatorInfoMap);
};

const getValidatorInfoMapCached = withCache(
  getValidatorInfoMap,
  getDefaultCacheClient(),
  cacheTimeoutSeconds,
  false,
  "getValidatorInfoMap",
);

export type { GetDelegateKeyByEthsResponse, ValidatorInfoMap };
export {
  cacheTimeoutSeconds,
  getRpcClient,
  getDefaultCacheClient,
  getLastObservedEthNonceClient,
  getLastObservedEthNonceClientCached,
  getDelegateKeyByEths,
  getEthValoperMap,
  getValidatorInfoMap,
  getValidatorInfoMapCached,
};
