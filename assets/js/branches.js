import { line, curveNatural, curveBumpY } from "d3-shape";
import { select, selectAll } from "d3-selection";
import { randomNumBetween } from "./leaves";
import { BaseSVG } from "./utils";

// combine into d3 object for convenience
const d3 = {
  line,
  curveNatural,
  curveBumpY,
  select,
  selectAll,
};

function drawTreeSegment(points) {
  const curve = d3.line().curve(d3.curveBumpY);
  return curve(points.map((d) => [d.x, d.y])); // [start, end]);
}

// how to do this? needs context/scale
// trunk width should be a constant,
// top/bottom coords should be fixed
// - needed for both tree and roots

const trunkWidth = 150; // 110;
const trunkBaseWidth = trunkWidth * 0.9;

const trunk = {
  width: trunkWidth,
  topLeft: -trunkWidth / 2,
  topRight: trunkWidth / 2,
  bottomLeft: -trunkBaseWidth / 2,
  bottomRight: trunkBaseWidth / 2,
};

function drawTrunk(container, [min_x, min_y, width, height], trunkTop) {
  // draw lines for the trunk,
  // to make it easier to read as a tree

  const max_y = min_y + height;

  // extend trunk off the bottom edge of the svg,
  // so that trunk and roots stay connected when resizing
  const trunkExtra = 600;

  //  add points for unevenness at the thirds of the trunk
  let onethird = (trunkTop - trunk.bottomLeft) / 4;

  // generate points for left side
  const leftSidePoints = [
    [trunk.topLeft, trunkTop],
    [trunk.topLeft * 0.9, trunkTop + onethird],
    [trunk.topLeft * 0.8, trunkTop + onethird * 2],
    [trunk.bottomLeft * 0.9, trunkTop + onethird * 3],
    [trunk.bottomLeft, max_y],
    [trunk.bottomLeft, max_y + trunkExtra],
  ].map((d) => {
    return { x: d[0], y: d[1] };
  });

  // draw the path for the left side
  container
    .append("path")
    .attr("class", "trunk")
    .attr("d", drawTreeSegment(leftSidePoints));

  // generate points for right side

  const rightSidePoints = [
    [trunk.topRight, trunkTop],
    [trunk.topRight * 0.9, trunkTop + onethird],
    [trunk.topRight * 0.95, trunkTop + onethird * 2],
    [trunk.bottomRight * 0.9, trunkTop + onethird * 3],
    [trunk.bottomRight, max_y],
    [trunk.bottomRight, max_y + trunkExtra], // extend off the edge of the svg, for resizing
  ].map((d) => {
    return { x: d[0], y: d[1] };
  });

  // draw the path for the right side
  container
    .append("path")
    .attr("class", "trunk")
    .attr("d", drawTreeSegment(rightSidePoints));
}

function drawBranches(nodes, container, branches, trunkTop) {
  // draw branches

  let branchNodes = nodes.filter((d) => d.type == "branch");
  // calculate starting coordinates for each branch
  // tree width is defined as a constant;
  // assuming center of svg is 0,0
  // top of tree is passed in from timetree code
  let leftBranchX = -trunkWidth / 2;
  // second branch starts up 1/3 of the trunk width
  let secondBranchY = trunkWidth * 0.3;
  // third and fourth stair step down in thirds
  let steps = (trunkTop - secondBranchY) * 0.3;

  // calculate starting coordinates for each of the five branches
  let branchStart = [
    // left-most branch
    { x: trunk.topLeft, y: trunkTop },
    // [leftBranchX, trunkTop],  // left-most branch
    // second branch starts over 6% of tree width
    { x: trunk.topLeft + trunkWidth * 0.06, y: trunkTop - secondBranchY },
    // third is 48% of width
    {
      x: trunk.topLeft + trunkWidth * 0.48,
      y: trunkTop - secondBranchY + steps,
    },
    // fourth is 70% of width
    {
      x: trunk.topLeft + trunkWidth * 0.7,
      y: trunkTop - secondBranchY + steps + steps,
    },
    // right-most branch
    { x: trunk.topRight, y: trunkTop },
  ];

  // insert branches before node group layer,
  // so it will render as underneath the leaves
  let branchPaths = container
    .insert("g", ".nodes")
    .attr("class", "branches")
    .selectAll("path")
    .data(Object.keys(branches)) // join to branch names passed in
    .join("path")
    // draw branch path for leaves, empty path for everything else
    .attr("class", "branch")
    .attr("d", (b, i) => {
      // start at the calculated branch point for this branch,
      // then use branch pseudo nodes as coordinates
      let branchPoints = [
        branchStart[i],
        ...branchNodes.filter((d) => d.branch == b),
      ];
      return drawTreeSegment(branchPoints);
    });
}

class Roots extends BaseSVG {
  constructor() {
    super();

    // configure so point [0, 0] is the center top of the svg

    // use same logic as for the timetree svg width
    let width = this.getSVGWidth(); // width depends on if mobile or not
    let height = 130;
    let min_x = -width / 2;
    let min_y = 0;

    // TODO: use a graphic for mobile,
    // since it is decorative and not functional ?

    let center_x = min_x + width / 2;

    const svg = d3
      .select("body > footer")
      .append("svg")
      .lower()
      .attr("id", "roots")
      .attr("viewBox", [min_x, min_y, width, height]);

    // for debugging: mark the center of the svg
    // svg
    //   .append("circle")
    //   .attr("r", 5)
    //   .attr("fill", "red")
    //   .attr("cx", min_x + width / 2)
    //   // .attr("cx", width / 2)
    //   // .attr("cx", 0)
    //   .attr("cy", min_y + height / 2);

    const navLinks = document.querySelectorAll("body > footer > nav > a");
    let linkCount = navLinks.length;
    // divide into equal sections based on the number of nav links
    let sectionwidth = width / linkCount + 1;

    let center_y = height / 2;

    let currentURL = window.location.pathname;

    // draw one root for each footer nav link
    navLinks.forEach((a, i) => {
      // determine if left or right, based half point of leaves
      let left = i < linkCount / 2;

      let startx = left ? trunk.bottomLeft : trunk.bottomRight;
      let targetX = min_x + sectionwidth * i + sectionwidth / 2;

      // create a branch off point for secondary root line
      let secondaryRootStart = [
        // start part way to the target x coord
        ((targetX - startx) / 3) * 2 + (left ? -45 : 45),
        // and somewhere between a third and a half of the svg height
        randomNumBetween(height / 3, height / 2),
      ];

      let rootCoords = [
        [center_x + startx, min_y],
        [center_x + startx + (left ? -8 : 8), min_y + 7],
        secondaryRootStart,
        [targetX, center_y],
        [targetX + (left ? -25 : 25), height],
      ].map((d) => {
        return { x: d[0], y: d[1] };
      });

      let path = drawTreeSegment(rootCoords);
      let current = a.getAttribute("aria-current") == "page";
      // set root as current if nav link page is for the current page
      svg
        .append("path")
        .attr("class", `root ${current ? "current" : ""}`)
        .attr("d", path);

      let secondaryRootCoords = [
        rootCoords[2], // = secondary root start
        {
          x: secondaryRootStart[0] + (left ? -43 : 43),
          y: secondaryRootStart[1] + 52,
        },
        { x: secondaryRootStart[0] + (left ? -55 : 55), y: height },
      ];

      svg
        .append("path")
        .attr("class", "root")
        .attr("d", drawTreeSegment(secondaryRootCoords));
    });

    // NOTE: html coords != svg coords, so bounding rects doesn't help
  }
}

export { drawTreeSegment, Roots, drawTrunk, drawBranches };
