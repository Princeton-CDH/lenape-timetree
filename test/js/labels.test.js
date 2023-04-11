import {
  LeafLabel,
  splitLabel,
  labelRadius,
  pixelsPerChar,
  labelLineHeight,
} from "labels";

describe("LeafLabel", () => {
  const labelText = "munsee sisters farm";
  test("init sets label", () => {
    const label = new LeafLabel(labelText);
    expect(label.text).toEqual(labelText);
  });
  test("parts returns label split into words", () => {
    const label = new LeafLabel(labelText);
    expect(label.parts).toEqual(["munsee", "sisters", "farm"]);
  });
  test("parts handles missing label", () => {
    const label = new LeafLabel();
    expect(label.parts).toEqual(["no title"]);
  });
  test("calculates height based on parts and line height", () => {
    const label = new LeafLabel(labelText);
    expect(label.height).toEqual(label.parts.length * LeafLabel.lineHeight);
  });
  test("calculates width based on longest word", () => {
    const word = "Shawukukhkung";
    const label = new LeafLabel(word);
    expect(label.width).toEqual(word.length * LeafLabel.pixelsPerChar);
  });
  test("calculates radius based on line height for short words", () => {
    // one word only, should use line height
    const oneWordLabel = new LeafLabel("a");
    expect(oneWordLabel.radius).toEqual(LeafLabel.lineHeight / 2.0);
    // two words
    const twoWordLabel = new LeafLabel("a bc");
    expect(twoWordLabel.radius).toEqual((LeafLabel.lineHeight * 2) / 2.0);
  });
  test("calculates radius based on word length for long words", () => {
    const word = "Shawukukhkung";
    // expect(new LeafLabel(word).radius).toEqual(word.length * LeafLabel.pixelsPerChar / 2.0);
  });
});
