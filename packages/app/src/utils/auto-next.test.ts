import { describe, expect, it } from "vitest";

import {
  AUTO_NEXT_DECISION_MESSAGE,
  AUTO_NEXT_DEFAULT_MESSAGE,
  findLatestAssistantMessageFromTimeline,
  parseAutoNextStatusFromText,
  resolveAutoNextFollowUp,
  resolveAutoNextMessage,
} from "./auto-next";

describe("findLatestAssistantMessageFromTimeline", () => {
  it("returns the latest assistant message text", () => {
    const result = findLatestAssistantMessageFromTimeline([
      { type: "user_message", text: "hello" },
      { type: "assistant_message", text: "first" },
      { type: "assistant_message", text: "second" },
    ]);

    expect(result).toBe("second");
  });

  it("skips missing or empty assistant message text", () => {
    const result = findLatestAssistantMessageFromTimeline([
      { type: "assistant_message", text: "   " },
      { type: "assistant_message" },
    ]);

    expect(result).toBeNull();
  });
});

describe("parseAutoNextStatusFromText", () => {
  it("parses the trailing status line", () => {
    expect(
      parseAutoNextStatusFromText(
        "\u6574\u7406\u5b8c\u6210\n\u72c0\u614b\uff1a \u7e7c\u7e8c",
      ),
    ).toBe("\u7e7c\u7e8c");
  });

  it("returns null when no supported status line exists", () => {
    expect(parseAutoNextStatusFromText("no status here")).toBeNull();
  });
});

describe("resolveAutoNextMessage", () => {
  it("returns the default message for continue", () => {
    expect(
      resolveAutoNextMessage({
        status: "\u7e7c\u7e8c",
        autoDecisionEnabled: false,
        defaultMessage: AUTO_NEXT_DEFAULT_MESSAGE,
      }),
    ).toBe(AUTO_NEXT_DEFAULT_MESSAGE);
  });

  it("returns the decision message only when auto decision is enabled", () => {
    expect(
      resolveAutoNextMessage({
        status: "\u6289\u64c7",
        autoDecisionEnabled: true,
        defaultMessage: AUTO_NEXT_DEFAULT_MESSAGE,
      }),
    ).toBe(AUTO_NEXT_DECISION_MESSAGE);
    expect(
      resolveAutoNextMessage({
        status: "\u6289\u64c7",
        autoDecisionEnabled: false,
        defaultMessage: AUTO_NEXT_DEFAULT_MESSAGE,
      }),
    ).toBeNull();
  });

  it("returns null for finished or manual states", () => {
    expect(
      resolveAutoNextMessage({
        status: "\u5b8c\u6210",
        autoDecisionEnabled: true,
        defaultMessage: AUTO_NEXT_DEFAULT_MESSAGE,
      }),
    ).toBeNull();
    expect(
      resolveAutoNextMessage({
        status: "\u9700\u624b\u52d5",
        autoDecisionEnabled: true,
        defaultMessage: AUTO_NEXT_DEFAULT_MESSAGE,
      }),
    ).toBeNull();
  });
});

describe("resolveAutoNextFollowUp", () => {
  it("prefers the canonical timeline over the stream text", () => {
    const result = resolveAutoNextFollowUp({
      streamAssistantText: "\u72c0\u614b\uff1a \u5b8c\u6210",
      timelineItems: [
        {
          type: "assistant_message",
          text: "\u5df2\u5206\u6790\n\u72c0\u614b\uff1a \u7e7c\u7e8c",
        },
      ],
      autoDecisionEnabled: false,
      defaultMessage: AUTO_NEXT_DEFAULT_MESSAGE,
    });

    expect(result).toBe(AUTO_NEXT_DEFAULT_MESSAGE);
  });

  it("returns the decision message when the timeline requests a choice", () => {
    const result = resolveAutoNextFollowUp({
      timelineItems: [
        {
          type: "assistant_message",
          text: "\u8acb\u6311\u4e00\u500b\n\u72c0\u614b\uff1a \u6289\u64c7",
        },
      ],
      autoDecisionEnabled: true,
      defaultMessage: AUTO_NEXT_DEFAULT_MESSAGE,
    });

    expect(result).toBe(AUTO_NEXT_DECISION_MESSAGE);
  });
});
