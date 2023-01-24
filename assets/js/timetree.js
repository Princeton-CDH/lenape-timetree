import { select } from "d3-selection";
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceLink,
  forceY,
} from "d3-force";
import { line, curveNatural } from "d3-shape";
import { scaleSequential } from "d3-scale";
import { schemeGreens } from "d3-scale-chromatic";

// combine into d3 object for convenience
const d3 = {
  select,
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceLink,
  forceY,
  line,
  curveNatural,
  scaleSequential,
  schemeGreens,
};

// strength of the various forces used to lay out the leaves
const forceStrength = {
  // standard d3 forces
  charge: -1, // simulate gravity (attraction) if the strength is positive, or electrostatic charge (repulsion) if the strength is negative
  manybody: -8, // A positive value causes nodes to attract each other, similar to gravity, while a negative value causes nodes to repel each other, similar to electrostatic charge; d3 default is -30
  center: 0.01, // how strongly drawn to the center of the svg

  // custom y force for century
  centuryY: 4, // draw to Y coordinate for center of assigned century band

  // strength of link force by type of link
  leafToLabel: 5, // between leaves and their labels
  leafToBranch: 3, // between leaf and branch-century node
  branchToBranch: 2.5, // between branch century nodes
};

// constant for selection classname
const selectedClass = "select";

// load & parse leaf data from json embedded in the document
const leafData = document.querySelector(".leaf-data");
const data = JSON.parse(leafData.value);

