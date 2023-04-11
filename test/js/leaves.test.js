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
  describe("deselectCurrent", () => {
    test("removes selected class from leaves and labels", () => {
      // Set up document body with selected leaves and labels
      document.body.innerHTML =
        "<div><svg>" +
        '  <path class="selected" />' +
        '  <text class="selected">label</label> />' +
        "</svg></div>";

      Leaf.deselectCurrent();
      expect(
        document.getElementsByClassName(Leaf.selectedClass).length
      ).toEqual(0);
    });

    test("updates window location", () => {
      window.location.replace("#lenape");
      Leaf.setCurrentLeaf();
      expect(window.location.hash).toEqual(""); // does not include #
    });
  });

  test("select by tag sets highlight class on leaves and labels", () => {
    // patch in test tag list
    Leaf.tags = {
      battles: "Battles",
    };
    document.body.innerHTML =
      "<div><svg>" +
      '  <path class="access battles" />' +
      '  <path class="food disease" />' +
      '  <path class="disease battles" />' +
      '  <path class="battles" />' +
      '  <text class="access battles">label</text> />' +
      '  <text class="food access">label</text> />' +
      "</svg></div>" +
      "<div id='current-tag'><span/></div>";
    Leaf.setCurrentTag("battles");
    // expect 3 paths and one label to be highlighted
    expect(document.getElementsByClassName(Leaf.highlightClass).length).toEqual(
      4
    );
  });

  describe("setCurrentLeaf", () => {
    beforeEach(() => {
      fetch.resetMocks();

      // reset document location, since some tests update it
      history.replaceState(null, "", "http://localhost/");

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
        "<div id='current-tag'><span/></div>" +
        '<div id="leaf-details">' +
        "  <article/>" +
        "</div>";
    });

    test("deselects other leaves, selects both leaf path and label", () => {
      let targetLeaf = document.querySelector("path[data-id=munsee]");

      Leaf.setCurrentLeaf({ target: targetLeaf });
      let selected = document.getElementsByClassName(Leaf.selectedClass);

      // expect path and text to be selected
      expect(selected.length).toEqual(2);
    });

    test("treats click on tspan as click on parent text element", () => {
      let targetTspan = document.querySelector("text[data-id=munsee] tspan");
      Leaf.setCurrentLeaf({ target: targetTspan });
      // expect path and text to be selected
      expect(
        document.getElementsByClassName(Leaf.selectedClass).length
      ).toEqual(2);
    });

    test("updates window location", () => {
      let targetLeaf = document.querySelector("path[data-id=munsee]");
      Leaf.setCurrentLeaf({ target: targetLeaf });
      expect(window.location.hash).toEqual("#munsee");
    });

    test("fetches content for leaf details", () => {
      let targetLeaf = document.querySelector("path[data-id=munsee]");
      Leaf.setCurrentLeaf({ target: targetLeaf });
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(targetLeaf.dataset.url);
    });

    // not currently testing success logic (update content in panel)
    // or error on fetch (currently not handled...)

    test("sets leaf detail panel to active", () => {
      let targetLeaf = document.querySelector("path[data-id=munsee]");
      Leaf.setCurrentLeaf({ target: targetLeaf });
      const panel = document.querySelector("#leaf-details");
      expect(panel.parentElement.classList.contains("show-details")).toEqual(
        true
      );
    });
  });

  describe("updateSelection", () => {
    const mockLeafSelect = jest.fn();

    beforeEach(() => {
      jest.spyOn(Leaf, "setCurrentLeaf").mockImplementation(mockLeafSelect);
      document.body.innerHTML =
        "<div><svg>" +
        '  <path class="food disease" data-id="munsee" data-url="/leaves/munsee/" />' +
        '  <text class="food access" data-id="munsee" data-url="/leaves/munsee/"><tspan>munsee</tspan></text>' +
        "</svg></div>" +
        '<div id="leaf-details">' +
        "  <article/>" +
        "</div>";
    });

    test("does nothing if no hash is set", () => {
      window.location.replace("");
      Leaf.updateSelection();
      expect(mockLeafSelect.mock.calls).toHaveLength(0);
    });

    test("does nothing if no hash is set but id is invalid", () => {
      window.location.replace("#bogus");
      Leaf.updateSelection();
      // expect no elements to be highlighted
      expect(
        document.getElementsByClassName(Leaf.selectedClass).length
      ).toEqual(0);
    });

    test("selects leaf if hash is set to valid leaf id", () => {
      window.location.replace("#munsee");
      Leaf.updateSelection();
      let targetLeaf = document.querySelector("path[data-id=munsee]");
      // target leaf should have selected class
      expect(targetLeaf.classList).toContain(Leaf.selectedClass);
    });
  });

  describe("targetLeafURL", () => {
    test("gets data-url attribute from target element", () => {
      // Set up document body with selected leaves and labels
      document.body.innerHTML =
        "<div><svg>" + '  <path data-url="/leaves/munsee/" />' + "</svg></div>";

      let url = Leaf.targetLeafURL(document.querySelector("path"));
      expect(url).toEqual("/leaves/munsee/");
    });

    test("handles nested tspan element within text ", () => {
      document.body.innerHTML =
        "<div><svg>" +
        '  <text data-url="/leaves/munsee/" ><tspan>Munsee</tspan></text>' +
        "</svg></div>";

      let url = Leaf.targetLeafURL(document.querySelector("tspan"));
      expect(url).toEqual("/leaves/munsee/");
    });
  });

  describe("highlightLeaf", () => {
    test("sets hover class on corresponding path and text elements", () => {
      document.body.innerHTML =
        "<div><svg>" +
        '  <path class="food disease" data-id="munsee" data-url="/leaves/munsee/" />' +
        '  <text class="food access" data-id="munsee" data-url="/leaves/munsee/"><tspan>munsee</tspan></text>' +
        "</svg>" +
        "</div>";

      let path = document.querySelector("path");
      Leaf.highlightLeaf({ target: path });
      expect(path.classList).toContain("hover");
      expect(document.querySelector("text").classList).toContain("hover");
    });
  });

  describe("unhighlightLeaf", () => {
    test("removes hover class on corresponding path and text elements", () => {
      document.body.innerHTML =
        "<div><svg>" +
        '  <path class="food disease hover" data-id="munsee" data-url="/leaves/munsee/" />' +
        '  <text class="food access hover" data-id="munsee" data-url="/leaves/munsee/"><tspan>munsee</tspan></text>' +
        "</svg>" +
        "</div>";

      let path = document.querySelector("path");
      Leaf.unhighlightLeaf({ target: path });
      expect(document.getElementsByClassName("hover").length).toEqual(0);
    });
  });
});
