fetch('index.json')
  .then((response) => response.json())
  .then((data) => {
    drawTree(data);
   });


function drawTree(data) {

    const width = 1100;
    const height = 460;

    const svg = d3.select("main")
          .append("svg")
    svg.attr("width", width)
      .attr("height", height);


      let midx = width / 2;

      let length_ratio = 0.9;
      let angle_adjust = 1.9;

      let first_height = height/3;
      // draw the trunk
      let end = drawBranch(svg, midx, height, first_height);

      const annotations = [];

      // gather lowest set of branches / leaves
      let sortedLeaves = data.leaves.sort((a, b) => a.sort_date > b.sort_date)
      // sort by sort date and then limit by century
      let sixteens = sortedLeaves.filter(leaf => leaf.sort_date.toString().startsWith('16'));
      let sixteen_ends = [];

      // figure out angles based on necessary number
        // let angle_start = angle - angle_adjust;
        // let angle_end = angle + angle_adjust;
        // let subangle = (angle_start - angle_end) / (n_children - 1);

        // subset the available angle range; branches go from + to - angle adjust,
        // so angle adjustment times two divided by number of children minus 1
        let subangle_adjust = (angle_adjust * 2) / (sixteens.length - 1);

        // start at full negative angle adjustment
        let current_angle_adjustment = - angle_adjust;
        for (let i = 0; i < sixteens.length; i++) {
          // draw a line for each requested branch

          // drawline(x, y, length * length_ratio, Math.max(2, n_children - 1), angle + current_angle_adjustment, width/2, depth + 1);
          let leaf_coords = drawBranch(svg, end[0], end[1], first_height * length_ratio, current_angle_adjustment, 3);
          sixteen_ends.push({'coords': leaf_coords, 'angle': current_angle_adjustment});

          // add an annotation at the end of the branch
          annotations.push({
            note: {
                label: sixteens[i].display_date,
                title: sixteens[i].title,
              },
              // attach annotation to end of branch, for now
              x: leaf_coords[0],
              y: leaf_coords[1]
          });

          // adjust the angle for the next branch
          current_angle_adjustment += subangle_adjust;
        }

    let seventeens = sortedLeaves.filter(leaf => leaf.sort_date.toString().startsWith('17'));
    console.log(sixteens.length + ' sixteens; ' + seventeens.length + ' seventeens');
    subangle_adjust = (angle_adjust * 2) / (seventeens.length - 1);

    // happens to match equally in this set
    for (let i = 0; i < sixteens.length; i++) {
        let startingpoint = sixteen_ends[i];
        current_angle_adjustment = startingpoint.angle;

        // offset angle slightly so it doesn't just continue from main branch
        let angleOffset = (Math.random() * 0.8) - 0.4;

        let leaf_coords = drawBranch(svg, startingpoint.coords[0], startingpoint.coords[1], (first_height * length_ratio) * 0.5, current_angle_adjustment + angleOffset, 2);
      // sixteen_ends.push({'coords': leaf_coords, 'angle': current_angle_adjustment});

        // add an annotation at the end of the branch
          annotations.push({
            note: {
                label: seventeens[i].display_date,
                title: seventeens[i].title,
              },
              // attach annotation to end of branch, for now
              x: leaf_coords[0],
              y: leaf_coords[1]
          });

     // adjust the angle for the next branch
      current_angle_adjustment += subangle_adjust;
    }


    // draw all our annotations
    const makeAnnotations = d3.annotation()
      .editMode(true)  // make draggable
      //also can set and override in the note.padding property
      //of the annotation object
      .notePadding(15)
      .type(d3.annotationLabel)
      .annotations(annotations)

    d3.select("svg")
      .append("g")
      .attr("class", "annotation-group")
      .call(makeAnnotations)


}

function drawBranch(svg, start_x, start_y, length, angle = 0, width=5) {

    let start = [start_x, start_y];
    let x = start_x + length * Math.sin( angle );
    let y = start_y - length * Math.cos( angle );
    svg.append("path")
        .attr("d", d3.line()([start, [x, y]]))
        .attr("stroke", "black")
        .attr("stroke-width", width)
        .attr("fill", "none");

    return [x, y];
}



function drawline(start_x, start_y, length, n_children=2, angle = 0, width = 5, depth = 1) {


      let start = [start_x, start_y];
      var x = start_x + length * Math.sin( angle );
        var y = start_y - length * Math.cos( angle );

      svg.append("path")
      //  .attr("d", d3.line()([start, [x, y]]))
        .attr("d", d3.line()([start, start]))
        .attr("stroke", "black")
        .attr("stroke-width", Math.min(width/2, 1)) // width)
        .attr("fill", "none")
        .transition()
          .duration(800)
          .attr("d", d3.line()([start, [x, y]]))
        .transition()
          .duration(1000)
          .attr("stroke-width", width)

      if (depth < 5) { // || width > 1) {

        // figure out how many branches to draw based on the number of requested children
        // let angle_start = angle - angle_adjust;
        // let angle_end = angle + angle_adjust;
        // let subangle = (angle_start - angle_end) / (n_children - 1);

        // subset the available angle range; branches go from + to - angle adjust,
        // so angle adjustment times two divided by number of children minus 1
        let subangle_adjust = (angle_adjust * 2) / (n_children - 1);

        // start at full negative angle adjustment
        let current_angle_adjustment = - angle_adjust;
        for (let i = 0; i < n_children; i++) {
          // draw a line for each requested sub branch

          // randomize the number of child branches
          let num_children = Math.max(2, Math.floor(Math.random() * 7) + 1);

          // drawline(x, y, length * length_ratio, Math.max(2, n_children - 1), angle + current_angle_adjustment, width/2, depth + 1);
          drawline(x, y, length * length_ratio, num_children, angle + current_angle_adjustment, width/2, depth + 1);
          // adjust the angle for the next branch
          current_angle_adjustment += subangle_adjust;
        }
      }

    }


