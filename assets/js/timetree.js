import { select, selectAll } from "d3-selection";
import { axisLeft } from "d3-axis";
import { scaleLinear } from "d3-scale";
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceLink,
  forceX,
  forceY,
} from "d3-force";
import { line, curveNatural } from "d3-shape";
import { zoom, zoomIdentity, zoomTransform } from "d3-zoom";

import { LeafLabel } from "./labels";
import { Panel } from "./panel";
import { Leaf, LeafPath, leafSize, randomNumBetween } from "./leaves";
import { drawTreeSegment, drawTrunk, drawBranches } from "./branches";
import { BaseSVG } from "./utils";
import { TimeTreeKeysMixin } from "./keys";

// combine d3 imports into a d3 object for convenience
const d3 = {
  axisLeft,
  select,
  selectAll,
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceLink,
  forceX,
  forceY,
  line,
  curveNatural,
  zoom,
  zoomIdentity,
  zoomTransform,
  scaleLinear,
};

// branches are defined and should be displayed in this order
const branches = {
  "Lands + Waters": "lands-waters",
  Communities: "communities",
  "The University": "university",
  Removals: "removals",
  "Resistance + Resurgence": "resistance-resurgence",
};

// branch style color sequence; set class name and control with css
function getBranchStyle(branchName) {
  let branchSlug = branches[branchName];
  if (branchSlug != undefined) {
    return `branch-${branchSlug}`;
  }
}

// strength of the various forces used to lay out the leaves
const forceStrength = {
  // standard d3 forces
  charge: -15, // simulate gravity (attraction) if the strength is positive, or electrostatic charge (repulsion) if the strength is negative
  manybody: -35, // A positive value causes nodes to attract each other, similar to gravity, while a negative value causes nodes to repel each other, similar to electrostatic charge; d3 default is -30
  center: 0.01, // how strongly drawn to the center of the svg

  // custom y force for century
  centuryY: 7, // draw to Y coordinate for center of assigned century band

  // custom x force for branch
  branchX: 0.08, // draw to X coordinate based on branch

  // strength of link force by type of link
  leafToBranch: 3.85, // between leaf and branch-century node
  branchToBranch: 2, // between branch century nodes
};

class TimeTree extends TimeTreeKeysMixin(BaseSVG) {
  constructor(data, tags, params) {
    super(); // call base svg constructor

    this.leaves = data.leaves; // input leaf data from json generated by hugo
    this.leafStats = data.stats; // summary info generated by hugo
    this.tags = tags; // dict of tags keyed on slug
    // debugging should only be enabled when configured by hugo site param
    this.debug = params.visual_debug === true;
    if (this.debug) {
      this.checkLeafData();
    }

    // TODO: does it make sense to use branches hugo data ?
    // console.log(params.branches);

    this.leavesByBranch = this.sortAndGroupLeaves();
    this.network = this.generateNetwork();

    this.panel = new Panel();
    // pass in panel reference and list of ids to ignore on hash change
    // (i.e., slugs for branches)
    this.leafmanager = new Leaf(this.panel, Object.values(branches));

    this.drawTimeTree();
    // make tag list available on leaf object
    // (currently needed to update active tag button)
    Leaf.tags = tags;
    // update selection to reflect active tag and/or leaf hash in url on page load
    let status = this.leafmanager.updateSelection();

    // special case: if a tag is selected without a leaf on page load,
    // hide the intro panel
    if (status.tag && !status.leaf) {
      this.panel.close();
      // zoom in on the tagged leaves
      this.zoomToTagged();
    } else if (status.leaf) {
      // if a leaf is selected on load, close the intro
      this.panel.closeIntro();

      // if a tag is active, zoom in on tagged leaves
      if (status.tag) {
        this.zoomToTagged();
      } else {
        // otherwise, zoom in on the selected leaf
        this.zoomToSelectedLeaf();
      }
    }

    // event handlers for adjusting zoom
    // - when the panel is closed, do *nothing*
    // this.panel.el.addEventListener("panel-close", this.resetZoom.bind(this));
    // - when a tag is selected, zoom out to see all tagged leaves
    this.panel.el.parentElement.addEventListener(
      "tag-select",
      this.zoomToTagged.bind(this)
    );
    // - when a tag is deselected, zoom back in on selected leaf
    this.panel.el.parentElement.addEventListener(
      "tag-deselect",
      this.zoomToSelectedLeaf.bind(this)
    );

    // keypress code in timetree keys mixin;
    // requires panel object to close info panel on escape
    this.bindKeypressHandler(this.panel);
  }

