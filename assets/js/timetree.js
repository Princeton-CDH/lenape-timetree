import { select, selectAll } from "d3-selection";
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceLink,
  forceRadial,
  forceY,
} from "d3-force";
import { line, curveNatural } from "d3-shape";
import { scaleSequential } from "d3-scale";
import { schemeGreens } from "d3-scale-chromatic";

import { Leaf, LeafPath, leafSize, randomNumBetween } from "./leaves";
import { LeafLabel } from "./labels";

// combine into d3 object for convenience
const d3 = {
  select,
  selectAll,
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceLink,
  forceRadial,
  forceY,
  line,
  curveNatural,
  scaleSequential,
  schemeGreens,
};

// strength of the various forces used to lay out the leaves
const forceStrength = {
  // standard d3 forces
  charge: -75, // simulate gravity (attraction) if the strength is positive, or electrostatic charge (repulsion) if the strength is negative
  manybody: -35, // A positive value causes nodes to attract each other, similar to gravity, while a negative value causes nodes to repel each other, similar to electrostatic charge; d3 default is -30
  center: 0.01, // how strongly drawn to the center of the svg

  // custom y force for century
  centuryY: 5, // draw to Y coordinate for center of assigned century band

  // strength of link force by type of link
  leafToLabel: 5.65, // between leaves and their labels
  leafToBranch: 3, // between leaf and branch-century node
  branchToBranch: 2.5, // between branch century nodes
  labelToOutside: 0.8, // radial force to draw label towards the outside of the tree
  labelRadius: 500, // radius for the radial force used to draw labels outide
};

// constant for selection classname
const selectedClass = "select";

// load & parse leaf data from json embedded in the document
const leafData = document.querySelector(".leaf-data");
const data = JSON.parse(leafData.value);

// generate list of centuries referenced in the data; sort most recent first
let centuries = Array.from(
  data.leaves
    .filter((leaf) => leaf.century != undefined)
    .reduce((acc, leaf) => {
      acc.add(leaf.century);
      return acc;
    }, new Set())
)
  .sort()
  .reverse();

// check and report on total leaves, unsortable leaves
console.log(`${data.leaves.length} total leaves`);
// NOTE: some sort dates set to empty string, "?"; 0 is allowed for earliest sort
let unsortableLeaves = data.leaves.filter(
  (leaf) => leaf.sort_date === null || leaf.sort_date == ""
);
console.log(
  `${unsortableLeaves.length} lea${
    unsortableLeaves.length == 1 ? "f" : "ves"
  } with sort date not set`
);

// ignore any records with sort date unset
let sortedLeaves = data.leaves
  .filter((leaf) => leaf.sort_date != null)
  .sort((a, b) => a.sort_date > b.sort_date);
// use url as id for node in graph; set type to leaf; set century
sortedLeaves.forEach((leaf) => {
  leaf.type = "leaf";
  // set place-holder centuries for special cases
  // (century set in json based on sort date if numeric)
  if (leaf.century == undefined) {
    if (leaf.sort_date == 0 || leaf.sort_date == "") {
      // put zeros in the 1500s
      leaf.century = 15;
    } else if (leaf.sort_date == "TBA" || leaf.sort_date == "?") {
      // put TBs / ? in the 2000s
      leaf.century = 20;
    }
  }
});

// group leaves by branch, preserving sort order
let leavesByBranch = sortedLeaves.reduce((acc, leaf) => {
  let b = leaf.branch;
  if (acc[b] == undefined) {
    acc[b] = [];
  }
  acc[b].push(leaf);
  return acc;
}, {});
// console.log(leavesByBranch);

// create a list to add nodes, starting with a node for the trunk
let nodes = [
  {
    id: "trunk",
    title: "trunk",
    type: "trunk",
  },
];
const trunkNodeIndex = 0; // first node is the trunk

// array of links between our nodes
let links = new Array();

