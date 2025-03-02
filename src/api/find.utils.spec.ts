import { describe, it } from "vitest";
import { albumWithFilesFixture } from "../../fixtures/album.fixture";
import { audioWithMetadataFixtures } from "../../fixtures/audio.fixture";
import { byTrackAsc, getAlbums, normalizeSearchString } from "./find.utils";

const adversarialChars = ".,;:{}()<>/\\|[]_-~^¨*`´“\"”'∞§≈±™˙ﬁ…–ıª√’˛‘¸›®ƒ‹•≤¶©";

describe("normalizeSearchString", () => {
  it("removes adversarial characters", () => {
    expect(normalizeSearchString("Guns 'n' Roses")).toBe("guns n roses");
    expect(normalizeSearchString(`foo${adversarialChars}`)).toBe("foo");
    expect(normalizeSearchString(`foo${adversarialChars}foo`)).toBe("foofoo");
    expect(normalizeSearchString(`${adversarialChars}foo`)).toBe("foo");
    expect(normalizeSearchString(adversarialChars)).toBe("");
  });

  it("replaces with e", () => {
    expect(normalizeSearchString("eéÉ€e")).toBe("eeeee");
  });

  it("replaces with a", () => {
    expect(normalizeSearchString("aäÄæa")).toBe("aaaaa");
  });

  it("replaces with o", () => {
    expect(normalizeSearchString("oöÖåÅøœΩo")).toBe("ooooooooo");
  });

  it("replaces with u", () => {
    expect(normalizeSearchString("uüÜu")).toBe("uuuu");
  });

  it("replaces with c", () => {
    expect(normalizeSearchString("cçÇc")).toBe("cccc");
  });

  it("replaces with at", () => {
    expect(normalizeSearchString("at@†at")).toBe("atatatat");
  });

  it("replaces with and", () => {
    expect(normalizeSearchString("and&and")).toBe("andandand");
  });

  it("replaces with s", () => {
    expect(normalizeSearchString("s$ßs")).toBe("ssss");
  });

  it("replaces with l", () => {
    expect(normalizeSearchString("l£l")).toBe("lll");
  });

  it("replaces with m", () => {
    expect(normalizeSearchString("mµm")).toBe("mmm");
  });

  it("replaces with p", () => {
    expect(normalizeSearchString("p%πp")).toBe("pppp");
  });

  it("replaces with is", () => {
    expect(normalizeSearchString("is=is")).toBe("isisis");
  });

  it("removes ? mark except from the end", () => {
    expect(normalizeSearchString("What? is this?")).toBe("what is this?");
  });

  it("removes ! mark except from the end", () => {
    expect(normalizeSearchString("What! is this!")).toBe("what is this!");
  });
});

describe("byTrackAsc", () => {
  it("returns search results in ascending order", () => {
    const audios = audioWithMetadataFixtures.sort(byTrackAsc);

    expect(audios[0].track).toBe("01");
    expect(audios[1].track).toBe("02");
    expect(audios[2].track).toBe("03");
    expect(audios[3].track).toBe("2.01");
  });
});

describe("getAlbums", () => {
  it("return album files in ascending order", () => {
    const albums = getAlbums([albumWithFilesFixture]);

    expect(albums[0].files[0].track).toBe("01");
    expect(albums[0].files[1].track).toBe("02");
    expect(albums[0].files[2].track).toBe("03");
    expect(albums[0].files[3].track).toBe("2.01");
  });
});
