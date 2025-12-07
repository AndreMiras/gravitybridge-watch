import { Storage } from "@google-cloud/storage";
import {
  CacheConfig,
  GetFunction,
  SetFunction,
  CacheMissError,
} from "./interface";

const getBucket = (config: CacheConfig) => {
  const { projectId, clientEmail, privateKey, bucketName } = config;
  const storage = new Storage({
    projectId,
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
  const bucket = storage.bucket(bucketName);
  return bucket;
};

const getFunction: GetFunction = async (key, config) => {
  const bucket = getBucket(config);
  const file = bucket.file(key);
  try {
    const [metadata] = await file.getMetadata();
    const expirationDate = metadata.metadata?.expirationDate
      ? new Date(metadata.metadata?.expirationDate as string)
      : null;
    if (expirationDate && expirationDate < new Date()) {
      throw new CacheMissError(`Key expired: ${key}`);
    }
    const data = await file.download();
    return JSON.parse(data.toString());
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === 404) {
      throw new CacheMissError(`Key not found: ${key}`);
    }
    throw error;
  }
};

const setFunction: SetFunction = async (key, value, config, timeout) => {
  const bucket = getBucket(config);
  const file = bucket.file(key);
  const expirationDate = timeout
    ? new Date(Date.now() + timeout * 1000).toISOString()
    : null;
  await file.save(JSON.stringify(value), {
    metadata: { metadata: { expirationDate } },
  });
};

export { getFunction, setFunction };
