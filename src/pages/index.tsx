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

const greenDelta = 3;
const orangeDelta = 10;

const isGreaterOrSlightlySmaller = (delta: number) => delta < greenDelta;

const isModeratelySmaller = (delta: number) =>
  delta >= greenDelta && delta < orangeDelta;

const getNonceColor = (lastValue: number, value: number): string => {
  const delta = lastValue - value;
  return isGreaterOrSlightlySmaller(delta) || value >= lastValue
    ? "text-green-500"
    : isModeratelySmaller(delta)
      ? "text-orange-500"
      : "text-red-500";
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
              :{" "}
              <span className={getNonceColor(nonce, info.nonce)}>
                {info.nonce}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </main>
);

export default Home;
