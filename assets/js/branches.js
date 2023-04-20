import { line, curveNatural, curveBumpY } from "d3-shape";

// combine into d3 object for convenience
const d3 = {
  line,
  curveNatural,
  curveBumpY,
};

function drawBranch(points) {
  const curve = d3.line().curve(d3.curveBumpY);
  return curve(points.map((d) => [d.x, d.y])); // [start, end]);
}

export { drawBranch };
