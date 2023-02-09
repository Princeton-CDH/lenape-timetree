import {
  leafSize,
  drawLeaf,
  plusOrMinus,
  cointoss,
  randomNumBetween,
} from "leaves";

describe("randomNumBetween", () => {
  test("returns number between 0 and specified max", () => {
    const result = randomNumBetween(10);
    expect(result).toBeLessThanOrEqual(10);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  test("returns number between specified max and specified min", () => {
    const result = randomNumBetween(5, -5);
    expect(result).toBeLessThanOrEqual(5);
    expect(result).toBeGreaterThanOrEqual(-5);

    const result2 = randomNumBetween(10, 5);
    expect(result2).toBeLessThanOrEqual(10);
    expect(result2).toBeGreaterThanOrEqual(5);
  });
});

describe("plusOrMinus", () => {
  test("returns number between positive and negative specified value", () => {
    expect(plusOrMinus(3)).toBeLessThanOrEqual(3);
    expect(plusOrMinus(10)).toBeGreaterThanOrEqual(-10);
  });
});

describe("cointoss", () => {
  test("returns true or false", () => {
    expect([true, false]).toContain(cointoss());
  });
});

describe("leafSize", () => {
  test("has expected properties", () => {
    expect(leafSize).toHaveProperty("width");
    expect(leafSize).toHaveProperty("minHeight");
    expect(leafSize).toHaveProperty("maxHeight");
  });
});
