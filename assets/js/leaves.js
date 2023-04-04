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

  static setCurrentLeaf(event) {
    // Are we removing the leaf?
    if (event == undefined) {
      // remove hash
      let urlNoHash = window.location.pathname + window.location.search;
      history.replaceState(null, "", urlNoHash);
    } else {
      // get the actual leaf target from DOM
      let target = Leaf.getLeafTarget(event.target);
      // get leaf ID
      let leafID = target.dataset.id;
      // update URL to reflect the currently selected leaf;
      // replace the location & state to avoid polluting browser history
      window.location.replace(`#${leafID}`);
      history.replaceState(null, "", `#${leafID}`);
    }
    // regardless, update selection
    Leaf.updateSelection();
  }

  static setCurrentTag(tag) {
    // if no tag set, simply replace URL without tag param
    if (tag == undefined) {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.hash
      );
    } else {
      // set URL to URL of self, with tag updated
      let url = new URL(window.location.href);
      url.searchParams.set("tag", tag);
      history.replaceState(null, "", url.toString());
    }
    // regardless, update selection
    Leaf.updateSelection();
  }

  static getLeafTarget(target) {
    // if the target is the tspan within text label, use parent element
    if (target.tagName == "tspan") {
      target = target.parentElement;
    }
    return target;
  }

  static targetLeafURL(target) {
    // both text and path have data-url set
    return Leaf.getLeafTarget(target).dataset.url;
  }

  static updateSelection() {
    // get selection information from URL
    let url = new URL(window.location.href);
    let tagID = url.searchParams.get("tag");
    let leafHash = url.hash;

    // deselect any current
    let selected = document.getElementsByClassName(Leaf.selectedClass);
    // convert to array rather than iterating, since htmlcollection is live
    // and changes as updated
    Array.from(selected).forEach((item) => {
      item.classList.remove(Leaf.selectedClass);
    });

    // if tag set, select those
    if (tagID) {
      let leaves = document.getElementsByClassName(tagID);
      for (let item of leaves) {
        item.classList.add(Leaf.selectedClass);
      }
    }

    // if hash set, select leaf
    if (leafHash && leafHash.startsWith("#")) {
      let leafID = leafHash.slice(1);
      let leafTarget = document.querySelector(`path[data-id=${leafID}]`);
      // if hash id corresponds to a leaf, select it
      if (leafTarget != undefined) {
        // actually make selection
        Leaf.setLeafLabelClass(leafTarget.dataset.url, Leaf.selectedClass);
        // open panel
        Leaf.openLeafDetails(leafTarget);
      }
    }
  }

  static openLeafDetails(leafTarget) {
    // load leaf details and display in the panel
    fetch(leafTarget.dataset.url)
      .then((response) => response.text())
      .then((html) => {
        let parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        // Get the article content and insert into panel
        const article = doc.querySelector("article");
        const panel = document.querySelector("#leaf-details");
        panel.querySelector("article").replaceWith(article);
        // make sure panel is active
        panel.parentElement.classList.add("show-details");
        panel.parentElement.classList.remove("closed");
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

  static closeLeafDetails() {
    const panel = document.querySelector("#leaf-details");
    panel.parentElement.classList.remove("show-details");
    panel.parentElement.classList.add("closed");
    Leaf.setCurrentLeaf(undefined);
    Leaf.closeTag();
  }

  static closeTag() {
    // unset current tag and then call updateSelection
    Leaf.setCurrentTag(undefined);
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
