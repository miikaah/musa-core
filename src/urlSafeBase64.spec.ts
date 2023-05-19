import UrlSafeBase64 from "./urlSafeBase64";

describe("UrlSafeBase64", () => {
  const pangramPlain = "The quick brown fox jumps over the lazy dog";
  const pangramBase64 = "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw";

  describe("encode", () => {
    it("should encode to base64", () => {
      expect(UrlSafeBase64.encode(pangramPlain)).toBe(pangramBase64);
    });
  });

  describe("decode", () => {
    it("should decode from base64", () => {
      expect(UrlSafeBase64.decode(pangramBase64)).toBe(pangramPlain);
    });
  });
});
