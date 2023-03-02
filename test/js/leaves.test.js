import { enableFetchMocks } from "jest-fetch-mock";

import {
  leafSize,
  drawLeaf,
  Leaf,
  plusOrMinus,
  cointoss,
  randomNumBetween,
} from "leaves";

enableFetchMocks();

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

describe("Leaf", () => {
  describe("deselectAll", () => {
    test("removes selected class from leaves and labels", () => {
      // Set up document body with selected leaves and labels
      document.body.innerHTML =
        "<div><svg>" +
        '  <path class="selected" />' +
        '  <text class="selected">label</label> />' +
        "</svg></div>";

      Leaf.deselectAll();
      expect(
        document.getElementsByClassName(Leaf.selectedClass).length
      ).toEqual(0);
    });

    test("updates window location", () => {
      window.location.replace("#lenape");
      Leaf.deselectAll();
      expect(window.location.hash).toEqual("#-");
    });
  });

  test("select by tag sets selected class on leaves and labels", () => {
    document.body.innerHTML =
      "<div><svg>" +
      '  <path class="access battles" />' +
      '  <path class="food disease" />' +
      '  <path class="disease battles" />' +
      '  <path class="battles" />' +
      '  <text class="access battles">label</text> />' +
      '  <text class="food access">label</text> />' +
      "</svg></div>";
    Leaf.selectByTag("battles");
    // expect 3 paths and one label to be selected
    expect(document.getElementsByClassName(Leaf.selectedClass).length).toEqual(
      4
    );
  });

  describe("selectLeaf", () => {
    beforeEach(() => {
      fetch.resetMocks();

      document.body.innerHTML =
        "<div><svg>" +
        '  <path class="selected access battles" />' +
        '  <path class="food disease" data-id="munsee" data-url="/leaves/munsee/" />' +
        '  <path class="selected disease battles" />' +
        '  <path class="battles" />' +
        '  <text class="access battles">label</label> />' +
        '  <text class="food access">label</label> />' +
        '  <text class="food access" data-id="munsee" data-url="/leaves/munsee/"><tspan>munsee</tspan></text>' +
        "</svg></div>" +
        '<div id="panel">' +
        "  <article/>" +
        "</div>";
    });

    test("deselects other leaves, selects both leaf path and label", () => {
      let targetLeaf = document.querySelector("path[data-id=munsee]");
      Leaf.selectLeaf({ target: targetLeaf });
      // expect path and text to be selected
      expect(
        document.getElementsByClassName(Leaf.selectedClass).length
      ).toEqual(2);
    });

    test("treats click on tspan as click on parent text element", () => {
      let targetTspan = document.querySelector("text[data-id=munsee] tspan");
      Leaf.selectLeaf({ target: targetTspan });
      // expect path and text to be selected
      expect(
        document.getElementsByClassName(Leaf.selectedClass).length
      ).toEqual(2);
    });

    test("updates window location", () => {
      let targetLeaf = document.querySelector("path[data-id=munsee]");
      Leaf.selectLeaf({ target: targetLeaf });
      expect(window.location.hash).toEqual("#munsee");
    });

    test("fetches content for leaf details", () => {
      let targetLeaf = document.querySelector("path[data-id=munsee]");
      Leaf.selectLeaf({ target: targetLeaf });
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(targetLeaf.getAttribute("data-url"));
    });

    // not currently testing success logic (update content in panel)
    // or error on fetch (currently not handled...)

    test("sets leaf detail panel to active", () => {
      let targetLeaf = document.querySelector("path[data-id=munsee]");
      Leaf.selectLeaf({ target: targetLeaf });
      const panel = document.querySelector("#panel");
      expect(panel.parentElement.classList.contains("show-panel")).toEqual(
        true
      );
    });
  });

  describe("selectLeafByHash", () => {
    const mockLeafSelect = jest.fn();

    beforeEach(() => {
      jest.spyOn(Leaf, "selectLeaf").mockImplementation(mockLeafSelect);
      document.body.innerHTML =
        "<div><svg>" +
        '  <path class="food disease" data-id="munsee" data-url="/leaves/munsee/" />' +
        '  <text class="food access" data-id="munsee" data-url="/leaves/munsee/"><tspan>munsee</tspan></text>' +
        "</svg></div>" +
        '<div id="panel">' +
        "  <article/>" +
        "</div>";
    });

    test("does nothing if no hash is set", () => {
      window.location.replace("");
      Leaf.selectLeafByHash();
      expect(mockLeafSelect.mock.calls).toHaveLength(0);
    });

    test("does nothing if no hash is set but id is invalid", () => {
      window.location.replace("#bogus");
      Leaf.selectLeafByHash();
      expect(mockLeafSelect.mock.calls).toHaveLength(0);
    });

    test("selects leaf if hash is set to valid leaf id", () => {
      window.location.replace("#munsee");
      Leaf.selectLeafByHash();
      expect(mockLeafSelect.mock.calls).toHaveLength(1);
      let targetLeaf = document.querySelector("path[data-id=munsee]");
      // should be called with target leaf as argument
      expect(mockLeafSelect.mock.calls[0][0]).toEqual({ target: targetLeaf });
    });
  });
});
