import {select} from "d3-selection";
import {forceSimulation, forceManyBody, forceCenter, forceCollide, forceLink, forceY} from "d3-force";
import {line, curveNatural} from "d3-shape";
import {scaleSequential} from "d3-scale";
import {schemeGreens} from "d3-scale-chromatic"

// combine into d3 object for convenience
const d3 = {select, forceSimulation, forceManyBody, forceCenter, forceCollide,
    forceLink, forceY, line, curveNatural, scaleSequential, schemeGreens};

// load & parse leaf data from json embedded in the document
const leafData = document.querySelector('.leaf-data');
const data = JSON.parse(leafData.value);

// generate list of centuries referenced in the data; sort most recent first
let centuries = Array.from(new Set(
  data.leaves.filter(leaf => leaf.century != undefined)
      .map(leaf => leaf.century))
  ).sort().reverse();

// check and report on total leaves, unsortable leaves
console.log(`${data.leaves.length} total leaves`);
// NOTE: some sort dates set to empty string, "?"; 0 is allowed for earliest sort
let unsortableLeaves = data.leaves.filter(leaf => leaf.sort_date === null || leaf.sort_date == "");
console.log(`${unsortableLeaves.length} lea${unsortableLeaves.length == 1 ? "f" : "ves"} with sort date not set`);

// ignore any records with sort date unset
let sortedLeaves = data.leaves.filter(leaf => leaf.sort_date != null)
  .sort((a, b) => a.sort_date > b.sort_date)