// add leaves to nodes by branch, in sequence,
// creating branch+century nodes as we go
for (const branch in leavesByBranch) {
  // *in* for keys
  let currentBranchNode;
  let currentBranchNodeCount = 0;
  let currentCentury;
  let previousBranchIndex = trunkNodeIndex;
  let branchIndex;
  // for (const leaf of leavesByBranch[branch]) {  // *of* for values
  leavesByBranch[branch].forEach((leaf, index) => {
    // *of* for values
    // check if we need to make a new branch node:
    // - no node exists
    // - too many leaves on current node
    // - century has changed
    if (
      currentBranchNode == undefined ||
      currentBranchNodeCount > 3 ||
      currentCentury != leaf.century
    ) {
      let branchId = `${branch}-century${leaf.century}-${index}`;
      let currentCentury = leaf.century;
      currentBranchNodeCount = 0;
      nodes.push({
        id: `${branch}-century${leaf.century}-${index}`,
        title: `${branch} ${leaf.century}century (${index})`,
        type: "branch",
        branch: branch,
        century: leaf.century,
      });
      // add to links
      branchIndex = nodes.length - 1;
      // link to trunk or previous branch node
      links.push({
        source: previousBranchIndex,
        target: branchIndex,
        value: forceStrength.branchToBranch,
        branch: branch,
      });

      if (branchIndex != undefined) {
        previousBranchIndex = branchIndex;
      }
    }
    // add the current leaf as a node
    nodes.push(leaf);
    currentBranchNodeCount += 1;
    // add link between leaf and branch
    // links.push(nodes.length - 1, branchIndex);
    let leafIndex = nodes.length - 1;
    links.push({
      source: branchIndex,
      target: leafIndex,
      value: forceStrength.leafToBranch,
      branch: leaf.branch,
    });

    // add a label for the leaf
    nodes.push({
      type: "leaf-label",
      // display title takes precedence over title but is optional
      label: new LeafLabel(leaf.display_title || leaf.title),
      url: leaf.url,
      id: leaf.id,
      century: leaf.century,
      tags: leaf.tags,
    });
    links.push({
      source: leafIndex,
      target: nodes.length - 1,
      value: forceStrength.leafToLabel,
      type: "leaf-label",
    });
  });
}
// branch style color sequence; set class name and control with css
let branchStyles = ["a", "b", "c", "d", "e"];

function getBranchStyle(branchName) {
  let branchIndex = Object.keys(leavesByBranch).indexOf(branchName);
  // let branchIndex = Object.keys(branches).indexOf(branchName);
  let branchStyle = branchStyles[branchIndex];
  if (branchStyle != undefined) {
    return "branch-" + branchStyles[branchIndex];
  }
}

TreeGraph({ nodes: nodes, links: links, centuries: centuries });