  checkLeafData() {
    // check and report on total leaves, unsortable leaves
    console.log(`${this.leaves.length} total leaves`);
    // NOTE: some sort dates set to empty string, "?"; 0 is allowed for earliest sort
    let unsortableLeaves = this.leaves.filter(
      (leaf) => leaf.sort_date === null || leaf.sort_date == ""
    );
    console.log(
      `${unsortableLeaves.length} lea${
        unsortableLeaves.length == 1 ? "f" : "ves"
      } with sort date not set`
    );
  }

  sortAndGroupLeaves() {
    // sort the leaves by date,
    // ignoring any records with sort date unset
    let sortedLeaves = this.leaves
      .filter((leaf) => leaf.sort_date != null)
      .sort((a, b) => a.sort_date - b.sort_date);
    // leaf century is included in json generated by Hugo

    // group leaves by branch, preserving sort order
    return sortedLeaves.reduce((acc, leaf) => {
      let b = leaf.branch;
      leaf.type = "leaf";
      // check that branch is in our list
      if (b in branches) {
        if (acc[b] == undefined) {
          acc[b] = [];
        }
        acc[b].push(leaf);
      } else {
        // report unknown branch and omit from  the tree
        // TODO: only report if not production...
        console.log(`Unknown branch: ${b}`);
      }
      return acc;
    }, {});
  }

