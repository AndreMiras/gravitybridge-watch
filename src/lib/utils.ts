import {
  getClient,
  lastEventNonceByAddr,
  getLastObservedEthNonce,
  lastValsetRequests,
  getDelegateKeyByEth,
} from "./grpc";

interface EthValoperMap {
  [ethAddress: string]: {
    validatorAddress: string;
    orchestratorAddress: string;
  };
}

interface ValoperNonceMap {
  [valoperAddress: string]: number;
}

const revalidateSecond = 10 * 60;

const getRpcClient = () => getClient(process.env.GRPC_SERVER!);

const lastEventNonceByAddrClient = (orchestratorAddress: string) =>
  lastEventNonceByAddr(getRpcClient())({ address: orchestratorAddress });

const getLastObservedEthNonceClient = async (client: any) => {
  const { nonce: nonceString } = await getLastObservedEthNonce(getRpcClient())(
    {},
  );
  return Number(nonceString);
};

const getDelegateKeyByEthClient = (ethAddress: string) =>
  getDelegateKeyByEth(getRpcClient())({
    eth_address: ethAddress,
  });

const getEthValoperMapFromEth = async (
  validatorEthAddresses: string[],
): Promise<EthValoperMap> => {
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

const getEthValoperMap = async (): Promise<EthValoperMap> => {
  const client = getRpcClient();
  const lastValset = await lastValsetRequests(client)({});
  const validatorEthAddresses = lastValset.valsets[0].members.map(
    ({ ethereum_address: ethAddr }: { ethereum_address: string }) => ethAddr,
  );
  return getEthValoperMapFromEth(validatorEthAddresses);
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

export type { ValoperNonceMap };
export {
  getRpcClient,
  getLastObservedEthNonceClient,
  getEthValoperMap,
  getValoperNonceMap,
};
