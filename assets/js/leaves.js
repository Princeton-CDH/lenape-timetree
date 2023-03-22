// logic to generate a path for drawing leaves

import { line, curveNatural, curveBumpY } from "d3-shape";

// combine into d3 object for convenience
const d3 = {
  line,
  curveNatural,
  curveBumpY,
};

// configuration for leaf sizes
// sizes are scaled from 40px width design:
//   min height and width: 40px; max height 100px;
//   max mid shift 34 (34px at most, 17 either way); max tip shift 12

let leafSize = {
  minHeight: 30,
  maxHeight: 75,
  width: 30,
  maxMidShift: 25,
  maxTipShift: 9,
};

// get a random number between a min and max
function randomNumBetween(max, min = 0) {
  // scale random value between 0 and 1 to desired scale, start at min value
  return Math.random() * (max - min) + min;
}

function plusOrMinus(x) {
  return randomNumBetween(x, -x);
}

function cointoss() {
  // randomly return true or false;
  // based on https://stackoverflow.com/a/60322877/9706217
  return Math.random() < 0.5;
}

class Leaf {
  // constant for selection classname
  static selectedClass = "select";

  static deselectAll() {
    // deselect any leaf or leaf label that is currently highlighted
    let selected = document.getElementsByClassName(Leaf.selectedClass);
    // convert to array rather than iterating, since htmlcollection is live
    // and changes as updated
    Array.from(selected).forEach((item) => {
      item.classList.remove(Leaf.selectedClass);
    });

    // change url location hash to indicate no leaf is selected
    // needs to be non-empty to avoid page reload
    window.location.replace("#");
    history.replaceState(null, "", window.hash);
  }

  static selectByTag(tag) {
    // select all leaves with the specified tag
    Leaf.deselectAll();
    let leaves = document.getElementsByClassName(tag);
    for (let item of leaves) {
      item.classList.add(Leaf.selectedClass);
    }

    // encode URL to reflect tag
    let slug = encodeURIComponent(tag);
    window.location.replace(`#?tag=${slug}`);
    history.replaceState(null, "", window.hash);
  }

  static targetLeafURL(target) {
    // if the target is the tspan within text label, use parent element
    if (target.tagName == "tspan") {
      target = target.parentElement;
    }
    // both text and path have data-url set
    return target.getAttribute("data-url");
  }

  static selectLeaf(event) {
    // event handler to select leaf when leaf or label is clicked/tapped
    Leaf.deselectAll();

    // visually highlight selected leaf in the tree
    let leafURL = Leaf.targetLeafURL(event.target);
    // ensure both leaf and label are selected
    Leaf.setLeafLabelClass(leafURL, Leaf.selectedClass);

    // update URL to reflect the currently selected leaf;
    // replace the location & state to avoid polluting browser history
    window.location.replace(`#${event.target.getAttribute("data-id")}`);
    history.replaceState(null, "", window.hash);

    // load leaf details and display in the panel
    fetch(leafURL)
      .then((response) => response.text())
      .then((html) => {
        let parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        // Get the article content and insert into panel
        const article = doc.querySelector("article");
        const panel = document.querySelector("#panel");
        panel.querySelector("article").replaceWith(article);
        // make sure panel is active
        panel.parentElement.classList.add("show-panel");
      });
  }

  static highlightLeaf(event) {
    // visually highlight both leaf & label when corresponding one is hovered
    Leaf.setLeafLabelClass(Leaf.targetLeafURL(event.target), "hover");
  }

  static unhighlightLeaf(event) {
    // turn off visual highlight for both when hover ends
    Leaf.setLeafLabelClass(Leaf.targetLeafURL(event.target), "hover", false);
  }

  static setLeafLabelClass(leafURL, classname, add = true) {
    let leafAndLabel = document.querySelectorAll(`[data-url="${leafURL}"]`);
    for (let item of leafAndLabel) {
      if (add) {
        item.classList.add(classname);
      } else {
        item.classList.remove(classname);
      }
    }
  }

  static selectLeafByHash() {
    if (location.hash.startsWith("#") & !location.hash.startsWith("#?")) {
      let leaf = document.querySelector(
        `path[data-id=${location.hash.slice(1)}]`
      );
      // if hash id corresponds to a leaf, select it
      if (leaf != undefined) {
        // simulate click event, sending leaf as event target
        Leaf.selectLeaf({ target: leaf });
      }
    }
  }

  static selectLeavesByTag() {
    // If the page is loaded with a tag link, select those leaves
    if (location.hash.startsWith("#?tag=")) {
      let params = new URL(location.href.replace("#?", "?")).searchParams;
      let tag = params.get("tag");
      Leaf.selectByTag(tag);
    }
  }

  static closeLeafDetails() {
    const panel = document.querySelector("#panel");
    Leaf.deselectAll();
    panel.parentElement.classList.remove("show-panel");
    panel.parentElement.classList.add("closed");
  }
}

class LeafPath {
  x = 0;
  static curve = d3.line().curve(d3.curveNatural);
  // stem = [];
  leftPoints = [];
  rightPoints = [];
  // tip = [];

