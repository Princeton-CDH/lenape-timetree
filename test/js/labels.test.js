import {
  splitLabel,
  labelRadius,
  pixelsPerChar,
  labelLineHeight,
} from "labels";

describe("splitLabel", () => {
  test("splits label into words", () => {
    const words = splitLabel("munsee sisters farm");
    expect(words).toEqual(["munsee", "sisters", "farm"]);
  });
  test("handles missing label", () => {
    expect(splitLabel(null)).toEqual(["no title"]);
    expect(splitLabel(undefined)).toEqual(["no title"]);
  });
});

describe("labelRadius", () => {
  test("calculated based on line height for short words", () => {
    // one word only, should use line height
    expect(labelRadius("munsee")).toEqual(labelLineHeight);
    // two words
    expect(labelRadius("munsee sisters")).toEqual(2 * labelLineHeight);
  });

  test("calculated based on word length for long words", () => {
    const word = "Shawukukhkung";
    expect(labelRadius(word)).toEqual(word.length * pixelsPerChar);
  });
});
