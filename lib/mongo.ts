import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not configured");
const options = { appName: "watchtower-dashboard", maxPoolSize: 10 };
let client: MongoClient;
let clientPromise: Promise<MongoClient>;
const g = global as typeof globalThis & { _watchtowerMongo?: Promise<MongoClient> };
if (process.env.NODE_ENV === "development") {
  if (!g._watchtowerMongo) {
    client = new MongoClient(uri, options);
    g._watchtowerMongo = client.connect();
  }
  clientPromise = g._watchtowerMongo;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}
export default clientPromise;
export async function db() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DATABASE || "watchtower");
}
export function instanceId() { return process.env.WATCHTOWER_INSTANCE_ID || "primary"; }
