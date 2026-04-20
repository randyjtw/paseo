export const AUTO_NEXT_DEFAULT_MESSAGE = "\u4e0b\u4e00\u6b65";
export const AUTO_NEXT_DECISION_MESSAGE = "\u9078\u64c7\u6700\u4f73\u65b9\u6848\u5f80\u4e0b\u505a";

const AUTO_NEXT_STATUS_PATTERN =
  /^\u72c0\u614b\uff1a\s*(\u7e7c\u7e8c|\u6289\u64c7|\u5b8c\u6210|\u9700\u624b\u52d5)\s*$/u;

export type AutoNextStatus = "\u7e7c\u7e8c" | "\u6289\u64c7" | "\u5b8c\u6210" | "\u9700\u624b\u52d5";

export type AutoNextTimelineItem = {
  type: string;
  text?: string;
};

export function findLatestAssistantMessageFromTimeline(
  items: readonly AutoNextTimelineItem[] | null | undefined,
): string | null {
  if (!items || items.length === 0) {
    return null;
  }

  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (item?.type !== "assistant_message" || typeof item.text !== "string") {
      continue;
    }
    const text = item.text.trim();
    if (text.length > 0) {
      return text;
    }
  }

  return null;
}

export function parseAutoNextStatusFromText(
  text: string | null | undefined,
): AutoNextStatus | null {
  if (!text) {
    return null;
  }

  const lines = text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return null;
  }

  const match = lines[lines.length - 1]?.match(AUTO_NEXT_STATUS_PATTERN);
  if (!match) {
    return null;
  }

  return match[1] as AutoNextStatus;
}

export function resolveAutoNextMessage(input: {
  status: AutoNextStatus | null;
  autoDecisionEnabled: boolean;
  defaultMessage: string;
}): string | null {
  const { status, autoDecisionEnabled, defaultMessage } = input;

  if (status === null) {
    return null;
  }

  if (status === "\u5b8c\u6210" || status === "\u9700\u624b\u52d5") {
    return null;
  }

  if (status === "\u6289\u64c7") {
    return autoDecisionEnabled ? AUTO_NEXT_DECISION_MESSAGE : null;
  }

  return defaultMessage;
}

export function resolveAutoNextFollowUp(input: {
  streamAssistantText?: string | null;
  timelineItems?: readonly AutoNextTimelineItem[] | null;
  autoDecisionEnabled: boolean;
  defaultMessage: string;
}): string | null {
  const assistantText =
    findLatestAssistantMessageFromTimeline(input.timelineItems) ?? input.streamAssistantText ?? null;
  const status = parseAutoNextStatusFromText(assistantText);

  return resolveAutoNextMessage({
    status,
    autoDecisionEnabled: input.autoDecisionEnabled,
    defaultMessage: input.defaultMessage,
  });
}
