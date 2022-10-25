fetch('index.json')
  .then((response) => response.json())
  .then((data) => {

      // generate list of expected centuries
      // adapted from https://stackoverflow.com/a/10050831/9706217
      let centuries = [...Array(6).keys()].map(i => i + 15).reverse();

      // check and report on unsortable leaves
      let unsortableLeaves = data.leaves.filter(leaf => leaf.sort_date === null);
      console.log(unsortableLeaves.length + (unsortableLeaves.length == 1 ? " leaf" : " leaves") + " with sort date not set");

      // ignore any records with sort date unset
      let sortedLeaves = data.leaves.filter(leaf => leaf.sort_date != null)
        .sort((a, b) => a.sort_date > b.sort_date)
      // use url as id for node in graph; set type to leaf; set century
      sortedLeaves.forEach(leaf => {
        leaf.id = leaf.url;
        leaf.type = "leaf";
        // set century based on sort date
        // - handle special cases first
        if (leaf.sort_date == 0 || leaf.sort_date == "") {
          // put zeros in the 1500s
          leaf.century = 15;
        } else if (leaf.sort_date == "TBA" || leaf.sort_date == "?") {
          // put TBs / ? in the 2000s
          leaf.century = 20;
        } else {
          // otherwise get it from sort date
          leaf.century = leaf.sort_date.toString().substring(0, 2);
        }
      });

      // our nodes will be all leaves plus one for each branch
      let nodes = new Array(... sortedLeaves);


      // get a list of unique branch names from all the leaves
      let branchNames = [... new Set(sortedLeaves.map(leaf => leaf.branch))];
      // create nodes for the branches;
      // create one for each century; use text as id and label
      let branchIndex = new Object();
      branchNames.forEach(b => {
        centuries.forEach(c => {
          let branchId = b + c;
          nodes.push({
            id: branchId,
            title: b + " c" +c,
            type: "branch",
            century: c,
          });
          // keep track of branch indexes for generating links
          branchIndex[branchId] = nodes.length - 1;
        });
      });

      // generate links so we can draw as a network graph
      // each leaf is connected to its branch
      let links = new Array();
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

      // add a node for the trunk
      nodes.push({
        id: 'trunk',
        title: 'trunk',
        type: 'trunk'
      });
      const trunkNodeIndex = nodes.length - 1;  // last node is the trunk
      branchNames.forEach(b => {
        centuries.forEach(c => {
          // each century should be connected to the one before or the trunk
          let sourceBranchId = b + c;
          if (c == 15) {
            target = trunkNodeIndex;
          } else {
            let targetBranchId = b + (c - 1);
            target = branchIndex[targetBranchId];
          }
          links.push({
            source: branchIndex[sourceBranchId],
            target: target,
            value: 10
          });
        });
      });

      TreeGraph({nodes: nodes, links: links, centuries: centuries});

   });


function TreeGraph({nodes, links, centuries}) {
  let width = 1000;
  let height = 300;

  let min_x = -width / 2;
  let min_y = -height / 2;

  let svg =  d3.select("main")
      .append("svg")
      // .attr("viewBox", [0, 0, width, height]);
      .attr("viewBox", [min_x, min_y, width, height]);

  // create a section for the background
  let background = svg.append("g")
    .attr("id", "background");

  // create containers for the leaves by century
  const leafContainerHeight = 45;
  const leafContainers = background.selectAll("rect")
      .data(centuries)
      .join("rect")
        .attr("id", d => "c" + d)
        .attr("height", leafContainerHeight)
        .attr("width", width)
        .attr("x", min_x)
        .attr("y", (d, i) => (min_y + i * leafContainerHeight))
        .attr('fill', "lightgray")
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

  let g = svg.append("g");

  let simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-1))
   //  .force("collide", d3.forceCollide().radius(20))
   //  .force("manyBody", d3.forceManyBody().strength(30))
    .force("center", d3.forceCenter().strength(0.1))
   //  .alpha(0.1)
   //  .alphaDecay(0)
    .force("collide", d3.forceCollide().radius(15))
    .force("link", d3.forceLink(links))  // TODO: adjust to make variable
    .force("y", d3.forceY().y(node => centuryY(node)).strength(0.6))
    // .force("link", d3.forceLink(links).distance(40).strength(0.5))
    // .force("center", d3.forceCenter())
    .on("tick", ticked);


const link = svg.append("g")
      .attr("stroke", "lightgray")
      // .attr("stroke-opacity", linkStrokeOpacity)
      .attr("stroke-width", 1)
      // .attr("stroke-linecap", linkStrokeLinecap)
    .selectAll("line")
    .data(links)
    .join("line");

  var greenColor = d3.scaleSequential(d3.schemeGreens[5]);

  const node = svg.append("g")
      // .attr("stroke", nodeStroke)
      .attr("fill-opacity", 0.6)
      // .attr("stroke-width", nodeStrokeWidth)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("r", 3)
      .attr("fill", d => {return d.type == "leaf" ? greenColor(d.century - 14) : "lightgray" })
      // .attr("fill", d => {return d.type == "leaf" ? "green" : "lightgray" })
      .attr("id", d => d.id)
      .attr("data-sort-date", d => d.sort_date)
      // .call(drag(simulation));

  function ticked() {
    // node.each(function(d) {
    //   // set y and previous y based on our constraints
    //   d.y = d.py = constrainedY(d);
    // });

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y); //constrainedY(d));

      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y) //constrainedY(d.source))
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y) // constrainedY(d.target));

    }


  // scale to map node placement in the svg to century container
  var leafScale = d3.scaleRadial()
    .domain([min_y, min_y + height]) // svg starts negative
    .range([0, leafContainerHeight ])
    .clamp(true);


  function centuryY(node) {
    if (node.type == 'trunk') {
      return height - 150;
    } else {
      // draw nodes vertically to the middle of appropriate century container
      return min_y + (leafContainerHeight / 2) + leafConstraints[node.century].top;
    }
    return 0;
  }

  function constrainedY(node) {
    if (node.type == 'branch') {
      // put branch nodes vertically in the middle of appropriate century container
      return min_y + (leafContainerHeight / 2) + leafConstraints[node.century].top;
    } else if (node.type == 'trunk') {
      return height - 150;
    } else {
      // otherwise, use century to position vertically
      // set offset within container to a random number
      let offset = getRandomInt(leafContainerHeight);

      // let offset = leafScale(node.y);
      if (node.century in leafConstraints) {
        let centuryTop = min_y + leafConstraints[node.century].top;
        // if the node is already inside the container, don't move it
        if (node.y > centuryTop && node.y < centuryTop + leafContainerHeight) {
          return node.y;
        }
        offset += leafConstraints[node.century].top;
      }
      if (offset != undefined) {
        let next_y = min_y + offset;
        return min_y + offset;
      }
      // don't allow to go beyond the bounds of our svg
      return Math.min(Math.max(node.y, min_y), height);
    }
  }

   //  .force("collide", d3.forceCollide().radius(20))
   //  .force("manyBody", d3.forceManyBody().strength(30))
   //  .force("center", d3.forceCenter().strength(smooth ? 0.01 : 1))
   //  .alpha(0.1)
   //  .alphaDecay(0)

   // simulation.nodes(nodes);
   // simulation.links(links);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
