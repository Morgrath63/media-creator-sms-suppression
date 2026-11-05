import { z } from "zod";
import { infrai } from "./infrai_sms.js";

export const mediaRequest = z.object({
  assetId: z.string().min(1),
  creatorId: z.string().min(1),
  phone: z.string().min(7),
  processingJobId: z.string().min(1),
  downloadUrl: z.string().url(),
  optedOut: z.boolean().default(false),
});

export type MediaRequest = z.infer<typeof mediaRequest>;
export type DeliveryResult = { decision: "sent" | "suppressed"; assetId: string; messageId?: unknown };

const suppressedPhones = new Set<string>();

export function recordOptOut(phone: string): void {
  suppressedPhones.add(phone);
}

export function chooseDelivery(input: MediaRequest): "sent" | "suppressed" {
  return input.optedOut || suppressedPhones.has(input.phone) ? "suppressed" : "sent";
}

export async function deliverMedia(input: unknown): Promise<DeliveryResult> {
  const media = mediaRequest.parse(input);
  if (chooseDelivery(media) === "suppressed") return { decision: "suppressed", assetId: media.assetId };

  const result = await infrai.sms.batch.send([{
    to: media.phone,
    text: `Creator ${media.creatorId}: asset ${media.assetId} is ready at ${media.downloadUrl}`,
  }], `media-${media.processingJobId}-${media.assetId}`);
  return { decision: "sent", assetId: media.assetId, messageId: result };
}
