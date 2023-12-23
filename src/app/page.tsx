import {
  getClient,
  getLastObservedEthNonce,
  lastValsetRequests,
} from "../lib/grpc";

const getRpcClient = () => getClient(process.env.GRPC_SERVER!);

const Home = async () => {
  const client = getRpcClient();
  const { nonce } = await getLastObservedEthNonce(client)({});
  const lastValset = await lastValsetRequests(client)({});
  const validatorEthAddresses = lastValset.valsets[0].members.map(
    ({ ethereum_address: ethAddr }: { ethereum_address: string }) => ethAddr,
  );
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          Gravity Bridge Watcher
        </div>
      </div>

      <div>
        <p>Last Observed Eth Nonce: {nonce}</p>
        <div>
          Last Validator Set:
          <ul>
            {validatorEthAddresses.map((address: string) => (
              <li key={address}>{address}</li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
};

export default Home;
