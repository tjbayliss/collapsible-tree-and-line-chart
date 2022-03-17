/*
  PROTOTYPE COMMENTS:

  - currently built in d3 v5
  - build based on this example version code: https://bl.ocks.org/d3noob/1a96af738c89b88723eb63456beb6510


  TO DOs:
  - fully comment code
*/

console.log("PEARL - Tree Chart");

pearlData.coloursAvailable = pearlData.colours;
var filesToUse = "test"; /* "test" */

function drawCollapsibleTreeChart(values, selectValue) {
  console.log("values:", values);

  pearlData.tree = {};

  values.forEach(function (d, i) {
    var node = d;
    var nodeParent = d.parent_id;
    console.log(nodeParent, node);

    if (nodeParent == "root") {
      node.children = [];
      pearlData.tree[nodeParent] = node;
    }
  }); // end forEach ...
  console.log(pearlData.tree);

  // OLD CODE USING HARDCODED MANIPUALTED JSON OBJ.
  pearlData.collapsibleTreeData = {
    name: selectValue,
    children: values[0].data,
  };
  console.log(pearlData.collapsibleTreeData);

  pearlData.collapsibleTreeNodeData = {};

  var layer = pearlData.collapsibleTreeData.children;

  recurse(layer);

  function recurse(layer) {
    if (layer.length == 0) {
      // stop calling itself
      //...
    } else {
      layer.forEach(function (d, i) {
        if (d.children.length > 0) {
          var layer = d;

          layer.zippedData = d3.zip(
            layer["concepts"],
            layer["page_rank"],
            layer["relevance"]
          );

          layer.JSONMappedZippedDataForSMBarChart = layer.zippedData.map(
            function (d, i) {
              return { concept: d[0], page_rank: d[1], relevance: d[2] };
            }
          );

          pearlData.collapsibleTreeNodeData[layer.label] = layer;
          layer.children.forEach(function (d, i) {
            if (d.children.length > 0) {
              recurse(d);
            } else {
              d.zippedData = d3.zip(
                d["concepts"],
                d["page_rank"],
                d["relevance"]
              );

              d.JSONMappedZippedDataForSMBarChart = d.zippedData.map(function (
                d,
                i
              ) {
                return { concept: d[0], page_rank: d[1], relevance: d[2] };
              });

              pearlData.collapsibleTreeNodeData[d.label] = d;
            }
          });
        } else {
          d.zippedData = d3.zip(d["concepts"], d["page_rank"], d["relevance"]);

          d.JSONMappedZippedDataForSMBarChart = d.zippedData.map(function (
            d,
            i
          ) {
            return { concept: d[0], page_rank: d[1], relevance: d[2] };
          });
          pearlData.collapsibleTreeNodeData[d.label] = d;
        }
      });
    } // end else ...
  } // end recurse ...

  console.log("pearlData.collapsibleTreeData:", pearlData.collapsibleTreeData);

  // Set the dimensions and margins of the diagram

  var w = window.innerWidth;
  var h = window.innerHeight;

  var margin = { top: 25, right: 5, bottom: 25, left: 100 },
    width = w / 2 - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;

  var svg = d3
    .selectAll(".collapsible-tree-svg")
    .attr("width", width)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("class", "collapsible-tree-group")
    .attr("transform", "translate(" + margin.left + "," + 0 + ")");

  var i = 0,
    duration = 750,
    root;

  // declares a tree layout and assigns the size
  var treemap = d3.tree().size([height, width]);

  // Assigns parent, children, height, depth
  root = d3.hierarchy(pearlData.collapsibleTreeData, function (d) {
    return d.children;
  });

  root.x0 = height / 2;
  root.y0 = 0;

  // Collapse after the second level
  root.children.forEach(collapse);

  update(root);

  // Collapse the node and all it's children
  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  function update(source) {
    // Assigns the x and y position for the nodes
    var treeData = treemap(root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
      d.y = d.depth * 175;
    });

    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = svg.selectAll("g.node").data(nodes, function (d) {
      return d.id || (d.id = ++i);
    });

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      });

    // Add Circle for the nodes
    nodeEnter
      .append("circle")
      .attr("class", function (d, i) {
        return "node node-" + i;
      })
      .attr("r", 1e-6)
      .style("fill", function (d) {
        return d._children ? "#0070a8" : "#fff";
      })
      .on("click", clickNode);

    // https://www.geeksforgeeks.org/how-to-get-the-elements-of-one-array-which-are-not-present-in-another-array-using-javascript/
    // pearlData.colours2 = [1, 2, 3, 4];
    // pearlData.coloursUsed2 = [4, 2];
    // console.log(pearlData.colours2);

    // pearlData.coloursAvailable2 = pearlData.colours2.filter(function (i) {
    //   return this.indexOf(i) < 0;
    // }, pearlData.coloursUsed2);
    // pearlData.colourToUse2 = pearlData.coloursAvailable2[0];

    // console.log(
    //   "pearlData.colours2:",
    //   pearlData.colours2,
    //   "coloursAvailable2:",
    //   pearlData.coloursAvailable2,
    //   "colourToUse2:",
    //   pearlData.colourToUse2
    // );

    // Add Circle to allow user to click to display/hide line chart
    nodeEnter
      .append("circle")
      .attr("class", function (d, i) {
        var name = d.data.name.replaceAll(" ", "-");
        var isSelected = d.data.name == pearlData.topic ? "line-selected" : "";
        return "lineNode lineNode-" + i + " " + name + " " + isSelected;
      })
      .attr("cx", function (d) {
        return 10;
      })
      .attr("cy", function (d) {
        return 10;
      })
      .attr("r", 5)
      .style("pointer-events", function (d, i) {
        return d.data.name == pearlData.topic ? "none" : "auto";
      })
      .style("fill", function (d) {
        return d.data.name == pearlData.topic ? "#cedbe0" : "#FFFFFF";
      })
      .on("click", function (d, i) {
        var circle = d3.select(".lineNode.lineNode-" + i);

        var category = d.data.label;
        pearlData.selectedSupTopicNode = category;

        // if maximum number of lines has already been reached ...
        if (pearlData.lineCounter == pearlData.colours.length) {
          pearlData.maxLinesReached = true;
          console.log("reached max number of lines:", pearlData.lineCounter);

          if (circle.classed("line-selected")) {
            pearlData.lineCounter--;

            var circleColour = d3.select(this).style("fill");

            circle.classed("line-selected", false).style("fill", "#FFF");

            pearlData.coloursAvailable.push(circleColour);

            var index = pearlData.coloursUsed.indexOf(circleColour);
            pearlData.coloursUsed.splice(index, 1);

            lineAddRemove("");
          }
          return;

          // else if maximum number of lines has NOT already been reached ...
        } else {
          // if line has already been selected ...
          if (circle.classed("line-selected")) {
            pearlData.lineCounter--;

            var circleColour = d3.select(this).style("fill");

            circle.classed("line-selected", false).style("fill", "#FFF");

            pearlData.coloursAvailable.push(circleColour);
            var index = pearlData.coloursUsed.indexOf(circleColour);
            pearlData.coloursUsed.splice(index, 1);
          }

          // if line has NOT already been selected ...
          else {
            pearlData.lineCounter++;

            // console.log(
            //   "selecting Line - new line count:",
            //   pearlData.lineCounter
            // );

            pearlData.coloursAvailable = pearlData.colours.filter(function (i) {
              return this.indexOf(i) < 0;
            }, pearlData.coloursUsed);

            pearlData.colourToUse = pearlData.coloursAvailable[0];
            pearlData.coloursUsed.push(pearlData.colourToUse);

            circle
              .classed("line-selected", true)
              .style("fill", pearlData.colourToUse);
          }

          lineAddRemove(pearlData.colourToUse);
          // draw();
        }
        return;
      });

    // Add labels for the nodes
    nodeEnter
      .append("text")
      .attr("dy", ".35em")
      .attr("class", "node-text-label")
      .attr("x", function (d) {
        return d.children || d._children ? -15 : 20;
        // return 0;
      })
      .attr("y", function (d) {
        // return d.children || d._children ? -13 : 13;
        // return -20;
        return 0;
      })
      .attr("text-anchor", function (d) {
        return d.children || d._children ? "end" : "start";
        // return "middle";
      })
      .text(function (d) {
        return d.data.name;
      });

    // Add count labels for the nodes
    nodeEnter
      .append("text")
      .attr("class", "node-text-count")
      .attr("dy", ".35em")
      .attr("x", function (d) {
        return 0;
      })
      .attr("text-anchor", function (d) {
        return "middle";
      })
      .text(function (d) {
        return d.children || d._children ? d.data.children.length : "";
      });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate
      .transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

    // Update the node attributes and style
    nodeUpdate
      .select("circle.node")
      .attr("r", function (d, i) {
        console.log(d);
        return 10;
      })
      .style("fill", function (d) {
        return d._children ? "#0070a8" : "#fff";
      })
      .attr("cursor", "pointer");

    // Remove any exiting nodes
    var nodeExit = node
      .exit()
      .transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select("circle").attr("r", 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select("text").style("fill-opacity", 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = svg.selectAll("path.link").data(links, function (d) {
      return d.id;
    });

    // Enter any new links at the parent's previous position.
    var linkEnter = link
      .enter()
      .insert("path", "g")
      .attr("class", "link")
      .attr("d", function (d) {
        var o = { x: source.x0, y: source.y0 };
        return diagonal(o, o);
      });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate
      .transition()
      .duration(duration)
      .attr("d", function (d) {
        return diagonal(d, d.parent);
      });

    // Remove any exiting links
    var linkExit = link
      .exit()
      .transition()
      .duration(duration)
      .attr("d", function (d) {
        var o = { x: source.x, y: source.y };
        return diagonal(o, o);
      })
      .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {
      path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;

      return path;
    }

    // Toggle children on click.
    function clickNode(d) {
      var category = d.data.label;
      pearlData.selectedSupTopicNode = d.data.label;

      addOneTimeContent();
      draw(category);
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);

      return;
    } // end function click

    // function clickLineIndicator(/* category */) {
    //   lineAddRemove(/* category */);
    //   return;
    // } // end clickLineIndicator
  }

  return;
} // end function drawCollapsibleTreeChart

