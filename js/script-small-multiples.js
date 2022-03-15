/*
USWFUL LINKS:
https://bl.ocks.org/syncopika/f1c9036b0deb058454f825238a95b6be  - updating a bar chart with d3.js (v4)
https://www.d3-graph-gallery.com/graph/barplot_button_data_hard.html - Button to change input data in barplot (upgraded)
https://riptutorial.com/d3-js/example/20318/updating-the-data--a-basic-example-of-enter--update-and-exit-selections
https://jsfiddle.net/ysr5aohw/ - Updating the data: a basic example of enter, update and exit selections

*/

console.log("PEARL - Small Multiples Chart");

pearlData.smallMultiplesChart = {};

// Set the dimensions and margins of the diagram
function getSmallMultiplesChartDimensions() {
  pearlData.smallMultiplesChart.w = window.innerWidth;
  pearlData.smallMultiplesChart.h = window.innerHeight;
  pearlData.smallMultiplesChart.margin = {
    top: 25,
    right: 5,
    bottom: 25,
    left: 10,
  };

  pearlData.smallMultiplesChart.width =
    pearlData.smallMultiplesChart.w / 2 -
    pearlData.smallMultiplesChart.margin.left -
    pearlData.smallMultiplesChart.margin.right;

  pearlData.smallMultiplesChart.height =
    550 -
    pearlData.smallMultiplesChart.margin.top -
    pearlData.smallMultiplesChart.margin.bottom;

  return;
} // end function getSmallMultiplesChartDimensions

function changeRankingOrder(fid) {
  d3.selectAll(".sortLabel.page_rank").classed(
    "selected-sortOrder",
    !d3.selectAll(".sortLabel.page_rank").classed("selected-sortOrder")
  );

  d3.selectAll(".sortLabel.relevance").classed(
    "selected-sortOrder",
    !d3.selectAll(".sortLabel.relevance").classed("selected-sortOrder")
  );

  pearlData.smallMultipleSortVariable = fid;

  pearlData.zippedData.sort(function (x, y) {
    return d3.descending(
      x[pearlData.smallMultipleSortVariable],
      y[pearlData.smallMultipleSortVariable]
    );
  });

  pearlData.topX = pearlData.zippedData.slice(
    0,
    pearlData.smallMultipleChartSliceSize
  );

  getData();

  pearlData.chunkingResult.forEach(function (d, i) {
    layer = d;
    layerIndex = i;
    manipulateDataBars(layerIndex, layer);
  });

  d3.selectAll(".smallMultipleChart.axis.axis--y")
    .selectAll(".tick text")
    .style("display", "none");
  // .attr("x", function (d, i) {
  //   return pearlData.smallMultiplesChart.x(0.1);
  // });

  addTicks();

  return;
} // end function changeRankingOrder

function getData() {
  pearlData.chunkingResult = pearlData.topX.reduce(
    (resultArray, item, index) => {
      const chunkIndex = Math.floor(index / pearlData.perChunk);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    },
    []
  );

  // https://stackoverflow.com/questions/36616397/d3-best-way-to-find-max-value-in-a-json-object
  var maxValuesPerSet = [];

  pearlData.chunkingResult.forEach(function (d, i) {
    var array = d;
    maxValuesPerSet.push(
      d3.max(array, function (d) {
        return d[pearlData.smallMultipleSortVariable];
      })
    );
  }); // end forEach loop

  pearlData.smallMultiplesChartxDomainMaximum = d3.max(maxValuesPerSet);

  return;
} // end function getData()

