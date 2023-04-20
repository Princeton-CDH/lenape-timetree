import { line, curveNatural, curveBumpY } from "d3-shape";
import { select, selectAll } from "d3-selection";

// combine into d3 object for convenience
const d3 = {
  line,
  curveNatural,
  curveBumpY,
  select,
  selectAll,
};

function drawBranch(points) {
  const curve = d3.line().curve(d3.curveBumpY);
  return curve(points.map((d) => [d.x, d.y])); // [start, end]);
}

// how to do this? needs context/scale
// trunk width should be a constant,
// top/bottom coords should be fixed
// - needed for both tree and roots

function drawTrunk() {
  // draw a couple of lines to help gesture at tree-ness
  let trunkWidth = 65; // 65;   // 110 in figma but we're roughly half scale, should be 55
  // right side
  let max_y = min_y + height;
  this.trunkLeft = -trunkWidth - 27;
  this.trunkRight = trunkWidth + 25;
  // let max_y = height / 2;
  background
    .append("path")
    .attr(
      "d",
      d3.line().curve(d3.curveNatural)([
        [trunkWidth + 25, max_y],
        [trunkWidth, max_y - 50],
        [trunkWidth - 10, max_y - 190],
        [trunkWidth + 7, min_y + yAxisHeight - 10],
      ])
    )
    .attr("class", "trunk");
  // left side
  background
    .append("path")
    .attr(
      "d",
      d3.line().curve(d3.curveNatural)([
        [-trunkWidth - 32, max_y],
        [-trunkWidth - 20, max_y - 50],
        [-trunkWidth, max_y - 105],
        [-trunkWidth - 27, min_y + yAxisHeight - 10],
      ])
    )
    .attr("class", "trunk");
}

function roots() {
  console.log("drawing roots");
  const svg = d3.select("svg#roots");
  // TODO: need to add viewbox / coords to svg!
  const navLinks = document.querySelectorAll("footer > nav > a");
  console.log(navLinks.length);
  let width = 1200;
  let sectionwidth = 1200 / navLinks.length + 1;

  let testcoords = [
    { x: 510, y: 0 },
    { x: 400, y: 30 },
    { x: 325, y: 40 },
    { x: sectionwidth - sectionwidth / 2, y: 100 },
    { x: 0, y: 300 },
  ];
  let path = drawBranch(testcoords);
  svg.append("path").attr("class", "root").attr("d", path);

  testcoords = [
    { x: 510, y: 0 },
    { x: 525, y: 20 },
    { x: 495, y: 40 },
    { x: sectionwidth * 2 - sectionwidth / 2, y: 100 },
    { x: sectionwidth * 2, y: 300 },
  ];
  path = drawBranch(testcoords);
  svg.append("path").attr("class", "root").attr("d", path);

  // NOTE: html coords != svg coords

  navLinks.forEach((a) => {
    console.log(a);
    console.log(a.getBoundingClientRect());
  });
  console.log(svg);
  console.log(path);
}

export { drawBranch, roots };
