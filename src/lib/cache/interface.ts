/**
 * Define a generic cache interface using types for set and get functions.
 */
import { createHash } from "crypto";

type CacheConfig = Record<string, any>;
type GetFunction = (key: string, config: CacheConfig) => Promise<any>;
type SetFunction = (
  key: string,
  value: any,
  config: CacheConfig,
  timeout?: number,
) => Promise<void>;
type CacheClient = {
  set: (key: string, value: any, timeout?: number) => Promise<void>;
  get: (key: string) => Promise<any>;
};

class CacheMissError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CacheMissError";
  }
}

/**
 * Creates a cache client with specified get and set implementations.
 * @param getImpl A function to retrieve data from the cache.
 * @param setImpl A function to save data to the cache.
 * @param config Configuration for the cache client.
 * @returns {CacheClient} An object with set and get methods to interact with the cache.
 */
const getClient = (
  getImpl: GetFunction,
  setImpl: SetFunction,
  config: CacheConfig,
): CacheClient => ({
  set: (key, value, timeout) => setImpl(key, value, config, timeout),
  get: (key) => getImpl(key, config),
});

const getCacheKey = (func: Function, args: any[]): string => {
  let keyArgs = JSON.stringify(args);
  if (`cache-${func.name}-${keyArgs}`.length > 1024) {
    keyArgs = createHash("sha256").update(keyArgs).digest("hex");
  }
  return `cache-${func.name}-${keyArgs}`;
};

/**
 * Enhances a function with caching capabilities.
 * @param func The original function to be enhanced with caching.
 * @param cacheClient An instance of CacheClient to manage cache operations.
 * @param cacheTimeoutSeconds The time in seconds after which cache entries will expire.
 * @param forceUpdate Flag to force the update of cache even if the data is already cached.
 * @returns A function that returns cached data if available and valid, otherwise calls the original function.
 */
const withCache =
  <T>(
    func: (...args: any[]) => Promise<T>,
    cacheClient: CacheClient,
    cacheTimeoutSeconds: number,
    forceUpdate: boolean = false,
  ): ((...args: any[]) => Promise<T>) =>
  async (...args: any[]): Promise<T> => {
    const cacheKey = getCacheKey(func, args);
    if (!forceUpdate) {
      try {
        return await cacheClient.get(cacheKey);
      } catch (error) {
        if (!(error instanceof CacheMissError)) {
          throw error;
        }
      }
    }
    const result = await func(...args);
    await cacheClient.set(cacheKey, result, cacheTimeoutSeconds);
    return result;
  };

export type { CacheConfig, GetFunction, SetFunction, CacheClient };
export { CacheMissError, getClient, withCache };