  constructor() {
    this.height = this.getHeight();
    this.halfHeight = this.height / 2;

    // center of leaf should be at 0,0
    // middle of the leaf can be shifted +/-
    let midXShift = plusOrMinus(leafSize.maxMidShift);
    // left middle is center of leaf + half leaf width + random shift
    this.leftMid = this.x - leafSize.width / 2 + midXShift;
    let rightMid = this.leftMid + leafSize.width;

    this.tip = this.getTip();

    // can we just add points to both sides and then sort by Y ?

    // generate points for left and right sides programmatically from
    // top to bottom (stem to tip) with some randomness

    // collect leaf points as we go for the two sides of the leaf in tandem
    // left side starts at the stem; append new points after
    this.leftPoints = [
      this.stem, // top (stem)
    ];
    // right side ends up at the stem; insert new points before
    this.rightPoints = [this.stem];

    // if leaf is long enough, do two mid points
    if (this.height > 50) {
      // two mid points around thirds
      let midY1 = -this.height / 2 + this.height * 0.33 - randomNumBetween(7);
      let midY2 = -this.height / 2 + this.height * 0.66 - randomNumBetween(7);

      // should we adjust the upper width?
      if (cointoss()) {
        // yes, adjust the first
        // should we adjust the left or the right?
        if (cointoss()) {
          // left
          // shrink width by adjustment on the leftside
          let adjustment = randomNumBetween(7);
          this.leftPoints.push([this.leftMid + adjustment, midY1]);
        } else {
          this.leftPoints.push([this.leftMid, midY1]);
        }

        if (cointoss()) {
          // right
          let adjustment = randomNumBetween(7);
          this.rightPoints.unshift([this.rightMid - adjustment, midY1]);
        } else {
          this.rightPoints.unshift([this.rightMid, midY1]);
        }
      } else {
        // push first width without adjusting
        this.leftPoints.push([this.leftMid, midY1]);
        this.rightPoints.unshift([this.rightMid, midY1]);

        // adjust the second; should we adjust the left or the right?
        let adjustment = randomNumBetween(5);
        if (cointoss()) {
          // left
          // shrink width by adjustment on the leftside
          this.leftPoints.push([this.leftMid + adjustment, midY2]);
        } else {
          this.leftPoints.push([this.leftMid, midY2]);
        }
        if (cointoss()) {
          // right
          this.rightPoints.unshift([this.rightMid - adjustment, midY2]);
        } else {
          this.rightPoints.unshift([this.rightMid, midY2]);
        }
      }
    } else {
      // for shorter leaves, only one set of midpoints
      // Y-axis midpoint is 0
      this.leftPoints.push([this.leftMid, 0]);
      this.rightPoints.unshift([rightMid, 0]);
    }

    // how pointy is the tail? add points relative to the tail
    // at 80% of the height, leaf should be on average 60% of the width; adjust randomly
    let nearTailWidth = leafSize.width * 0.6 - randomNumBetween(7);
    // let nearTailX = tailX - nearTailWidth; // randomNumBetween(nearTailWidth, - nearTailWidth);
    // unadajusted tailx
    let nearTailX = this.leftMid + leafSize.width / 2 - nearTailWidth / 2; // randomNumBetween(nearTailWidth, -
    // let nearTailY = this.height * 0.8 - this.height/2;
    let nearTailY = this.tip[1] - this.height * 0.2;
    if (cointoss()) {
      this.leftPoints.push([nearTailX, nearTailY]);
    } else {
      if (cointoss()) {
        this.rightPoints.unshift([nearTailX + nearTailWidth, nearTailY]);
      }
    }

    // tail only needs to be added once
    this.leftPoints.push(this.tip); //[tailX, leafHeight]);

    this.rightPoints.unshift(this.tip); //[tailX, leafHeight]);
  }

  get stem() {
    // stem is half the leaf height above 0
    return [this.x, -this.halfHeight];
  }

  getHeight() {
    // generate a random height somewhere between our min and max
    return randomNumBetween(leafSize.maxHeight, leafSize.minHeight);
  }

  getTip() {
    // tail of the leaf does not need to be centered
    // start with midpoint of shifted middle, then shift slightly more
    let tailX =
      this.leftMid + leafSize.width / 2 + plusOrMinus(leafSize.maxTipShift);
    return [tailX, this.halfHeight];
  }

  get rightMid() {
    return this.leftMid + leafSize.width;
  }

  get points() {
    return [
      this.stem,
      [this.leftMid, 0],
      this.tip,
      [this.rightMid, 0],
      this.stem,
    ];
  }

  // get leftPoints() {
  //   return [this.stem, [this.leftMid, 0], this.tip];
  // }

  // get rightPoints() {
  //   return [this.tip, [this.rightMid, 0], this.stem];
  // }

  get path() {
    // combine two curves so the tip doesn't get too curved
    return LeafPath.curve(this.leftPoints) + LeafPath.curve(this.rightPoints);
    // NOTE: two paths makes the outlines visibly disconnected...
    // return LeafPath.curve(this.points);
  }
}

export { cointoss, leafSize, plusOrMinus, randomNumBetween, Leaf, LeafPath };