function draw() {
  getSmallMultiplesChartDimensions();

  pearlData.zippedData =
    pearlData.collapsibleTreeNodeData[
      pearlData.selectedSupTopicNode
    ].JSONMappedZippedDataForSMBarChart;

  pearlData.zippedData.sort(function (x, y) {
    return d3.descending(
      x[pearlData.smallMultipleSortVariable],
      y[pearlData.smallMultipleSortVariable]
    );
  });

  console.log(pearlData.zippedData);

  pearlData.topX = pearlData.zippedData.slice(
    0,
    pearlData.smallMultipleChartSliceSize
  );

  d3.selectAll(".small-multiple-group").remove();
  getData();

  pearlData.chunkingResult.forEach(function (d, i) {
    var layerIndex = i;
    var layer = d;

    d3.selectAll(".small-multiples-svg-group")
      .append("g")
      .attr("class", function (d, i) {
        return "small-multiple-group small-multiple-group-" + layerIndex;
      })
      .attr(
        "transform",
        "translate(" +
          Number(pearlData.smallMultiplesChart.margin.left + 200 * i) +
          "," +
          pearlData.smallMultiplesChart.margin.top +
          ")"
      );

    // http://using-d3js.com/04_07_ordinal_scales.html
    pearlData.smallMultiplesChart.x = d3.scaleLinear().range([0, 150]);
    xAxis = d3.axisBottom(pearlData.smallMultiplesChart.x).ticks(4);

    pearlData.smallMultiplesChart.y = d3
      .scaleBand()
      .range([
        pearlData.smallMultiplesChart.margin.top,
        pearlData.smallMultiplesChart.height -
          pearlData.smallMultiplesChart.margin.top -
          pearlData.smallMultiplesChart.margin.bottom,
      ])
      .paddingOuter([0.25])
      .paddingInner([0.1]);

    yAxis = d3.axisLeft(pearlData.smallMultiplesChart.y);

    d3.selectAll(".small-multiple-group.small-multiple-group-" + layerIndex)
      .append("g")
      .attr("class", function (d, i) {
        return "smallMultipleChart axis axis--y axis--y-" + layerIndex;
      })
      .attr("transform", "translate(" + 0 + "," + 0 + ")")
      .call(yAxis);

    d3.selectAll(".small-multiple-group.small-multiple-group-" + layerIndex)
      .append("g")
      .attr("class", function (d, i) {
        return "smallMultipleChart axis axis--x axis--x-" + layerIndex;
      })
      .attr("transform", function (d, i) {
        return (
          "translate(" +
          0 +
          "," +
          (pearlData.smallMultiplesChart.height -
            pearlData.smallMultiplesChart.margin.top -
            pearlData.smallMultiplesChart.margin.bottom) +
          ")"
        );
      })
      .call(xAxis);

    d3.selectAll(".axis.axis--x")
      .selectAll(".tick")
      .selectAll("text")
      .style("text-anchor", "middle")
      .attr("x", 0);

    manipulateDataBars(layerIndex, layer);
  }); // end ForEach loop ...

  d3.selectAll(".smallMultipleChart.axis.axis--y")
    .selectAll(".tick text")
    .style("display", "none");
  // .attr("x", function (d, i) {
  //   return pearlData.smallMultiplesChart.x(0.1);
  // });

  addTicks();

  return;
} // end function draw()

function addTicks() {
  d3.selectAll(".xAxisTicks").remove();

  // draw tick grid lines extending from y-axis ticks on axis across scatter graph
  var xticks = d3
    .selectAll(".small-multiples-svg")
    .selectAll(".small-multiples-svg-group")
    .selectAll(".small-multiple-group")
    .selectAll(".axis.axis--x")
    .selectAll(".tick");

  xticks
    .append("svg:line")
    .attr("class", "xAxisTicks")
    .attr("y0", 0)
    .attr(
      "y1",
      -pearlData.smallMultiplesChart.height +
        pearlData.smallMultiplesChart.margin.top +
        pearlData.smallMultiplesChart.margin.top +
        pearlData.smallMultiplesChart.margin.bottom
    )
    .attr("x1", 0)
    .attr("x2", 0)
    .style("stroke-width", 0.5)
    .style("stroke", "#a0a0a0")
    .style("opacity", 0.33);

  return;
} // end addTicks

