// logic to generate a path for drawing leaves

import { line, curveNatural } from "d3-shape";

// combine into d3 object for convenience
const d3 = {
  line,
  curveNatural,
};

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

  let curve = d3.line().curve(d3.curveNatural)([
    [x, 0], // top
    [x - leafWidth / 2, midLeafHeight], // left middle
    [x - leafWidth / 10, tailCurveHeight], // left near bottom
    [x, leafHeight], // bottom
    [x + leafWidth / 2, midLeafHeight], // right middle
    [x, 0], // top
  ]);

  return curve;
}

export { drawLeafCurve };
