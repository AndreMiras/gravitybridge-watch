import { NextApiRequest, NextApiResponse } from "next";
import {
  register,
  updateNonceGauge,
  updateLastObservedEthNonceGauge,
} from "../../lib/prometheus-metrics";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Update the gauges with the latest data
  await updateLastObservedEthNonceGauge();
  await updateNonceGauge();
  res.setHeader("Content-Type", register.contentType);
  res.send(await register.metrics());
};

export default handler;
