import type { NextApiRequest, NextApiResponse } from "next";
import { withCache } from "../../lib/cache/interface";
import {
  ValoperNonceMap,
  getValoperNonceMap,
  getDefaultCacheClient,
  cacheTimeoutSeconds,
} from "../../lib/utils";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ValoperNonceMap>,
) => {
  const forceUpdate = req.query.forceUpdate === "true";
  const getValoperNonceMapCached = withCache(
    getValoperNonceMap,
    getDefaultCacheClient(),
    cacheTimeoutSeconds,
    forceUpdate,
    "getValoperNonceMap",
  );
  const valoperNonceMap = await getValoperNonceMapCached();
  res.status(200).json(valoperNonceMap);
};

export default handler;
