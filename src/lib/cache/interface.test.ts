import { vi } from "vitest";
import type { CacheClient } from "./interface";
import { getCacheKey, CacheMissError, getClient, withCache } from "./interface";

describe("getCacheKey", () => {
  it("generates key with function name and args", () => {
    const key = getCacheKey("myFunction", ["arg1", "arg2"]);
    expect(key).toBe('cache-myFunction-["arg1","arg2"]');
  });

  it("generates key for empty args", () => {
    const key = getCacheKey("noArgs", []);
    expect(key).toBe("cache-noArgs-[]");
  });

  it("generates key for complex args", () => {
    const key = getCacheKey("complex", [{ foo: "bar" }, 123, true]);
    expect(key).toBe('cache-complex-[{"foo":"bar"},123,true]');
  });

  it("hashes key when total length exceeds 1024 characters", () => {
    const longArg = "x".repeat(1100);
    const key = getCacheKey("func", [longArg]);

    // Key should be hashed, not contain the raw long string
    expect(key.length).toBeLessThan(1024);
    expect(key).toMatch(/^cache-func-[a-f0-9]{64}$/);
  });

  it("does not hash key at exactly 1024 characters", () => {
    // Calculate exact arg length needed to hit 1024 total
    // Format: cache-{funcName}-{jsonArgs}
    const prefix = "cache-test-";
    const targetLength = 1024;
    // We need JSON.stringify(args) to result in exactly 1024 - prefix.length
    const argLength = targetLength - prefix.length - 4; // -4 for [""] wrapper
    const exactArg = "a".repeat(argLength);

    const key = getCacheKey("test", [exactArg]);
    // At exactly 1024, should NOT hash (condition is > 1024)
    expect(key).toContain(exactArg);
  });
});

describe("CacheMissError", () => {
  it("creates error with correct name", () => {
    const error = new CacheMissError("test message");
    expect(error.name).toBe("CacheMissError");
  });

  it("creates error with message", () => {
    const error = new CacheMissError("cache miss for key xyz");
    expect(error.message).toBe("cache miss for key xyz");
  });

  it("is instanceof Error", () => {
    const error = new CacheMissError("test");
    expect(error).toBeInstanceOf(Error);
  });

  it("is instanceof CacheMissError", () => {
    const error = new CacheMissError("test");
    expect(error).toBeInstanceOf(CacheMissError);
  });
});

describe("getClient", () => {
  it("creates client with set method that calls setImpl", async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined);
    const mockGet = vi.fn();
    const config = { bucket: "test" };

    const client = getClient(mockGet, mockSet, config);
    await client.set("key", "value", 300);

    expect(mockSet).toHaveBeenCalledWith("key", "value", config, 300);
  });

  it("creates client with get method that calls getImpl", async () => {
    const mockSet = vi.fn();
    const mockGet = vi.fn().mockResolvedValue({ data: "cached" });
    const config = { bucket: "test" };

    const client = getClient(mockGet, mockSet, config);
    const result = await client.get("key");

    expect(mockGet).toHaveBeenCalledWith("key", config);
    expect(result).toEqual({ data: "cached" });
  });

  it("passes config to both get and set implementations", async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined);
    const mockGet = vi.fn().mockResolvedValue("data");
    const config = { bucket: "my-bucket", region: "us-east-1" };

    const client = getClient(mockGet, mockSet, config);
    await client.get("k");
    await client.set("k", "v");

    expect(mockGet).toHaveBeenCalledWith("k", config);
    expect(mockSet).toHaveBeenCalledWith("k", "v", config, undefined);
  });
});

describe("withCache", () => {
  let mockCacheClient: CacheClient;

  beforeEach(() => {
    mockCacheClient = {
      get: vi.fn(),
      set: vi.fn().mockResolvedValue(undefined),
    } as unknown as CacheClient;
  });

  it("returns cached value on cache hit", async () => {
    vi.mocked(mockCacheClient.get).mockResolvedValue("cached result");
    const originalFn = vi.fn().mockResolvedValue("fresh result");

    const cachedFn = withCache(originalFn, mockCacheClient, 300);
    const result = await cachedFn("arg1");

    expect(result).toBe("cached result");
    expect(originalFn).not.toHaveBeenCalled();
  });

  it("calls original function on cache miss", async () => {
    vi.mocked(mockCacheClient.get).mockRejectedValue(
      new CacheMissError("miss"),
    );
    const originalFn = vi.fn().mockResolvedValue("fresh result");

    const cachedFn = withCache(originalFn, mockCacheClient, 300);
    const result = await cachedFn("arg1");

    expect(result).toBe("fresh result");
    expect(originalFn).toHaveBeenCalledWith("arg1");
  });

  it("stores result in cache after miss", async () => {
    vi.mocked(mockCacheClient.get).mockRejectedValue(
      new CacheMissError("miss"),
    );
    const originalFn = vi.fn().mockResolvedValue("fresh result");

    const cachedFn = withCache(originalFn, mockCacheClient, 300);
    await cachedFn("arg1");

    expect(mockCacheClient.set).toHaveBeenCalledWith(
      expect.stringContaining("cache-"),
      "fresh result",
      300,
    );
  });

  it("bypasses cache when forceUpdate is true", async () => {
    vi.mocked(mockCacheClient.get).mockResolvedValue("stale cached");
    const originalFn = vi.fn().mockResolvedValue("fresh result");

    const cachedFn = withCache(originalFn, mockCacheClient, 300, true);
    const result = await cachedFn("arg1");

    expect(result).toBe("fresh result");
    expect(mockCacheClient.get).not.toHaveBeenCalled();
    expect(originalFn).toHaveBeenCalled();
  });

  it("updates cache when forceUpdate is true", async () => {
    const originalFn = vi.fn().mockResolvedValue("new value");

    const cachedFn = withCache(originalFn, mockCacheClient, 600, true);
    await cachedFn();

    expect(mockCacheClient.set).toHaveBeenCalledWith(
      expect.any(String),
      "new value",
      600,
    );
  });

  it("uses custom cache prefix when provided", async () => {
    vi.mocked(mockCacheClient.get).mockRejectedValue(
      new CacheMissError("miss"),
    );
    const originalFn = vi.fn().mockResolvedValue("result");

    const cachedFn = withCache(
      originalFn,
      mockCacheClient,
      300,
      false,
      "customPrefix",
    );
    await cachedFn("arg");

    expect(mockCacheClient.set).toHaveBeenCalledWith(
      expect.stringContaining("cache-customPrefix-"),
      "result",
      300,
    );
  });

  it("rethrows non-CacheMissError errors", async () => {
    const networkError = new Error("Network failure");
    vi.mocked(mockCacheClient.get).mockRejectedValue(networkError);
    const originalFn = vi.fn();

    const cachedFn = withCache(originalFn, mockCacheClient, 300);

    await expect(cachedFn("arg")).rejects.toThrow("Network failure");
    expect(originalFn).not.toHaveBeenCalled();
  });

  it("passes multiple arguments to original function", async () => {
    vi.mocked(mockCacheClient.get).mockRejectedValue(
      new CacheMissError("miss"),
    );
    const originalFn = vi.fn().mockResolvedValue("result");

    const cachedFn = withCache(originalFn, mockCacheClient, 300);
    await cachedFn("arg1", "arg2", { option: true });

    expect(originalFn).toHaveBeenCalledWith("arg1", "arg2", { option: true });
  });
});
