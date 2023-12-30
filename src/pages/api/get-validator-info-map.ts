import type { NextApiRequest, NextApiResponse } from "next";
import { withCache } from "../../lib/cache/interface";
import {
  ValidatorInfoMap,
  getValidatorInfoMap,
  getDefaultCacheClient,
  cacheTimeoutSeconds,
} from "../../lib/utils";

// Most of the time 15 seconds is enough to rebuild the cache.
// This is a pro plan feature, hobby maxDuration is 10 seconds.
export const maxDuration = 60;

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ValidatorInfoMap>,
) => {
  const forceUpdate = req.query.forceUpdate === "true";
  const getValidatorInfoMapCached = withCache(
    getValidatorInfoMap,
    getDefaultCacheClient(),
    cacheTimeoutSeconds,
    forceUpdate,
    "getValidatorInfoMap",
  );
  const validatorInfoMap = await getValidatorInfoMapCached();
  res.status(200).json(validatorInfoMap);
};

export default handler;
