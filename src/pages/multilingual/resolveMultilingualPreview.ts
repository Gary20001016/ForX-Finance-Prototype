import type {
  Channel,
  LocalizedMessageContent,
  TranslationBatch,
  TranslationChannelContent,
  TranslationContentLayer,
  TranslationItem,
} from "../../domain/types";

const hasFlatContent = (content?: TranslationContentLayer) =>
  Boolean(content?.title || content?.summary || content?.body);

const hasChannelContent = (content?: TranslationChannelContent) =>
  Boolean(
    content?.web?.title ||
      content?.web?.summary ||
      content?.web?.body ||
      content?.push?.title ||
      content?.push?.body,
  );

const reviewedLayer = (item: TranslationItem): TranslationContentLayer => ({
  title: item.reviewedTitle,
  summary: item.reviewedSummary,
  body: item.reviewedBody,
});

const machineLayer = (item: TranslationItem): TranslationContentLayer => ({
  title: item.machineTitle,
  summary: item.machineSummary,
  body: item.machineBody,
});

export function resolveMultilingualPreview(
  batch: TranslationBatch,
  item: TranslationItem,
  fallbackContent?: LocalizedMessageContent,
  fallbackChannels: Channel[] = ["站内信", "Push"],
): { content?: LocalizedMessageContent; channels: Channel[] } {
  const channels = batch.channels?.length
    ? [...batch.channels]
    : [...fallbackChannels];

  if (item.status === "无结果") return { channels, content: undefined };

  const source = batch.sourceChannelContent || fallbackContent;
  const channelLayer = [
    item.approvedChannelOutput,
    item.humanChannelDraft,
    item.machineChannelOutput,
  ].find(hasChannelContent);
  const flatLayer = [
    item.approvedOutput,
    reviewedLayer(item),
    item.humanDraft,
    item.machineOutput,
    machineLayer(item),
  ].find(hasFlatContent);

  if (!channelLayer && !flatLayer) return { channels, content: undefined };

  const webLayer = channelLayer?.web;
  const pushLayer = channelLayer?.push;
  const content: LocalizedMessageContent = {
    sourceLocale: item.targetLocale,
    locales: [item.targetLocale],
    web: {
      title: webLayer?.title || flatLayer?.title || "",
      summary: webLayer?.summary || flatLayer?.summary || "",
      body: webLayer?.body || flatLayer?.body || "",
      riskCopy: webLayer?.riskCopy ?? source?.web.riskCopy,
      actionText: webLayer?.actionText ?? source?.web.actionText,
      targetUrl: webLayer?.targetUrl ?? source?.web.targetUrl,
    },
    push: {
      title: pushLayer?.title || flatLayer?.title || "",
      body: pushLayer?.body || flatLayer?.body || "",
      imageUrl: pushLayer?.imageUrl ?? source?.push.imageUrl,
      deepLink: pushLayer?.deepLink ?? source?.push.deepLink,
      platform: pushLayer?.platform || source?.push.platform || "全部设备",
      priority: pushLayer?.priority || source?.push.priority || "高",
    },
  };

  return { channels, content };
}
