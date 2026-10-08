import mongoose from "mongoose";

function redactUri(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.password) url.password = "****";
    if (url.username) url.username = "****";
    return url.toString();
  } catch {
    return uri.replace(/\/\/[^/]*@/, "//****:****@");
  }
}

export async function connectDB(uri: string): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  // eslint-disable-next-line no-console
  console.log(`[db] connected -> ${redactUri(uri)}`);
}
