import { describe, it } from "vitest";
import { normalizeSearchString } from "./find.utils";

describe("normalizeSearchString", () => {
  it("removes adversarial characters", () => {
    expect(normalizeSearchString("Guns 'n' Roses")).toBe("guns n roses");
  });

  it("replaces é with e", () => {
    expect(normalizeSearchString("eée")).toBe("eee");
  });

  it("replaces ä with a", () => {
    expect(normalizeSearchString("aäa")).toBe("aaa");
  });

  it("replaces ö and å with o", () => {
    expect(normalizeSearchString("oåöo")).toBe("oooo");
  });
});
