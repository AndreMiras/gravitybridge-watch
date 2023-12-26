import {
  ValoperNonceMap,
  getLastObservedEthNonceClientCached,
  getValoperNonceMapCached,
} from "../lib/utils";

export const getStaticProps = async () => {
  const nonce = await getLastObservedEthNonceClientCached();
  const valoperNonceMap = await getValoperNonceMapCached();
  const lastUpdate = new Date().toISOString();
  return {
    props: {
      nonce,
      valoperNonceMap,
      lastUpdate,
    },
    revalidate: 10 * 60,
  };
};

const Home = ({
  nonce,
  valoperNonceMap,
  lastUpdate,
}: {
  nonce: number;
  valoperNonceMap: ValoperNonceMap;
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
          {Object.entries(valoperNonceMap).map(([valoper, nonce]) => (
            <li key={valoper}>
              {valoper}: {nonce}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </main>
);

export default Home;
