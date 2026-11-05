import assert from "node:assert/strict";
import { deliverMedia, recordOptOut } from "./media_delivery.js";

recordOptOut("+15550001111");
const result = await deliverMedia({
  assetId: "clip-42",
  creatorId: "creator-7",
  phone: "+15550001111",
  processingJobId: "job-42",
  downloadUrl: "https://media.example/clip-42",
});

assert.deepEqual(result, { decision: "suppressed", assetId: "clip-42" });
console.log("opt-out decision: passed");
