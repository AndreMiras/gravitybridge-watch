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
  <main className="flex min-h-screen flex-col items-center justify-between p-24">
    <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
      <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
        Gravity Bridge Watcher
      </div>
    </div>
    <div>
      <p>Last Update: {new Date(lastUpdate).toLocaleString()}</p>
      <p>Last Observed Eth Nonce: {nonce}</p>
      <div>
        Valoper: orchestrator nonce:
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