function TreeGraph({ nodes, links, centuries }) {
  // let width = 775;   == 1.0 scale for tree container on 1280x810 screen
  // let height = 540;

  // what if 1280 is 2.0 scale and mobile is 1.0 ?
  // let width = 1550;
  // let height = 1080;

  let width = 1200;
  let height = 800;

  let min_x = -width / 2;
  let min_y = -height / 2;

  let svg = d3
    .select("#timetree")
    .append("svg")
    .attr("viewBox", [min_x, min_y, width, height]);

  // create a section for the background
  let background = svg.append("g").attr("id", "background");
  // visual debugging layer
  const debugLayer = svg.append("g").attr("id", "debug").style("opacity", 0); // not visibly by default

  // create containers for the leaves by century
  const leafContainerHeight = 80;
  const leafContainers = background
    .selectAll("rect")
    .data(centuries)
    .join("rect")
    .attr("id", (d) => "c" + d)
    .attr("class", "century-container")
    .attr("height", leafContainerHeight)
    .attr("width", width)
    .attr("x", min_x)
    .attr("y", (d, i) => min_y + 15 + i * leafContainerHeight);

  // create labels for the centuries
  const leafContainerLabels = background
    .selectAll("text")
    .data(centuries)
    .join("text")
    .attr("x", min_x + 5)
    .attr("y", (d, i) => min_y + i * leafContainerHeight + 15)
    .attr("class", "century-label")
    .text((d) => d + "00s");

  // calculate leaf constraints based on leaf container height and century
  const leafConstraints = new Object();
  centuries.forEach((c, i) => {
    let localTop = leafContainerHeight * i;
    leafConstraints[c] = {
      top: localTop,
      bottom: localTop + leafContainerHeight,
    };
  });

  // draw a couple of lines to help gesture at tree-ness
  let trunkWidth = 65;
  // right side
  let max_y = height / 2;
  background
    .append("path")
    .attr(
      "d",
      d3.line().curve(d3.curveNatural)([
        [trunkWidth + 25, max_y],
        [trunkWidth, max_y - 50],
        [trunkWidth - 10, max_y - 190],
        [trunkWidth + 7, min_y + leafConstraints["15"].bottom - 10],
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
        [-trunkWidth - 27, min_y + leafConstraints["15"].bottom - 10],
      ])
    )
    .attr("class", "trunk");

  let g = svg.append("g");

  // NOTE: will probably want to tweak and finetune these forces
  let simulation = d3
    .forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(forceStrength.charge))
    // .force("manyBody", d3.forceManyBody().strength(forceStrength.manyBody))
    .force("center", d3.forceCenter().strength(forceStrength.center))
    // .alpha(0.1)
    // .alphaDecay(0.2)
    .force(
      "collide",
      d3.forceCollide().radius((d) => {
        // collision radius should vary by node type
        if (d.type == "leaf") {
          return leafSize.width - 5;
        } else if (d.type == "leaf-label") {
          return d.label.radius - 10;
        }
        return 2;
      })
    )
    .force(
      "link",
      d3.forceLink(links).strength((link) => {
        return link.value; // link strength defined when links created
      })
    )
    // .force("link", d3.forceLink(links).distance(30).strength(link => {
    // return 1;
    // }))
    .force(
      "radius",
      d3.forceRadial(forceStrength.labelRadius).strength((node) => {
        if (node.type == "leaf-label") {
          return forceStrength.labelToOutside;
        } else {
          return 0.1;
        }
      })
    )
    .force(
      "y",
      d3
        .forceY()
        .y((node) => centuryY(node))
        .strength(forceStrength.centuryY)
    );
  // .on("tick", ticked);

  // run simulation for 300 ticks without animation
  simulation.tick(300);
  // only position once after simulation has run
  simulation.on("tick", ticked);
  simulation.tick();

  // define once an empty path for nodes we don't want to display
  var emptyPath = d3.line().curve(d3.curveNatural)([[0, 0]]);

  const node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("path")
    .data(nodes)
    .join("path")
    // draw leaf path for leaves, empty path for everything else
    .attr("d", (d) => {
      return d.type == "leaf" ? new LeafPath().path : emptyPath;
    })
    // make leaves keyboard focusable
    .attr("tabindex", (d) => (d.type == "leaf" ? 0 : null))
    .attr("stroke-linejoin", "bevel")
    .attr("data-id", (d) => d.id)
    .attr("data-url", (d) => d.url || d.id)
    .attr("data-sort-date", (d) => d.sort_date)
    .attr("data-century", (d) => d.century)
    .attr("class", (d) => {
      let classes = [d.type, getBranchStyle(d.branch)];
      if (d.tags != undefined) {
        classes.push(...d.tags);
      }
      return classes.join(" ");
    })
    .on("click", Leaf.selectLeaf)
    .on("mouseover", Leaf.highlightLeaf)
    .on("mouseout", Leaf.unhighlightLeaf);

  const nodeLabel = svg
    .append("g")
    .attr("id", "labels")
    .selectAll("text")
    .data(nodes.filter((d) => d.type == "leaf-label"))
    .join("text")
    // x,y for a circle is the center, but for a text element it is top left
    // set position based on x,y adjusted by radius and height
    .attr("x", (d) => d.x - d.label.radius)
    .attr("y", (d) => d.y - d.label.height / 2)
    .attr("y", (d) => d.y - d.label.height / 2)
    .attr("data-id", (d) => d.id) // leaf id for url state
    .attr("data-url", (d) => d.url) // set url so we can click to select leaf
    .attr("text-anchor", "middle") // set coordinates to middle of text
    .attr("class", (d) => {
      let classes = ["leaf-label"];
      if (d.tags != undefined) {
        classes.push(...d.tags);
      }
      return classes.join(" ");
    })
    // .text((d) => d.label.text)
    .on("click", Leaf.selectLeaf)
    .on("mouseover", Leaf.highlightLeaf)
    .on("mouseout", Leaf.unhighlightLeaf);

  // split labels into words and use tspans to position on multiple lines;
  // inherits text-anchor: middle from parent text element
  nodeLabel
    .selectAll("tspan")
    .data((d) => {
      // split label into words, then return as a map so
      // each element has a reference to the parent node
      return d.label.parts.map((i) => {
        return { word: i, node: d };
      });
    })
    .join("tspan")
    .text((d) => d.word)
    .attr("x", (d) => {
      // position at the same x as the parent node
      return d.node.x;
    })
    .attr("dy", LeafLabel.lineHeight); // delta-y : relative position based on line height

  // visual debugging for layout
  // draw circles and lines in a debug layer that can be shown or hidden
  // circle size for leaf and leaf label matches radius used for collision
  // avoidance in the network layout
  debugLayer
    .selectAll("circle.debug")
    .data(nodes) // .filter((d) => d.type == "leaf-label"))
    .join("circle")
    .attr(
      "class",
      (d) => `debug debug-${d.type} dbg-${getBranchStyle(d.branch) || ""}`
    )
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => {
      // NOTE: we're currently adjusting collision radius slightly
      // in the network simulation; probably needs some
      // adjusments, and should make sure these match
      if (d.type == "leaf-label") {
        return d.label.radius - 10;
        // return d.label.radius;
      }
      if (d.type == "leaf") {
        return leafSize.width - 5;
        // return leafSize.width;
      }
      // note: this is larger than collision radius, increase size for visibility
      return 5; // for branch nodes
    });

  // add lines for links to the debug layer
  const link = debugLayer
    .append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", (d) => {
      return `${d.type || ""} dbg-${getBranchStyle(d.branch) || ""}`;
    });
  // hide links to labels

  // draw a circle showing the radial force applied to labels
  debugLayer
    .append("circle")
    .attr("r", forceStrength.labelRadius)
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("stroke", "white")
    .attr("stroke-width", 1);

  // add debug controls
  let debugLayerControls = {
    // control id => layer id
    "debug-visible": "#debug",
    "leaf-visible": ".nodes",
    "label-visible": "#labels",
  };

  // When the debug range inputs change, update the opacity for
  //the corresponding layer
  d3.selectAll("#debug-controls input").on("input", function () {
    d3.selectAll(debugLayerControls[this.id]).style(
      "opacity",
      `${this.value}%`
    );
  });

  function ticked() {
    // node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    // node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    let rotation = randomNumBetween(125); // Math.random() * 90;
    // since nodes are paths and not circles, position using transform + translate
    // rotate leaves to vary the visual display of leaves
    // (could also skew?)
    node.attr("transform", (d, i, n) => {
      if (d.type == "leaf") {
        // rotate negative or positive depending on side of the tree
        if (d.x > 0) {
          rotation = 0 - rotation;
        }
        // leaf coordinates are be centered around 0,0
        return `rotate(${rotation} ${d.x} ${d.y}) translate(${d.x} ${d.y})`;
      }
      // rotate relative to x, y, and move to x, y
      // return `rotate(${rotation} ${d.x} ${d.y}) translate(${d.x} ${d.y})`;
      return `rotate(${rotation} ${d.x} ${d.y}) translate(${d.x} ${d.y})`;
    });

    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
  }

  function centuryY(node) {
    // y-axis force to align nodes by century
    if (node.type == "trunk") {
      return 0;
      // return height - 150;
    } else {
      // draw nodes vertically to the middle of appropriate century container
      // return min_y + (leafContainerHeight / 2) + leafConstraints[node.century].top;
      // this calculation is correct for middle of container; but forces are resulting
      // in leaves displaying one century below; draw furthur up
      return (
        min_y +
        leafContainerHeight / 2 +
        leafConstraints[node.century].top -
        leafContainerHeight
      );
    }
    return 0;
  }

  const panel = document.querySelector("#panel");
  d3.select("aside .close").on("click", function () {
    panel.parentElement.classList.remove("show-panel");
    panel.parentElement.classList.add("closed");
    Leaf.deselectAll();
    Leaf.closeLeafDetails();
  });

  // check for presence of hash when page is first loaded and select leaf
  Leaf.selectLeafByHash();
}

// bind a delegated click handler to override tag link behavior
const asideContainer = document.querySelector("aside");
asideContainer.addEventListener("click", (event) => {
  let element = event.target;
  // if click target is a link in the tags section, select leaves for that tag
  if (
    element.tagName == "A" &&
    element.parentElement.classList.contains("tags")
  ) {
    event.preventDefault();
    event.stopPropagation();
    Leaf.selectByTag(element.textContent);
  }
});
