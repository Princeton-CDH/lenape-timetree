import { drawLeaf, plusOrMinus, cointoss, randomNumBetween } from "leaves";

describe("randomNumBetween", () => {
  test("returns number between 0 and specified max", () => {
    expect(randomNumBetween(10)).toBeLessThanOrEqual(10);
    expect(randomNumBetween(10)).toBeGreaterThanOrEqual(0);
  });

  test("returns number between specified max and specified min", () => {
    expect(randomNumBetween(5, -5)).toBeLessThanOrEqual(5);
    expect(randomNumBetween(5, -4)).toBeGreaterThanOrEqual(-5);
  });
});

describe("plusOrMinus", () => {
  test("returns number between positive and negative specified value", () => {
    expect(plusOrMinus(3)).toBeLessThanOrEqual(3);
    expect(plusOrMinus(10)).toBeGreaterThanOrEqual(-3);
  });
});

describe("cointoss", () => {
  test("returns true or false", () => {
    expect([true, false]).toContain(cointoss());
  });
});
