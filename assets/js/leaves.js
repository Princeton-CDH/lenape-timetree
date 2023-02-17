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
  }

  static selectByTag(tag) {
    // select all leaves with the specified tag
    Leaf.deselectAll();
    let leaves = document.getElementsByClassName(tag);
    for (let item of leaves) {
      item.classList.add(Leaf.selectedClass);
    }
  }

  static selectLeaf(event) {
    // event handler to select leaf when leaf or label is clicked/tapped
    Leaf.deselectAll();

    // visually highlight selected leaf in the tree
    let target = event.target;
    // if the target is the tspan within text label, use parent element
    if (target.tagName == "tspan") {
      target = target.parentElement;
    }
    target.classList.add(Leaf.selectedClass);
    // ensure both leaf and label are selected
    let leafURL = target.getAttribute("data-url");
    let leafAndLabel = document.querySelectorAll(`[data-url="${leafURL}"]`);
    for (let item of leafAndLabel) {
      item.classList.add(Leaf.selectedClass);
    }

    // load leaf details and display in the panel
    fetch(leafURL)
      .then((response) => response.text())
      .then((html) => {
        let parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        // Get the article content and insert into panel
        const article = doc.querySelector("article");
        panel.querySelector("article").replaceWith(article);
        // make sure panel is active
        panel.parentElement.classList.add("show-panel");
      });
  }
}

// function to draw with the points identified
function drawLeaf() {
  let x = 0;
  // x = starting x

  // generate a random height somewhere between our min and max
  let leafHeight = randomNumBetween(leafSize.maxHeight, leafSize.minHeight);
  let midLeafHeight = leafHeight / 2;

  // collect leaf points as we go for the two sides of the leaf in tandem
  // left side starts at the stem; append new points after
  let leftPoints = [
    [x, 0], // top (stem)
  ];
  // right side ends up at the stem; insert new points before
  let rightPoints = [[x, 0]];

  // width is always consistent, but it may be shifted sidewise as much as 34px in either direction
  let leafWidth = leafSize.width;

  // middle of the leaf can be shifted +/-
  let midXShift = plusOrMinus(leafSize.maxMidShift);
  // left middle is center of leaf + half leaf width + random shift
  let leftMid = x - leafSize.width / 2 + midXShift;
  let rightMid = leftMid + leafWidth;

  // if leaf is long enough, do two mid points
  if (leafHeight > 50) {
    // two mid points around thirds
    let midY1 = leafHeight * 0.33 - randomNumBetween(7);
    let midY2 = leafHeight * 0.66 - randomNumBetween(7);

    // should we adjust the upper width?
    if (cointoss()) {
      // yes, adjust the first
      // should we adjust the left or the right?
      if (cointoss()) {
        // left
        // shrink width by adjustment on the leftside
        let adjustment = randomNumBetween(7);
        leftPoints.push([leftMid + adjustment, midY1]);
      } else {
        leftPoints.push([leftMid, midY1]);
      }

      if (cointoss()) {
        // right
        let adjustment = randomNumBetween(7);
        rightPoints.unshift([rightMid - adjustment, midY1]);
      } else {
        rightPoints.unshift([rightMid, midY1]);
      }
    } else {
      // push first width without adjusting
      leftPoints.push([leftMid, midY1]);
      rightPoints.unshift([rightMid, midY1]);

      // adjust the second; should we adjust the left or the right?
      let adjustment = randomNumBetween(5);
      if (cointoss()) {
        // left
        // shrink width by adjustment on the leftside
        leftPoints.push([leftMid + adjustment, midY2]);
      } else {
        leftPoints.push([leftMid, midY2]);
      }
      if (cointoss()) {
        // right
        rightPoints.unshift([rightMid - adjustment, midY2]);
      } else {
        rightPoints.unshift([rightMid, midY2]);
      }
    }
  } else {
    // for shorter leaves, only one set of midpoints
    let midY = leafHeight / 2;
    leftPoints.push([leftMid, midY]);
    rightPoints.unshift([rightMid, midY]);
  }

  // tail of the leaf does not need to be centered
  // start with midpoint of shifted middle, then shift slightly more
  let tailX = leftMid + leafSize.width / 2 + plusOrMinus(leafSize.maxTipShift);
  //let tailX = x + randomNumBetween(leafSize.maxTipShift, - leafSize.maxTipShift);
  // may need some limits to limit shift based on midXShift

  // how pointy is the tail? add points relative to the tail
  // at 80% of the height, leaf should be on average 60% of the width; adjust randomly
  let nearTailWidth = leafSize.width * 0.6 - randomNumBetween(7);
  // let nearTailX = tailX - nearTailWidth; // randomNumBetween(nearTailWidth, - nearTailWidth);
  // unadajusted tailx
  let nearTailX = leftMid + leafSize.width / 2 - nearTailWidth / 2; // randomNumBetween(nearTailWidth, -
  let nearTailY = leafHeight * 0.8;
  if (cointoss()) {
    leftPoints.push([nearTailX, nearTailY]);
  } else {
    // if (cointoss()) {
    rightPoints.unshift([nearTailX + nearTailWidth, nearTailY]);
    // }
  }

  // tail only needs to be added once
  leftPoints.push([tailX, leafHeight]);

  let leafPoints = leftPoints.concat(rightPoints);

  let curve = d3.line().curve(d3.curveNatural)(leafPoints);
  return curve;
}

export { cointoss, drawLeaf, leafSize, plusOrMinus, randomNumBetween, Leaf };