Array.prototype.chunk = function (n) {
  if (!this.length) {
    return [];
  }
  return [this.slice(0, n)].concat(this.slice(n).chunk(n));
};

function addOneTimeContent() {
  getSmallMultiplesChartDimensions();

  d3.selectAll(".staticTextLabel").remove();

  d3.selectAll(".small-multiples-svg")
    .attr("width", pearlData.smallMultiplesChart.width)
    .attr(
      "height",
      pearlData.smallMultiplesChart.height +
        pearlData.smallMultiplesChart.margin.top +
        pearlData.smallMultiplesChart.margin.bottom
    )
    .append("g")
    .attr("class", "small-multiples-svg-group")
    .attr(
      "transform",
      "translate(" +
        pearlData.smallMultiplesChart.margin.left +
        "," +
        pearlData.smallMultiplesChart.margin.top +
        ")"
    );

  d3.selectAll(".small-multiples-svg-group")
    .append("text")
    .attr("class", "staticTextLabel sortLabel page_rank selected-sortOrder")
    .attr("id", "page_rank")
    .attr("x", pearlData.smallMultiplesChart.margin.left)
    .attr("y", pearlData.smallMultiplesChart.margin.top)
    .text("page_rank")
    .style("text-anchor", "start")
    .on("click", function () {
      changeRankingOrder(this.id);
      return;
    });

  d3.selectAll(".small-multiples-svg-group")
    .append("text")
    .attr("class", "staticTextLabel selectedSubTopicTitle")
    .attr("id", "selectedSubTopicTitle")
    .attr("x", pearlData.smallMultiplesChart.width / 2)
    .attr("y", pearlData.smallMultiplesChart.margin.top)
    .style("font-size", "1.5rem")
    .style("font-weight", "bold")
    .style("text-anchor", "middle")
    .text(pearlData.selectedSupTopicNode);

  d3.selectAll(".small-multiples-svg-group")
    .append("text")
    .attr("class", "staticTextLabel sortLabel relevance")
    .attr("id", "relevance")
    .attr(
      "x",
      pearlData.smallMultiplesChart.width -
        pearlData.smallMultiplesChart.margin.right -
        pearlData.smallMultiplesChart.margin.left
    )
    .attr("y", pearlData.smallMultiplesChart.margin.top)
    .text("relevance")
    .style("text-anchor", "end")
    .on("click", function () {
      changeRankingOrder(this.id);
      return;
    });

  return;
} // end function addOneTimeContent

