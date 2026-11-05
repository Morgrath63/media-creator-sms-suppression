import { deliverMedia } from "../src/media_delivery.js";

const phone = process.env.DEMO_PHONE;
if (!phone) throw new Error("DEMO_PHONE is required");

const result = await deliverMedia({
  assetId: process.env.DEMO_ASSET_ID ?? "clip-42",
  creatorId: process.env.DEMO_CREATOR_ID ?? "creator-7",
  phone,
  processingJobId: process.env.DEMO_JOB_ID ?? "job-42",
  downloadUrl: process.env.DEMO_DOWNLOAD_URL ?? "https://media.example/clip-42",
  optedOut: false,
});
console.log(JSON.stringify(result, null, 2));