function manipulateDataBars(layerIndex, layer) {
  var lyr = layer.map(function (d, i) {
    return {
      concept: d.concept,
      page_rank: d["page_rank"],
      relevance: d["relevance"],
    };
  });

  pearlData.smallMultiplesChart.x.domain([
    0,
    pearlData.smallMultiplesChartxDomainMaximum,
  ]);

  xAxis = d3.axisBottom(pearlData.smallMultiplesChart.x).ticks(4);

  pearlData.smallMultiplesChart.y.domain(
    lyr.map(function (d, i) {
      return d.concept;
    })
  );

  var bars = d3
    .selectAll(".small-multiple-group.small-multiple-group-" + layerIndex)
    .selectAll(".bars")
    .data(lyr, function (d) {
      return d.concept;
    });

  var barLabels = d3
    .selectAll(".small-multiple-group.small-multiple-group-" + layerIndex)
    .selectAll(".barLabels")
    .data(lyr, function (d) {
      return d.concept;
    });

  var maskingBars = d3
    .selectAll(".small-multiple-group.small-multiple-group-" + layerIndex)
    .selectAll(".maskingBars")
    .data(lyr, function (d) {
      return d.concept;
    });

  bars.exit().transition().duration(750).attr("width", 0).remove();
  barLabels.exit().transition().duration(750).style("opacity", 0).remove();
  maskingBars.exit().transition().duration(750).attr("width", 0).remove();

  bars
    .enter()
    .append("rect")
    .attr("class", "bars")
    .attr("x", function (d, i) {
      return pearlData.smallMultiplesChart.x(0);
    })
    .attr("y", function (d) {
      return pearlData.smallMultiplesChart.y(d.concept);
    })
    .attr("width", 0)
    .attr("height", pearlData.smallMultiplesChart.y.bandwidth())
    .style("fill", function (d) {
      return "#0070a8";
    })
    .merge(bars)
    .transition()
    .duration(750)
    .delay(750)
    .attr("y", function (d) {
      return pearlData.smallMultiplesChart.y(d.concept);
    })
    .attr("width", function (d) {
      return pearlData.smallMultiplesChart.x(
        d[pearlData.smallMultipleSortVariable]
      );
    });

  maskingBars
    .enter()
    .append("rect")
    .attr("class", "maskingBars")
    .attr("x", function (d, i) {
      return pearlData.smallMultiplesChart.x(0);
    })
    .attr("y", function (d) {
      return pearlData.smallMultiplesChart.y(d.concept);
    })
    .attr("width", function (d, i) {
      return pearlData.smallMultiplesChart.x(
        pearlData.smallMultiplesChart.x.domain()[1] -
          pearlData.smallMultiplesChart.x.domain()[0]
      );
    })
    .attr("height", pearlData.smallMultiplesChart.y.bandwidth())
    .on("mouseover", function (d, i) {
      d3.selectAll(
        ".barLabels.barLabel-" + d.concept.replaceAll(" ", "-")
      ).text(d.concept);
    })
    .on("mouseout", function (d, i) {
      d3.selectAll(".barLabels").text(function (d, i) {
        var str = d;
        return str.concept.length > 25
          ? str.concept.slice(0, 25) + "..."
          : str.concept;
      });
    })
    .merge(maskingBars)
    .transition()
    .duration(750)
    .delay(750)
    .attr("y", function (d) {
      return pearlData.smallMultiplesChart.y(d.concept);
    });

  barLabels
    .enter()
    .append("text")
    .attr("class", function (d, i) {
      return "barLabels barLabel-" + d.concept.replaceAll(" ", "-");
    })
    .attr("x", function (d, i) {
      return pearlData.smallMultiplesChart.x(0) + 5;
    })
    .attr("y", function (d) {
      return (
        pearlData.smallMultiplesChart.y(d.concept) +
        pearlData.smallMultiplesChart.y.bandwidth() / 2
      );
    })
    .attr("dy", "0.3em")
    .style("fill", function (d) {
      return "#000";
    })
    .style("font-size", function (d) {
      return "0.75rem";
    })
    .style("opacity", 0)
    .text(function (d, i) {
      return d.concept;
    })
    .merge(barLabels)
    .transition()
    .duration(750)
    .delay(750)
    .attr("y", function (d) {
      return (
        pearlData.smallMultiplesChart.y(d.concept) +
        pearlData.smallMultiplesChart.y.bandwidth() / 2
      );
    })
    .text(function (d, i) {
      return d.concept.length > 25 ? d.concept.slice(0, 25) + "..." : d.concept;
    })
    .style("opacity", 1)
    .style("pointer-events", "none");

  d3.selectAll(".smallMultipleChart.axis.axis--y.axis--y-" + layerIndex)
    .transition()
    .duration(750)
    .delay(750)
    .call(yAxis);

  d3.selectAll(".smallMultipleChart.axis.axis--x.axis--x-" + layerIndex)
    .transition()
    .duration(750)
    .delay(750)
    .call(xAxis);

  // bring chart axes to front. Must come after adding bars ...
  d3.selectAll(".axis.axis--x.axis--x-" + layerIndex).moveToFront();
  d3.selectAll(".axis.axis--y.axis--y-" + layerIndex).moveToFront();

  return;
} // end function manipulateDataBars()