// use url as id for node in graph; set type to leaf; set century
sortedLeaves.forEach(leaf => {
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
let nodes = new Array(... sortedLeaves);

// create an object with all unique branch names from the leaves
// and unique centuries represented within those branches
let branches = new Object();
sortedLeaves.forEach(leaf => {
  if (branches[leaf.branch] == undefined) {
    branches[leaf.branch] = new Set();
  }
  // cast all to numeric to avoid duplication
  branches[leaf.branch].add(Number(leaf.century));
});

// create a node for the trunk
nodes.push({
  id: 'trunk',
  title: 'trunk',
  type: 'trunk'
});
const trunkNodeIndex = nodes.length - 1;  // last node is the trunk

// array of links between our nodes
let links = new Array();

// create nodes for the branches
// - create one for each century represented in the data
// - use text as id and label
// NOTE: may want multiple century branch nodes when a single
// branch has a large number of leaves in one century
let branchIndex = new Object();

for (branch in branches) {
  centuries.forEach((c, index) => {
    let branchId = branch + c;
    nodes.push({
      id: branchId,
      title: branch + " c" +c,
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
      value: 10
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
      value: 1
    })
  }
});

TreeGraph({nodes: nodes, links: links, centuries: centuries});



function TreeGraph({nodes, links, centuries}) {
  let width = 1200;
  let height = 800;

  let min_x = -width / 2;
  let min_y = -height / 2;

  let svg =  d3.select("#timetree")
      .append("svg")
      .attr("viewBox", [min_x, min_y, width, height]);

  // create a section for the background
  let background = svg.append("g")
    .attr("id", "background");

  // create containers for the leaves by century
  const leafContainerHeight = 75;
  const leafContainers = background.selectAll("rect")
      .data(centuries)
      .join("rect")
        .attr("id", d => "c" + d)
        .attr("height", leafContainerHeight)
        .attr("width", width)
        .attr("x", min_x)
        .attr("y", (d, i) => (min_y + i * leafContainerHeight))
        // .attr('fill', "lightgray")
        .attr('fill-opacity', 0.1)
        .attr('stroke', 'gray')
        .attr('stroke-opacity', 0.5)
        .attr('stroke-dasharray', 2);


  // create labels for the centuries
  const leafContainerLabels = background.selectAll("text")
      .data(centuries)
      .join('text')
        .attr('x', min_x + 5)
        .attr('y', (d, i) => (min_y + i * leafContainerHeight + 15))
        .attr('fill', "gray")
        .attr('style', 'font-size: 10px')
        .text(d => d + '00s');

  // calculate leaf constraints based on leaf container height and century
  const leafConstraints = new Object();
  centuries.forEach((c, i) => {
    let localTop = leafContainerHeight * i;
    leafConstraints[c] = {
      top:  localTop,
      bottom: localTop + leafContainerHeight
    };
  });

  // draw a couple of lines to help gesture at tree-ness
  let trunkWidth = 65;
  // right side
  let max_y = height/2;
  background.append("path")
    .attr("d", d3.line().curve(d3.curveNatural)([
      [trunkWidth + 25, max_y],
      [trunkWidth, max_y - 50],
      [trunkWidth - 10, max_y - 190],
      [trunkWidth + 7, min_y + leafConstraints['15'].bottom - 10]
    ]))
    .attr("stroke", "#D9D8D8")
    .attr("stroke-width", 3)
     .attr("fill", "none")
  // left side
  background.append("path")
    .attr("d", d3.line().curve(d3.curveNatural)([
      [- trunkWidth - 32 , max_y],
      [- trunkWidth - 20, max_y - 50],
      [- trunkWidth, max_y - 105],
      [- trunkWidth - 27, min_y + leafConstraints['15'].bottom - 10]
    ]))
    .attr("stroke", "#D9D8D8")
    .attr("stroke-width", 3)
     .attr("fill", "none")


  let g = svg.append("g");

  // NOTE: will probably want to tweak and finetune these forces
  let simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-1))
    .force("manyBody", d3.forceManyBody().strength(-8))
    .force("center", d3.forceCenter().strength(0.01))
    // .alpha(0.1)
    // .alphaDecay(0.2)
    .force("collide", d3.forceCollide().radius(18))
    // NOTE: may want to adjust to make variable by node type
    .force("link", d3.forceLink(links))
    // .force("link", d3.forceLink(links).distance(30).strength(link => {
      // return 1;
    // }))
    .force("y", d3.forceY().y(node => centuryY(node)).strength(1.7));
    // .on("tick", ticked);

  // run simulation for 300 ticks without animation
  simulation.tick(300);
  // only position once after simulation has run
  simulation.on("tick", ticked);
  simulation.tick();


const link = svg.append("g")
      .attr("stroke", "lightgray")
      .attr("stroke-width", 1)
    .selectAll("line")
    .data(links)
    .join("line");

  var greenColor = d3.scaleSequential(d3.schemeGreens[5]);

  const node = svg.append("g")
      .attr("fill-opacity", 0.6)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      // make leaf nodes larger
      .attr("r", d => { return d.type == "leaf" ? 8 : 3 })
      // color leaves by century for now to visually check layout
      .attr("fill", d => {return d.type == "leaf" ? greenColor(d.century - 14) : "lightgray" })
      // .attr("fill", d => {return d.type == "leaf" ? "green" : "lightgray" })
      .attr("data-url", d => d.id)
      .attr("data-sort-date", d => d.sort_date)
      .on("click", selectLeaf);

  function ticked() {
      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)

    }

  function centuryY(node) {
    // y-axis force to align nodes by century
    if (node.type == 'trunk') {
      return 0;
      // return height - 150;
    } else {
      // draw nodes vertically to the middle of appropriate century container
      return min_y + (leafContainerHeight / 2) + leafConstraints[node.century].top;
    }
    return 0;
  }

  const panel = document.querySelector("#panel");

  d3.select('aside .close').on("click", function() {
    panel.parentElement.classList.remove("show-panel");
    panel.parentElement.classList.add("closed");
  });

  function selectLeaf(node) {
    fetch(node.target.getAttribute("data-url"))
      .then((response) => response.text())
      .then((html) => {
        let parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // Get the article content and insert into panel
        const article = doc.querySelector('article');
        panel.querySelector("article").replaceWith(article);
        // make sure panel is active
        panel.parentElement.classList.add("show-panel");
      });
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
