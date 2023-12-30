import type { NextApiRequest, NextApiResponse } from "next";
import { withCache } from "../../lib/cache/interface";
import {
  ValidatorInfoMap,
  getValidatorInfoMap,
  getDefaultCacheClient,
  cacheTimeoutSeconds,
} from "../../lib/utils";

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
