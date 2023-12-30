import {
  ValidatorInfoMap,
  getLastObservedEthNonceClientCached,
  getValidatorInfoMapCached,
} from "../lib/utils";

export const getStaticProps = async () => {
  const nonce = await getLastObservedEthNonceClientCached();
  const validatorInfoMap = await getValidatorInfoMapCached();
  const lastUpdate = new Date().toISOString();
  return {
    props: {
      nonce,
      validatorInfoMap,
      lastUpdate,
    },
    revalidate: 10 * 60,
  };
};

const Home = ({
  nonce,
  validatorInfoMap,
  lastUpdate,
}: {
  nonce: number;
  validatorInfoMap: ValidatorInfoMap;
  lastUpdate: string;
}) => (
  <main className="flex min-h-screen flex-col items-center justify-between p-10">
    <h1 className="pb-10 text-violet-700">
      Gravity Bridge Orchestrator Watcher
    </h1>
    <div>
      <p>Last Update: {new Date(lastUpdate).toLocaleString()}</p>
      <p>Last Observed Eth Nonce: {nonce}</p>
      <div className="pt-5">
        <h2 className="text-violet-500">Orchestrator nonce</h2>
        <ul className="font-mono">
          {Object.entries(validatorInfoMap).map(([valoper, info]) => (
            <li key={valoper}>
              <a
                href={`https://www.mintscan.io/gravity-bridge/validators/${valoper}`}
                className="hover:text-violet-700"
              >
                {info.moniker}
              </a>
              : {info.nonce}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </main>
);

export default Home;
