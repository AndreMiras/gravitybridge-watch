import path from "path";
import { promisify } from "util";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const gravityQueryProto = "gravity/v1/query.proto";
const gravityProtoDir = "./src/proto";
const osmosisProtoDir = "./node_modules/@protobufs/";

interface Member {
  power: string;
  ethereum_address: string;
}

interface Valset {
  members: Member[];
  nonce: string;
  height: string;
  reward_amount: string;
  reward_token: string;
}

interface LastValsetRequestsResponse {
  valsets: Valset[];
}

interface lastEventNonceByAddrResponse {
  event_nonce: string;
}

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [gravityProtoDir, osmosisProtoDir],
};

const getClient = (url: string) => {
  const packageDefinition = protoLoader.loadSync(gravityQueryProto, options);
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  const gravityService = protoDescriptor.gravity as any;
  const client = new gravityService.v1.Query(
    url,
    grpc.credentials.createInsecure(),
  );
  return client;
};

const lastEventNonceByAddr = (
  client: any,
): ((params: { address: string }) => Promise<lastEventNonceByAddrResponse>) =>
  promisify(client.LastEventNonceByAddr).bind(client);

const getLastObservedEthNonce = (client: any) =>
  promisify(client.GetLastObservedEthNonce).bind(client);

const lastValsetRequests = (
  client: any,
): ((params: {}) => Promise<LastValsetRequestsResponse>) =>
  promisify(client.LastValsetRequests).bind(client);

const getDelegateKeyByEth = (client: any) =>
  promisify(client.GetDelegateKeyByEth).bind(client);

export type { LastValsetRequestsResponse, lastEventNonceByAddrResponse };
export {
  getClient,
  lastEventNonceByAddr,
  getLastObservedEthNonce,
  lastValsetRequests,
  getDelegateKeyByEth,
};
