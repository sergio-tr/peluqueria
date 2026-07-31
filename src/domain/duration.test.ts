import { describe, expect, it } from "vitest";
import { suggestedDurationMinutes } from "./duration";

describe("suggestedDurationMinutes", () => {
  it("adds complexity and margin", () => {
    expect(
      suggestedDurationMinutes({
        baseMinutes: 45,
        complexity: "high",
        marginMinutes: 0,
      }),
    ).toBe(75);
  });

  it("prefers explicit extra minutes", () => {
    expect(
      suggestedDurationMinutes({
        baseMinutes: 60,
        complexity: "low",
        extraMinutes: 15,
      }),
    ).toBe(75);
  });
});