  generateNetwork() {
    // generate a network from the leaves
    // so we can use a d3 force layout to positin them

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

    // add leaves to nodes by branch, in sequence;
    // create branch+century nodes as we go
    for (const branch in this.leavesByBranch) {
      // *in* for keys
      // let currentBranchIndex; // = null;
      let currentBranchNodeCount = 0;
      let currentCentury;
      let previousBranchIndex = trunkNodeIndex;
      let branchIndex;
      console.log(branch);
      this.leavesByBranch[branch].forEach((leaf, index) => {
        // check if we need to make a new branch node:
        // - no node exists
        // - too many leaves on current node
        // - century has changed
        if (
          branchIndex == undefined ||
          currentBranchNodeCount > 5 ||
          currentCentury != leaf.century
        ) {
          let branchId = `${branch}-century${leaf.century}-${index}`;
          currentCentury = leaf.century;
          currentBranchNodeCount = 0;

          let type = "branch";
          let id = `${branch}-century${leaf.century}-${index}`;
          let title = `${branch} ${leaf.century}century (${index})`;

          // first node for each branch will be used to create a heading
          if (branchIndex == undefined) {
            type = "branch-start";
            title = branch; // branch name
            id = branches[branch]; // slug for this branch
          }
          nodes.push({
            id: id,
            title: title,
            type: type,
            branch: branch,
            century: leaf.century,
            sort_date: leaf.century * 100, //  + 50,
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

          // store as previous branch for the next created branch
          previousBranchIndex = branchIndex;
        }
        // add the current leaf as a node
        leaf.label = new LeafLabel(leaf.display_title || leaf.title);
        nodes.push(leaf);
        currentBranchNodeCount += 1;
        // add link between leaf and branch
        let leafIndex = nodes.length - 1;
        links.push({
          source: branchIndex,
          target: leafIndex,
          value: forceStrength.leafToBranch,
          branch: leaf.branch,
        });
      });
    }

    return {
      nodes: nodes,
      links: links,
    };
  }

  drawTimeTree() {
    let width = this.getSVGWidth(); // width depends on if mobile or not
    let height = 800;

    // point [0, 0] is the center of the svg
    let min_x = -width / 2;
    let min_y = -height / 2;
    // let [min_x, min_y] = [0, 0];

    // store on the class instance for other methods
    this.width = width;
    this.height = height;
    this.min_y = min_y;
    this.min_x = min_x;

    let svg = d3
      .select("#timetree")
      .append("svg")
      .attr("viewBox", [min_x, min_y, width, height]);

    // create a group within the viz for the zoomable portion of the tree
    // don't draw anything outside of the clip path
    this.vizGroup = svg.insert("g", "#century-axis").attr("id", "#viz");

    // create a section for the background
    let background = this.vizGroup.append("g").attr("id", "background");

    this.svg = svg;
    this.background = background;

    // enable zooming
    this.initZoom();

    // create a y-axis for plotting the leaves by date
    // let yAxisHeight = this.height * 0.6; // leafContainerHeight * this.centuries.length;
    let yAxisHeight = 90 * 6;
    let axisMin = this.min_y + 5;

    // now generating min/max years in hugo json data
    let leafYears = [this.leafStats.maxYear, this.leafStats.minYear];
    // generate list of centuries from min year to up to max
    let centuries = [];
    let century = Math.round(this.leafStats.minYear, 100);
    while (century < this.leafStats.maxYear) {
      centuries.push(century);
      century += 100;
    }

    // create a linear scale to map years to svg coordinates
    this.yScale = d3
      .scaleLinear()
      .domain(leafYears) // max year to min year
      .range([axisMin, axisMin + yAxisHeight]); // highest point on the chart to lowest point for leaves

    this.yAxis = d3
      .axisLeft(this.yScale)
      .tickValues(centuries) // only display senturies
      .tickFormat((x) => {
        return x.toFixed() + "s";
      });

    // axis is always drawn at origin, which for us is the center of the svg;
    // move to the left with enough space for labels to show
    let labelMargin = { x: 4, y: 10 };
    this.gYAxis = svg
      .append("g")
      .attr("id", "century-axis")
      .attr("transform", `translate(${this.min_x + 15},0)`)
      .call(this.yAxis)
      .call((g) => g.attr("text-anchor", "start")) // override left axis default of end
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick")
          .append("rect")
          .lower()
          .attr("class", "tick-bg")
          .attr("x", (d, i, n) => {
            return n[i].parentElement.getBBox().x - labelMargin.x;
          })
          .attr("y", (d, i, n) => {
            return n[i].parentElement.getBBox().y - labelMargin.y;
          })
          .attr("width", 60)
          .attr("height", 38)
      );

    // determine placement for branches left to right
    // NOTE: could this be construed as an axis of some kind?
    this.branchCoords = {};
    let branchMargin = 100;
    // etermine how much space to give to each branch
    let branchWidth = (width - branchMargin * 2) / 5;
    // calculate the midpoint of each branch and set for easy lookup
    for (const [i, b] of Object.keys(branches).entries()) {
      this.branchCoords[b] =
        branchMargin + min_x + i * branchWidth + branchWidth / 2;
    }

    this.trunkTop = this.yScale(this.leafStats.minYear);
    drawTrunk(
      background,
      [this.min_x, this.min_y, this.width, this.height],
      this.trunkTop
    );

    // for debugging: mark the center of the svg
    // svg
    //   .append("circle")
    //   .attr("r", 5)
    //   .attr("fill", "red")
    //   .attr("cx", this.min_x + this.width / 2)
    //   .attr("cy", this.min_y + this.height / 2);*/

    // for debugging: mark the center bottom of the svg
    // this.svg
    //   .append("circle")
    //   .attr("r", 5)
    //   .attr("fill", "red")
    //   .attr("cx", 0)
    //   .attr("cy", this.min_y + this.height);

    let simulation = d3
      .forceSimulation(this.network.nodes)
      .force("charge", d3.forceManyBody().strength(forceStrength.charge))
      // .force("manyBody", d3.forceManyBody().strength(forceStrength.manyBody))
      .force(
        "center",
        d3.forceCenter(0, -this.height / 4).strength(forceStrength.center)
      )
      // .force("center", d3.forceCenter(0, this.min_y + this.height / 4).strength(forceStrength.center))
      // .force("center", d3.forceCenter([this.width/2, this.height/2]).strength(forceStrength.center))
      // .alpha(0.1)
      // .alphaDecay(0.2)
      .force(
        "collide",
        d3.forceCollide().radius((d) => {
          // collision radius varies by node type
          if (d.type == "leaf") {
            return leafSize.width; // - 5;
          }
          return 2;
        })
      )
      .force(
        "link",
        d3.forceLink(this.network.links).strength((link) => {
          return link.value; // link strength defined when links created
        })
      )
      .force(
        "y",
        d3
          .forceY()
          .y((node) => this.centuryY(node))
          .strength(forceStrength.centuryY)
      )
      .force(
        "x",
        d3
          .forceX()
          .x((node) => this.branchX(node))
          .strength((node) => {
            if (node.century != undefined) {
              // apply the force more strongly the further up the tree we go
              return forceStrength.branchX * (node.century - 14);
            }
            return 0;
          })
      );
    // run simulation for 300 ticks without animation
    simulation.tick(300);

    // define once an empty path for nodes we don't want to display
    var emptyPath = d3.line().curve(d3.curveNatural)([[0, 0]]);

    let simulationNodes = this.vizGroup
      .append("g")
      .attr("class", "nodes")
      .selectAll("path")
      .data(this.network.nodes)
      .join("path")
      // draw leaf path for leaves, empty path for everything else
      .attr("d", (d) => {
        return d.type == "leaf" ? new LeafPath().path : emptyPath;
      })
      // for accessibility purposes, leaves are buttons
      .attr("role", (d) => {
        if (d.type == "leaf") {
          return "button";
        } else if (d.type == "branch-start") {
          return "heading";
        }
      })
      .attr("aria-level", (d) => {
        return d.type == "branch-start" ? 2 : null;
      })
      .attr("id", (d) => {
        return d.type == "branch-start " ? d.id : null;
      })
      .attr("aria-label", (d) => {
        if (d.type == "leaf") {
          return d.label.text;
        } else if (d.type == "branch-start") {
          return d.text;
        }
      })
      // reference description by id; short descriptions generated in hugo template
      .attr("aria-describedby", (d) => {
        return d.type == "leaf" ? `desc-${d.id}` : null;
      })
      // make leaves and branch-start keyboard focusable
      .attr("tabindex", (d) => {
        if (d.type == "leaf") {
          return 0;
        } else if (d.type == "branch-start") {
          return -1; // only focusable from link in legend
        }
      })
      .attr("stroke-linejoin", "bevel")
      .attr("id", (d) => {
        return d.type == "branch-start" ? d.id : null;
      })
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
      .on("click", this.selectLeaf.bind(this))
      .on("mouseover", Leaf.highlightLeaf)
      .on("mouseout", Leaf.unhighlightLeaf);

    this.simulationNodes = simulationNodes;

    // add text labels for leaves; position based on the leaf node
    this.nodeLabels = this.vizGroup
      .append("g")
      .attr("id", "labels")
      .selectAll("text")
      .data(this.network.nodes.filter((d) => d.type == "leaf"))
      .join("text")
      // x,y for a circle is the center, but for a text element it is top left
      // set position based on x,y adjusted by radius and height
      .attr("x", (d) => d.x - d.label.radius)
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
      .on("click", this.selectLeaf.bind(this))
      .on("mouseover", Leaf.highlightLeaf)
      .on("mouseout", Leaf.unhighlightLeaf);

    // split labels into words and use tspans to position on multiple lines;
    // inherits text-anchor: middle from parent text element
    this.nodeLabels
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

    if (this.debug) {
      this.visualDebug();
    }

    // only position once after simulation has run
    simulation.on("tick", this.updatePositions.bind(this));
    simulation.tick();
    // simulation.stop();
  }

  maxZoom = 4; // maximum zoom level

  initZoom() {
    // make svg zoomable
    this.zoom = d3
      .zoom()
      // by default, d3 uses window/DOM coordinates for zoom;
      // for convenience & consistency, use svg coordinate system
      .extent([
        [this.min_x, this.min_y],
        [this.min_x + this.width, this.min_y + this.height],
      ])
      .scaleExtent([1, this.maxZoom]) // limit number of zoom levels
      // limit panning to the same extent so we don't zoom beyond the edges
      .translateExtent([
        [this.min_x, this.min_y],
        [this.min_x + this.width, this.min_y + this.height],
      ])
      .filter(
        // use filter to control whether zooming is enabled
        this.isMobile.bind(this)
      )
      .on("zoom", this.zoomed.bind(this));

    // bind zooming behavior to d3 svg selection
    this.svg.call(this.zoom);

    // bind zoom reset behavior to reset button
    d3.select(".reset-zoom").on("click", this.resetZoom.bind(this));
  }

  resetZoom() {
    this.svg.call(this.zoom.transform, d3.zoomIdentity);
  }

  zoomed({ transform }) {
    // handle zoom event
    // update century y-axis for the new scale
    this.gYAxis.call(this.yAxis.scale(transform.rescaleY(this.yScale)));
    let axisLabelTransform = Math.min(2.75, transform.k);
    // zoom axis labels and backgrounds, but don't zoom all the way
    this.gYAxis
      .selectAll("text")
      .attr("transform", `scale(${axisLabelTransform})`);
    this.gYAxis
      .selectAll(".tick-bg")
      .attr("transform", `scale(${axisLabelTransform})`);
    // translate the treeviz portion of the svg
    this.vizGroup.attr("transform", transform);

    // set zoomed class on timetree container to control visibility of
    // labels and reset button (hidden/disabled by default on mobile)
    let container = this.svg.node().parentElement;
    if (transform.k >= 1.2) {
      // enable once we get past 1.2 zoom level
      container.classList.add("zoomed");
      d3.select(".reset-zoom").attr("disabled", null);
    } else {
      container.classList.remove("zoomed");
      d3.select(".reset-zoom").attr("disabled", true);
    }
  }

  selectLeaf(event, d) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      this.leafmanager.currentLeaf = event;
    }
    // TODO: on mobile, this should also scroll to the top of the page
    this.panel.closeIntro(); // close so info button will be active on mobile
    // zoom in on the data point for the selected leaf
    this.zoomToDatum(d);
  }

  zoomToDatum(d, scale) {
    // zoom to a specified point; takes a data entry with an x,y coordinate
    // (generally a data point for a leaf used in the d3 force simulation)
    // scale is optional; if not specified, will scale to maximum zoom level

    if (scale == undefined) {
      scale = this.maxZoom;
    }

    // programmatic zoom skips filters; check if mobile before auto-zooming
    if (this.isMobile()) {
      let transform = d3.zoomIdentity.scale(scale);
      // call the zoom handler to scale the century axis
      this.zoomed({ transform });

      // zooming is bound to the svg;
      // scale and translate to the selected leaf or label
      // scale to max zoom level using element coordinates as focus point.
      this.zoom.scaleTo(this.svg, scale, [d.x, d.y]);

      // transform to coordinates for the selected elment
      this.zoom.translateTo(this.svg, d.x, d.y);
    }
  }

  zoomToSelectedLeaf() {
    // zoom in selected leaf on page load or when a tag is closed
    if (this.isMobile()) {
      // - determine which leaf is currently selected
      let state = this.leafmanager.currentState();
      // if a leaf is currently selected, find datum for the leaf id
      if (state.leaf) {
        let nodes = this.network.nodes.filter((d) => d.id == state.leaf);
        if (nodes.length) {
          this.zoomToDatum(nodes[0]);
        }
      } else {
        // if no leaf is selected, reset zoom
        this.resetZoom();
      }
    }
  }

  zoomToTagged() {
    // zoom out the amount needed to show all leaves with the current tag
    if (this.isMobile()) {
      let state = this.leafmanager.currentState();
      // get data points for all leaves with this tag
      let nodes = this.network.nodes.filter(
        (d) => d.tags != undefined && d.tags.includes(state.tag)
      );
      // collect all the x and y coordinates and determine min and max
      let nodesX = nodes.map((el) => el.x);
      let nodesY = nodes.map((el) => el.y);
      let [min_x, min_y, max_x, max_y] = [
        Math.min(...nodesX),
        Math.min(...nodesY),
        Math.max(...nodesX),
        Math.max(...nodesY),
      ];

      let margin = 100;
      let tagWidth = max_x - min_x;
      let tagHeight = max_y - min_y;
      // use ratio between full width and width needed to show all tagged items
      // determine necessary zoom level; don't go beyond max zoom
      let scale = Math.min(this.width / (tagWidth + margin), this.maxZoom);
      // determine the center of the tags, for focusing the zoom
      let tagCenter = {
        x: min_x + tagWidth / 2,
        y: min_y + tagHeight / 2,
      };

      // zoom in on the tags at the calculated scale
      this.zoomToDatum(tagCenter, scale);
    }
  }

  visualDebug() {
    // visual debugging for layout
    // should be under other layers to avoid interfering with click/touch/hover
    this.debugLayer = this.svg
      .append("g")
      .lower() // make this group the lowest in the stack
      .attr("id", "debug")
      .style("opacity", 0); // not visible by default

    // draw circles and lines in a debug layer that can be shown or hidden;
    // circle size for leaf matches radius used for collision
    // avoidance in the network layout
    this.debugLayer
      .selectAll("circle.debug")
      .data(this.network.nodes)
      .join("circle")
      .attr(
        "class",
        (d) => `debug debug-${d.type} dbg-${getBranchStyle(d.branch) || ""}`
      )
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => {
        if (d.type == "leaf") {
          // return leafSize.width - 5;
          return leafSize.width;
        }
        // note: this is larger than collision radius, increase size for visibility
        return 5; // for branch nodes
      });

    // add lines for links within the network to the debug layer
    this.simulationLinks = this.debugLayer
      .append("g")
      .selectAll("line")
      .data(this.network.links)
      .join("line")
      .attr("class", (d) => {
        return `${d.type || ""} dbg-${getBranchStyle(d.branch) || ""}`;
      });

    this.debugLayer
      .selectAll("line.debug-branch")
      .data(Object.keys(this.branchCoords))
      .join("line")
      .attr("class", (d) => {
        return `debug-branch-x dbg-${getBranchStyle(d)}`;
      })
      .attr("x1", (d) => this.branchCoords[d])
      .attr("y1", this.min_y)
      .attr("x2", (d) => this.branchCoords[d])
      .attr("y2", this.max_y);

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
  }

  centuryY(node) {
    // y-axis force to align nodes by century
    if (node.sort_date) {
      return this.yScale(node.sort_date);
    }
    return 0;
  }

  branchX(node) {
    // x-axis force to align branches left to right based on branch
    if (node.branch !== undefined) {
      return this.branchCoords[node.branch];
    }
    return 0;
  }

  updatePositions() {
    // since nodes are paths and not circles, position using transform + translate
    // rotate leaves to vary the visual display of leaves
    this.simulationNodes.attr("transform", (d, i, n) => {
      // current datum (d), the current index (i), and the current group (nodes)
      // generate a random rotation once and store it in the data
      if (!d.rotation) {
        // store rotation so we don't randomize every tick
        d.rotation = randomNumBetween(125); // Math.random() * 90;
      }
      let rotation = d.rotation;
      if (d.type == "leaf") {
        // rotate negative or positive depending on side of the tree
        if (d.x > 0) {
          rotation = 0 - rotation;
        }
        // leaf coordinates are be centered around 0,0
        return `rotate(${rotation} ${d.x} ${d.y}) translate(${d.x} ${d.y})`;
      }
      // rotate relative to x, y, and move to x, y
      return `translate(${d.x} ${d.y})`;
    });

    // links are only displayed for debugging
    if (this.debug) {
      this.simulationLinks
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
    }

    // draw branches based on the network
    drawBranches(this.network.nodes, this.vizGroup, branches, this.trunkTop);
  }
}

export { TimeTree, forceStrength, getBranchStyle };
