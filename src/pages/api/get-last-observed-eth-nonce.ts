import type { NextApiRequest, NextApiResponse } from "next";
import { getLastObservedEthNonceClientCached } from "../../lib/utils";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const lastObservedEthNonce = await getLastObservedEthNonceClientCached();
  res.status(200).json({ lastObservedEthNonce });
};

export default handler;
