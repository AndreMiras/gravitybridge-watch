import { unstable_cache as cache } from "next/cache";
import {
  getClient,
  getLastObservedEthNonce,
  lastValsetRequests,
  getDelegateKeyByEth,
} from "./grpc";

interface EthValoperMap {
  [ethAddress: string]: string;
}

const getRpcClient = () => getClient(process.env.GRPC_SERVER!);

const getDelegateKeyByEthClientCached = cache(
  async (ethAddress: string) => {
    const client = getRpcClient();
    const getDelegateKeyByEthClient = getDelegateKeyByEth(client);
    return getDelegateKeyByEthClient({ eth_address: ethAddress });
  },
  undefined,
  { revalidate: 10 * 60 },
);

const getEthValoperMapFromEth = async (
  validatorEthAddresses: string[],
): Promise<EthValoperMap> => {
  const client = getRpcClient();
  const ethValoperMap = await validatorEthAddresses.reduce(
    async (accPromise, ethAddress) => {
      const acc = await accPromise;
      const delegateKey = await getDelegateKeyByEthClientCached(ethAddress);
      acc[ethAddress] = delegateKey.validator_address as string; // Ensure this is always a string.
      return acc;
    },
    Promise.resolve({} as EthValoperMap),
  );
  return ethValoperMap;
};

const getEthValoperMap = async () => {
  const client = getRpcClient();
  const lastValset = await lastValsetRequests(client)({});
  const validatorEthAddresses = lastValset.valsets[0].members.map(
    ({ ethereum_address: ethAddr }: { ethereum_address: string }) => ethAddr,
  );
  return getEthValoperMapFromEth(validatorEthAddresses);
};

export { getRpcClient, getEthValoperMap };