// generate list of centuries referenced in the data; sort most recent first
let centuries = Array.from(
  new Set(
    data.leaves
      .filter((leaf) => leaf.century != undefined)
      .map((leaf) => leaf.century)
  )
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
  leaf.id = leaf.url;
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

// our nodes will be all leaves plus nodes as needed for branches
let nodes = new Array(...sortedLeaves);

// create an object with all unique branch names from the leaves
// and unique centuries represented within those branches
let branches = new Object();
sortedLeaves.forEach((leaf) => {
  if (branches[leaf.branch] == undefined) {
    branches[leaf.branch] = new Set();
  }
  // cast all to numeric to avoid duplication
  branches[leaf.branch].add(Number(leaf.century));
});

// create a node for the trunk
nodes.push({
  id: "trunk",
  title: "trunk",
  type: "trunk",
});
const trunkNodeIndex = nodes.length - 1; // last node is the trunk

// branch style color sequence; set class name and control with css
let branchStyles = ["a", "b", "c", "d", "e"];

function getBranchStyle(branchName) {
  let branchIndex = Object.keys(branches).indexOf(branchName);
  let branchStyle = branchStyles[branchIndex];
  if (branchStyle != undefined) {
    return "branch-" + branchStyles[branchIndex];
  }
}

// array of links between our nodes
let links = new Array();

// create nodes for the branches
// - create one for each century represented in the data
// - use text as id and label
// NOTE: may want multiple century branch nodes when a single
// branch has a large number of leaves in one century
let branchIndex = new Object();
let centuriesOldestFirst = Array.from(centuries).reverse();
for (let branch in branches) {
  centuriesOldestFirst.forEach((c, index) => {
    let branchId = branch + c;
    nodes.push({
      id: branchId,
      title: branch + " c" + c,
      type: "branch",
      century: c,
    });
    // keep track of branch indexes for generating links from leaves
    branchIndex[branchId] = nodes.length - 1;

    // add link to previous branch or trunk
    if (index == 0) {
      // earliest century in any branch should connect to trunk
      target = trunkNodeIndex;
    } else {
      // otherwise, connect to preceding century in this branch
      target = nodes.length - 2;
    }
    links.push({
      source: branchIndex[branchId],
      target: target,
      value: forceStrength.branchToBranch,
    });
  });
}

// generate links so we can draw as a network graph
// each leaf is connected to its branch+century node
sortedLeaves.forEach((leaf, index) => {
  let branchId = leaf.branch + leaf.century;
  if (branchId in branchIndex) {
    links.push({
      source: index,
      target: branchIndex[branchId],
      value: forceStrength.leafToBranch,
    });
  }
});

// add nodes for labels, linked only to their corresponding leaf
sortedLeaves.forEach((leaf, index) => {
  nodes.push({
    type: "leaf-label",
    title: leaf.title,
    url: leaf.id,
    century: leaf.century,
    tags: leaf.tags,
  });
  links.push({
    source: index,
    target: nodes.length - 1,
    value: forceStrength.leafToLabel,
    type: "leaf-label",
  });
});

TreeGraph({ nodes: nodes, links: links, centuries: centuries });

function TreeGraph({ nodes, links, centuries }) {
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

  // create containers for the leaves by century
  const leafContainerHeight = 75;
  const leafContainers = background
    .selectAll("rect")
    .data(centuries)
    .join("rect")
    .attr("id", (d) => "c" + d)
    .attr("class", "century-container")
    .attr("height", leafContainerHeight)
    .attr("width", width)
    .attr("x", min_x)
    .attr("y", (d, i) => min_y + i * leafContainerHeight);

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
    .force("manyBody", d3.forceManyBody().strength(forceStrength.manyBody))
    .force("center", d3.forceCenter().strength(forceStrength.center))
    // .alpha(0.1)
    // .alphaDecay(0.2)
    .force(
      "collide",
      d3.forceCollide().radius((d) => {
        // collision radius should vary by node type
        if (d.type == "leaf") {
          return 22;
        } else if (d.type == "leaf-label") {
          if (d.title != undefined) {
            return d.title.length * 1.5;
          }
          return 2;
        }
        return 2;
      })
    )
    .force(
      "link",
      d3.forceLink(links).strength((link) => {
        return link.value; // link strength defined when links created
        // if (link.value != undefined) {
        // return link.value;
        // }
        // alternately, could set based on source/target node type,
        // or link type
        // console.log(link);
        // if (link.target.type == "leaf-label") {
        //   return 5;
        // }
        // return 0.8
      })
    )
    // .force("link", d3.forceLink(links).distance(30).strength(link => {
    // return 1;
    // }))
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

  const link = svg
    .append("g")
    .attr("stroke", "darkgray")
    .attr("stroke-width", 1)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-opacity", (d) => {
      return d.type == "leaf-label" ? 0 : 0.4;
    });
  // hide links to labels

  var greenColor = d3.scaleSequential(d3.schemeGreens[5]);

  const node = svg
    .append("g")
    // .attr("fill-opacity", 0.6)
    .selectAll("circle")
    .data(nodes)
    .join("path")
    // make leaf nodes larger
    .attr("d", (d) => {
      if (d.type == "leaf") {
        return drawLeafCurve();
      } else {
        // empty path for everything else (todo: is this valid?)
        return "0 0";
      }
    })
    // .attr("r", (d) => {
    //   return d.type == "leaf" ? 8 : 3;
    // })
    // color leaves by century for now to visually check layout (temporary)
    // .attr("fill", (d) => {
    // return d.type == "leaf" ? greenColor(d.century - 14) : "darkgray";
    // })
    .attr("fill-opacity", (d) => {
      return d.type == "leaf-label" ? 0 : 0.6;
    }) // hide label nodes
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
    .on("click", selectLeaf);

  const nodeLabel = svg
    .append("g")
    .attr("id", "labels")
    .selectAll("text")
    .data(nodes.filter((d) => d.type == "leaf-label"))
    .join("text")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .attr("data-url", (d) => d.url) // set url so we can click to select leaf
    .attr("text-anchor", "middle") // set coordinates to middle of text
    .attr("class", (d) => {
      let classes = ["leaf-label"];
      if (d.tags != undefined) {
        classes.push(...d.tags);
      }
      return classes.join(" ");
    })
    .text((d) => d.title)
    .on("click", selectLeaf);

  // if we need words split into separate tspan elements,
  // do a second join on title words:
  // .selectAll("tspan")
  // .data(d => { return d.title == undefined ? ["no title"] : d.title.split(" ") })
  //   .join("tspan")
  //   .text(word => word);

  function ticked() {
    // node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    // node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    let rotation = Math.random() * 60;
    // since nodes are paths and not circles, position using transform + translate
    // rotate leaves to vary the visual display of leaves
    // (could also skew?)
    node.attr("transform", (d) => {
      // rotate negative or positive depending on side of the tree
      if (d.x > 0) {
        rotation = 0 - rotation;
      }
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
  });

  function selectLeaf(event) {
    deselectAllLeaves();
    // visually highlight selected leaf in the tree
    event.target.classList.add(selectedClass);
    let leafUrl = event.target.getAttribute("data-url");
    let leafAndLabel = document.querySelectorAll(`[data-url="${leafUrl}"]`);
    for (let item of leafAndLabel) {
      item.classList.add(selectedClass);
    }

    fetch(leafUrl)
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

function drawLeafCurve() {
  let x = 0;
  let maxLeafHeight = 45;
  let maxLeafWidth = 25;

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

// svg.append("path")
//     .attr("d", curve)
//     .attr("fill", "green");
// }

function deselectAllLeaves() {
  // deselect any leaf or leaf label that is currently highlighted
  let selected = document.getElementsByClassName(selectedClass);
  // convert to array rather than iterating, since htmlcollection is live
  // and changes as updated
  Array.from(selected).forEach((item) => {
    item.classList.remove(selectedClass);
  });
}

function selectLeavesByTag(tagName) {
  // select all leaves with the specified tag
  deselectAllLeaves();
  let leaves = document.getElementsByClassName(tagName);
  for (let item of leaves) {
    item.classList.add(selectedClass);
  }
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
    selectLeavesByTag(element.textContent);
  }
});

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
