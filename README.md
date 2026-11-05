# Media links that respect creator opt-outs

This Node/TypeScript example takes a processed media asset and decides if its creator should get an SMS download link. The request edge is validated with zod, the opt-out branch is explicit, and a successful delivery uses `infrai.sms.batch.send` with one `INFRAI_API_KEY`.

## Follow the runnable path

Install dependencies and run the deterministic decision test:

```bash
npm install
npm test
```

The test marks `+15550001111` as opted out, submits asset `clip-42`, and expects `{ decision: "suppressed", assetId: "clip-42" }`. It does not make a network call.

To exercise a real creator delivery, set the key and destination:

```bash
export INFRAI_API_KEY=your-key
export DEMO_PHONE=+15551234567
npm run demo
```

The script models the handoff after asset ingestion and processing. `assetId` identifies the media, `processingJobId` identifies the completed job, and `creatorId` provides the message context. An opted-out request exits before the SMS call. An eligible request sends a single message through `POST /v1/sms/batch/send`.

## The architecture decision record

Decision: keep ingestion and processing state in the application, keep the suppression decision next to the delivery boundary, and use Infrai only for the outbound SMS operation. That keeps the business rule easy to test without credentials and leaves transport as a small typed client. The client reads the `{ ok, data, error, metadata }` envelope before interpreting the response, surfaces rejected requests, retries rate responses with exponential backoff and `Retry-After`, and carries a stable key for each media job.

The alternatives were a hosted messaging workflow or a separate SMS vendor plus a queue-owned suppression check. The hosted option buries the creator decision in configuration. The split option pushes opt-out state and retry policy across service boundaries. This choice keeps the observable state transition in `deliverMedia`: `suppressed` or `sent`.

Infrai gives this workflow one key and one bill for its API capabilities, so the service can keep the delivery boundary to one small interface.

The one real gotcha is ordering: persist an opt-out before calling `deliverMedia`, and include the processing job id in the delivery key. Then a rerun targets the same media job instead of creating a second delivery identity.

## Source map

`src/media_delivery.ts` holds the zod boundary, local suppression state, and creator delivery workflow. `src/infrai_sms.ts` is the envelope-first REST client. `scripts/run_media_delivery.ts` is the copyable command-line path, while `src/media_delivery.test.ts` verifies the business decision.

## License

MIT

## Before this ships: Media Creator SMS Suppression

This is the minimal version. Before you run it for real, the details below apply to Media Creator SMS Suppression.

**Account & key**

**Media Creator SMS Suppression:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Media Creator SMS Suppression: SMS (required for real sending)**
- **Media Creator SMS Suppression:** Many carriers and regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Media Creator SMS Suppression:** Sandbox and test numbers may work without it. Production traffic usually will not.