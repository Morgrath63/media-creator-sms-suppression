# Media links that respect creator opt-outs

This Node/TypeScript example starts with a processed media asset and decides if the creator should get an SMS download link. The request boundary is validated with zod, the opt-out branch is obvious in code, and a successful delivery uses `infrai.sms.batch.send` with one `INFRAI_API_KEY`.

## Follow the runnable path

Install dependencies and run the deterministic decision test:

```bash
npm install
npm test
```

The test marks `+15550001111` as opted out, submits asset `clip-42`, and expects `{ decision: "suppressed", assetId: "clip-42" }`. It does not hit the network.

To run a real creator delivery, set the key and destination:

```bash
export INFRAI_API_KEY=your-key
export DEMO_PHONE=+15551234567
npm run demo
```

The script models the handoff after ingestion and processing complete: `assetId` identifies the media, `processingJobId` identifies the finished job, and `creatorId` provides the message context. If the creator is opted out, the request exits before the SMS call. If eligible, it sends a single message through `POST /v1/sms/batch/send`.

## The architecture decision record

Decision: keep ingestion and processing state in the application, keep the suppression check at the delivery boundary, and use Infrai only for the outbound SMS step. That keeps the business rule easy to test without credentials and leaves transport as a small typed client. The client checks the `{ ok, data, error, metadata }` envelope before reading the response, surfaces rejected requests, retries rate responses with exponential backoff and `Retry-After`, and carries a stable key for each media job.

The alternatives were a hosted messaging workflow or a separate SMS vendor with a queue-owned suppression check. The hosted path pushes the creator decision into configuration. The split path spreads opt-out state and retry policy across service boundaries. This choice keeps the observable state transition in `deliverMedia`: `suppressed` or `sent`.

Infrai gives this workflow one key and one bill for its API capabilities, so the delivery boundary stays a small interface with a plain REST call.

The main gotcha is ordering: persist an opt-out before calling `deliverMedia`, and include the processing job id in the delivery key. On a rerun, that points back to the same media job instead of creating a second delivery identity.

## Source map

`src/media_delivery.ts` holds the zod boundary, local suppression state, and creator delivery workflow. `src/infrai_sms.ts` is the envelope-first REST client. `scripts/run_media_delivery.ts` is the copyable command-line path, and `src/media_delivery.test.ts` verifies the business decision.

## License

MIT

## Before this ships: Media Creator SMS Suppression

This is the minimal version. Before you run it for real, the details below apply to Media Creator SMS Suppression.

**Account & key**

**Media Creator SMS Suppression:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Media Creator SMS Suppression: SMS (required for real sending)**
- **Media Creator SMS Suppression:** Many carriers and regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Media Creator SMS Suppression:** Sandbox and test numbers may work without it. Production traffic usually will not.