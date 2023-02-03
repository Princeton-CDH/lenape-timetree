// logic to generate a path for drawing leaves

import { line, curveNatural, curveBumpY } from "d3-shape";

// combine into d3 object for convenience
const d3 = {
  line,
  curveNatural,
  curveBumpY,
};

let leafSize = {
  minHeight: 40,
  maxHeight: 100,
  heightDiffRange: 100 - 40,
  width: 40,
  maxMidShift: 17, // 34,  (34px at most, so 17 either way)
  maxTipShift: 12,
};

// get a random number between a min and max
function randomNumBetween(max, min = 0) {
  return Math.random() * max - 0;
}

function plusOrMinus(x) {
  return randomNumBetween(x, -x);
}

function cointoss() {
  // randomly return true or false; based on https://stackoverflow.com/a/60322877/9706217
  return Math.random() < 0.5;
}

// function to draw with the points identified
function drawLeaf() {
  let x = 0;
  // x = starting x

  // generate a random height somewhere between our min and max
  let heightDiff = leafSize.maxHeight - leafSize.minHeight;
  let leafHeight = leafSize.maxHeight - randomNumBetween(heightDiff);
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

  let curve = d3.line().curve(d3.curveBumpY)(leafPoints);
  return curve;

  // // rotate(${rotation} ${d.x} ${d.y}) translate(${d.x} ${d.y})
  // let transform = "";
  // if (rotate) {
  //   let rotation = Math.random() * 60;
  //   transform = `rotate(${rotation} ${x} ${midLeafHeight})`;
  // }

  // svg.append("path")
  //   .attr("d", curve)
  //   .attr("fill", "green")
  //   .attr("transform", transform);

  // if (showPoints) {
  //   svg.append("g")
  //     // .attr("fill-opacity", 0.6)
  //     .selectAll("circle")
  //     .data(leafPoints)
  //     .join("circle")
  //     .attr("r", 5)
  //     .attr("cx", d => d[0])
  //     .attr("cy", d => d[1])
  //     .attr("fill", "black")
  //  }
}

function drawLeafCurve() {
  let x = 0;
  let maxLeafHeight = 50;
  let maxLeafWidth = 35;

  // vary the width and height; treat initial values as maximums
  let leafHeight = maxLeafHeight - Math.random() * 20;
  let leafWidth = maxLeafWidth - Math.random() * 20;
  // by default, leaf should be widest at the middle; but vary slightly
  let midLeafHeight = leafHeight / 2;
  midLeafHeight += Math.random() * 10 - 5; // random number between +/- 5

  // where should the "tail" of the leaf curve in?
  let tailCurveHeight = leafHeight - 5 - Math.random() * 10;
  let tailCurveDepth = x - leafWidth / 10 + Math.random() * 5;

  let curve = d3.line().curve(d3.bumpY)([
    // let curve = d3.line().curve(d3.curveNatural)([
    [x, 0], // top
    [x - leafWidth / 2, midLeafHeight], // left middle
    [x - leafWidth / 10, tailCurveHeight], // left near bottom
    [x, leafHeight], // bottom
    [x + leafWidth / 2, midLeafHeight], // right middle
    [x, 0], // top
  ]);

  return curve;
}

export { drawLeaf, leafSize };
