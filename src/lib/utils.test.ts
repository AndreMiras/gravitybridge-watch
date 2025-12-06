import { vi } from "vitest";

// Mock environment variables before importing utils
// vi.hoisted() runs before any imports are processed
vi.hoisted(() => {
  process.env.GCP_BUCKET = "test-bucket";
  process.env.GCP_CLIENT_EMAIL = "test@example.com";
  process.env.GCP_PRIVATE_KEY = "test-key";
  process.env.GRPC_SERVER = "localhost:9090";
  process.env.REST_SERVER = "http://localhost:1317";
});

import { convertArrayToObject, handleHttpError } from "./utils";

describe("convertArrayToObject", () => {
  it("converts array to object using specified key field", () => {
    const array = [
      { id: "a", name: "Alice" },
      { id: "b", name: "Bob" },
    ];
    const result = convertArrayToObject(array, "id");

    expect(result).toEqual({
      a: { name: "Alice" },
      b: { name: "Bob" },
    });
  });

  it("removes key field from resulting objects", () => {
    const array = [{ key: "test", value: 123, extra: "data" }];
    const result = convertArrayToObject(array, "key");

    expect(result.test).not.toHaveProperty("key");
    expect(result.test).toEqual({ value: 123, extra: "data" });
  });

  it("returns empty object for empty array", () => {
    const result = convertArrayToObject([], "id");
    expect(result).toEqual({});
  });

  it("handles single item array", () => {
    const array = [{ id: "only", data: "value" }];
    const result = convertArrayToObject(array, "id");

    expect(result).toEqual({
      only: { data: "value" },
    });
  });

  it("overwrites duplicate keys with last value", () => {
    const array = [
      { id: "dup", value: "first" },
      { id: "dup", value: "second" },
    ];
    const result = convertArrayToObject(array, "id");

    expect(result.dup.value).toBe("second");
  });

  it("handles nested objects", () => {
    const array = [{ id: "nested", data: { inner: { deep: true } } }];
    const result = convertArrayToObject(array, "id");

    expect(result.nested.data.inner.deep).toBe(true);
  });
});

describe("handleHttpError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not throw for ok response", () => {
    const response = { ok: true, status: 200, statusText: "OK" } as Response;
    expect(() => handleHttpError(response)).not.toThrow();
  });

  it("throws for 404 response", () => {
    const response = {
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response;
    expect(() => handleHttpError(response)).toThrow("404 Not Found");
  });

  it("throws for 500 response", () => {
    const response = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response;
    expect(() => handleHttpError(response)).toThrow(
      "500 Internal Server Error",
    );
  });

  it("throws for 401 response", () => {
    const response = {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response;
    expect(() => handleHttpError(response)).toThrow("401 Unauthorized");
  });

  it("logs error message to console", () => {
    const response = {
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    } as Response;
    expect(() => handleHttpError(response)).toThrow();
    expect(console.error).toHaveBeenCalledWith("503 Service Unavailable");
  });
});