// https://codepen.io/jorgemaiden/pen/YgGZMg
var linkToggle = document.querySelectorAll(".js-toggle");

for (i = 0; i < linkToggle.length; i++) {
  linkToggle[i].addEventListener("click", function (event) {
    event.preventDefault();

    var container = document.getElementById(this.dataset.container);

    if (!container.classList.contains("active")) {
      container.classList.add("active");
      // document
      //   .getElementById("instructionLabel")
      //   .html("Instructions for Prototype");
      container.style.height = "auto";

      var height = container.clientHeight + "px";

      container.style.height = "0px";

      setTimeout(function () {
        container.style.height = height;
      }, 0);
    } else {
      container.style.height = "0px";

      container.addEventListener(
        "transitionend",
        function () {
          container.classList.remove("active");
        },
        {
          once: true,
        }
      );
    }
  });
}

// https://www.javascripttutorial.net/javascript-dom/javascript-radio-button/
// var btn = document.querySelector("#submitTopic");
// var radioButtons = document.querySelectorAll('input[name="topic"]');
// btn.addEventListener("click", () => {
//   for (var radioButton of radioButtons) {
//     if (radioButton.checked) {
//       selected = radioButton.value;
//       break;
//     }
//   }
//   console.log("selected:", selected);

//   d3.selectAll(".mask").classed("hide", true);
//   d3.selectAll(".container").classed("hide", false);

//   var promises = [];

//   var dataFiles = {
//     aerogels: {
//       treeChart: "data/aerogels/data-treeChart.json",
//       lineChart: "data/aerogels/data-lineChart.json",
//     },
//     "black holes": {
//       treeChart: "data/black holes/data-treeChart.json",
//       lineChart: "data/black holes/data-lineChart.json",
//     },
//   };

//   var files = [
//     // dataFiles[pearlData.topic].treeChart,
//     // dataFiles[pearlData.topic].lineChart,
//     dataFiles[selected].treeChart,
//     dataFiles[selected].lineChart,
//   ];

//   console.log(files);

//   files.forEach(function (url) {
//     console.log(url);
//     promises.push(d3.json(url));
//   });

//   Promise.all(promises)
//     .then(function (values) {
//       console.group(values);
//       drawCollapsibleTreeChart(values[0]);
//       drawLineChart(values[1]);
//     })
//     .catch(function (error) {
//       // Do some error handling.
//       console.log("error!:", error);
//     });
// });
