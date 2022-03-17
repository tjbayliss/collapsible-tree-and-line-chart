/*
  PROTOTYPE COMMENTS:

  - currently built in d3 v4
  - build based on this example version code:
      https://bl.ocks.org/d3noob/1a96af738c89b88723eb63456beb6510
      https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172
      
      also uswful .. good design ...  (but d3 v3)
      https://bl.ocks.org/robyngit/89327a78e22d138cff19c6de7288c1cf


  TO DOs:
  - fully comment code
  -= default selction rect to user/data defined start and end dates
  - attach brush handles https://observablehq.com/@connor-roche/multi-line-chart-focus-context-w-mouseover-tooltip
*/
console.log("PEARL - Line Chart");

var pearlData = {
  topic: "black holes" /* "aerogels" */ /* "black holes" */,
  collapsibleTreeData: { name: "root", children: [] },
  maxLinesReached: false,
  defaultLineToDraw: "total",
  /* maxLines: 3, */
  colours: [
    "red",
    "green",
    "blue",

    /*   "#01324b",
    "#be1818",
    "#0070a8",
    "#785ba7",
    "#007373",
    "#c75301", */
  ],
  coloursUsed: [],
  coloursAvailable: [],
  lineCounter: 0,
  smallMultipleSortVariable: "page_rank",
  topX: 100,
  yAxisDomainMaxRounding: 100,
  perChunk: 20,
  smallMultiplesChart: {},
  smallMultiplesChartxDomainMaximum: 0,
  selectedSupTopicNode: "",
  smallMultipleChartSliceSize: 60,
  topicsToDisable: [
    /* "Computational Social Science", */
    "Artificial Intelligence",
    "Biocomputing",
    "Egyptian 2021 Gastroenterology",
    "Scientific Reports",
    "Astrobiology",
    "SDG3 - Good Health and Well-Being",
    "SDG 7 - Energy",
    "permission",
    "Benjamin List",
  ],
};

var bisect;
var focus;
var context;
var svg = d3.select("#line-chart-svg").attr("width", "100%");
var margin = { top: 20, right: 100, bottom: 150, left: 40 };
var margin2 = { top: 280, right: 100, bottom: 30, left: 40 };
var width = window.innerWidth - margin.left - margin.right;
var height = +svg.attr("height") - margin.top - margin.bottom;
var height2 = +svg.attr("height") - margin2.top - margin2.bottom;

// What happens when the mouse move -> show the annotations at the right positions.
function mouseover() {
  focus.style("opacity", 1);
  focusText.style("opacity", 1);
}

function mousemove() {
  // recover coordinate we need
  var x0 = x.invert(d3.mouse(this)[0]);
  var i = bisect(data, x0, 1);
  selectedData = data[i];
  focus.attr("cx", x(selectedData.x)).attr("cy", y(selectedData.y));
  focusText
    .html("x:" + selectedData.x + "  -  " + "y:" + selectedData.y)
    .attr("x", x(selectedData.x) + 15)
    .attr("y", y(selectedData.y));
}
function mouseout() {
  focus.style("opacity", 0);
  focusText.style("opacity", 0);
}

var x, y;
var focusLine;
var contextLine;

function drawLineChart(json, selectValue) {
  pearlData.formatDatePEARL = d3.timeFormat("%m %Y");
  pearlData.parseDatePEARL = d3.timeParse("%m %Y");

  console.log(json);
  pearlData.data = json /* [0].data */;
  pearlData.defaultStartDate = "01 2016";
  pearlData.defaultEndDate = "01 2021";
  pearlData.formattedDefaultStartDate = pearlData.parseDatePEARL(
    pearlData.defaultStartDate
  );
  pearlData.formattedDefaultEndDate = pearlData.parseDatePEARL(
    pearlData.defaultEndDate
  );

  pearlData.data.forEach(function (d, i) {
    d.formattedDate = pearlData.parseDatePEARL(d.month + " " + d.year);
  });

  data = pearlData.data.filter(function (d, i) {
    return d.label == "total";
  });

  (x = d3.scaleTime().range([0, width])),
    (x2 = d3.scaleTime().range([0, width])),
    (y = d3.scaleLinear().range([height, 0])),
    (y2 = d3.scaleLinear().range([height2, 0]));

  (lineChart_xAxis = d3.axisBottom(x)),
    (lineChart_xAxis2 = d3.axisBottom(x2)),
    (lineChart_yAxis = d3.axisLeft(y));

  var brush = d3
    .brushX()
    .extent([
      [0, 0],
      [width, height2],
    ])
    .on("brush end", brushed);

  var zoom = d3
    .zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .extent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", zoomed);

  // Add the line
  focusLine = d3
    .line()
    .curve(d3.curveMonotoneX)
    .x(function (d) {
      return x(d.formattedDate);
    })
    .y(function (d) {
      return y(d.articles);
    });

  contextLine = d3
    .line()
    .curve(d3.curveMonotoneX)
    .x(function (d) {
      return x2(d.formattedDate);
    })
    .y(function (d) {
      return y2(d.articles);
    });

  svg
    .append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  focus = svg
    .append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  context = svg
    .append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  x.domain(
    d3.extent(data, function (d) {
      return d.formattedDate;
    })
  );
  y.domain([
    0,
    Math.ceil(
      d3.max(data, function (d) {
        return d.articles;
      }) / pearlData.yAxisDomainMaxRounding
    ) * pearlData.yAxisDomainMaxRounding,
  ]);
  x2.domain(x.domain());
  y2.domain(y.domain());

  var defaultSelection = [
    x(pearlData.formattedDefaultStartDate),
    x(pearlData.formattedDefaultEndDate),
  ];

  pearlData.nestedData = d3
    .nest()
    .key(function (d) {
      return d.label;
    })
    .entries(pearlData.data);

  pearlData.constructedLineData = {};

  pearlData.nestedData.forEach(function (d, i) {
    pearlData.constructedLineData[d.key] = d.values;
  }); // end forEach...

  focus
    .append("path")
    .datum(pearlData.constructedLineData[pearlData.defaultLineToDraw])
    .attr("class", function (d, i) {
      var lineName = d[0].label;

      focus
        .append("text")
        .attr("class", function (d, i) {
          return "line-annotation-label " + lineName.replaceAll(" ", "-");
        })
        .attr("x", width + 10)
        .attr("y", y(d[d.length - 1].articles))
        .text(lineName);

      return "focus line " + lineName.replaceAll(" ", "-");
    })
    .attr("d", focusLine);

  focus
    .append("g")
    .attr("class", "lineChart axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(lineChart_xAxis);

  d3.selectAll(".xAxisTicks").remove();

  // draw tick grid lines extending from y-axis ticks on axis across scatter graph
  var xticks = focus.selectAll(".lineChart.axis.axis--x").selectAll(".tick");

  xticks
    .append("svg:line")
    .attr("class", "xAxisTicks")
    .attr("y0", 0)
    .attr("y1", -height)
    .attr("x1", 0)
    .attr("x2", 0)
    .style("stroke-width", 1)
    .style("stroke", "#a0a0a0")
    .style("opacity", 0.3);

  focus
    .append("g")
    .attr("class", "lineChart axis axis--y")
    .call(lineChart_yAxis);

  d3.selectAll(".yAxisTicks").remove();

  // draw tick grid lines extending from y-axis ticks on axis across scatter graph
  var yticks = focus.selectAll(".lineChart.axis.axis--y").selectAll(".tick");

  yticks
    .append("svg:line")
    .attr("class", "yAxisTicks")
    .attr("y0", 0)
    .attr("y1", 0)
    .attr("x1", 0)
    .attr("x2", width)
    .style("stroke-width", 0.5)
    .style("stroke", "#a0a0a0")
    .style("stroke-dasharray", "2 2")
    .style("opacity", 0.3);

  d3.selectAll(".lineChart.axis.axis--y")
    .append("text")
    .attr("x", 0)
    .attr("y", -5)
    .style("font-size", "1.0rem")
    .style("fill", "#000")
    .style("text-anchor", "start")
    .text("Number of Articles");

  context
    .append("path")
    .datum(pearlData.constructedLineData[pearlData.defaultLineToDraw])
    .attr("class", function (d, i) {
      var lineName = d[0].label;
      return "context line " + lineName;
    })
    .attr("d", contextLine);

  context
    .append("g")
    .attr("class", "lineChart axis axis--x")
    .attr("transform", "translate(0," + height2 + ")")
    .call(lineChart_xAxis2);

  // d3.selectAll(".xAxisTicks").remove();

  // draw tick grid lines extending from y-axis ticks on axis across scatter graph
  var xticks = context.selectAll(".lineChart.axis.axis--x").selectAll(".tick");

  xticks
    .append("svg:line")
    .attr("class", "xAxisTicks")
    .attr("y0", 0)
    .attr("y1", -height2)
    .attr("x1", 0)
    .attr("x2", 0)
    .style("stroke-width", 1)
    .style("stroke", "#a0a0a0")
    .style("opacity", 0.5);

  context
    .append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, defaultSelection);

  d3.selectAll(".resize")
    .attr("transform", "translate(0," + 0 + ")")
    .attr("rx", 2.5)
    .attr("ry", 2.5)
    .attr("height", height2 + 6)
    .attr("width", 5);

  d3.selectAll(".handle")
    .attr("transform", "translate(-1," + height2 / 3 + ")")
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("height", height2 / 3 + 6)
    .attr("width", 8);

  svg
    .append("rect")
    .attr("class", "zoom")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);
  // });// end data load ...

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom

    var s = d3.event.selection || x2.range();
    x.domain(s.map(x2.invert, x2));

    focus.selectAll(".line").attr("d", focusLine);
    focus.selectAll(".lineChart.axis--x").call(lineChart_xAxis);

    svg
      .selectAll(".zoom")
      .call(
        zoom.transform,
        d3.zoomIdentity.scale(width / (s[1] - s[0])).translate(-s[0], 0)
      );

    return;
  } // end function brushed

  function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush

    var t = d3.event.transform;
    x.domain(t.rescaleX(x2).domain());

    focus.selectAll(".line").attr("d", focusLine);
    focus.selectAll(".lineChart.axis--x").call(lineChart_xAxis);
    context.selectAll(".brush").call(brush.move, x.range().map(t.invertX, t));

    return;
  } // end function brushed

  d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
      this.parentNode.appendChild(this);
    });
  };

  d3.selection.prototype.moveToBack = function () {
    return this.each(function () {
      var firstChild = this.parentNode.firstChild;
      if (firstChild) {
        this.parentNode.insertBefore(this, firstChild);
      }
    });
  };

  return;
} // end function drawLineChart()

function lineAddRemove(colourToUse) {
  var circle = d3.selectAll(
    ".lineNode." + pearlData.selectedSupTopicNode.replaceAll(" ", "-")
  );

  if (circle.classed("line-selected")) {
    focus
      .append("path")
      .datum(pearlData.constructedLineData[pearlData.selectedSupTopicNode])
      .attr("class", function (d, i) {
        focus
          .append("text")
          .attr("class", function (d, i) {
            return (
              "line-annotation-label " +
              pearlData.selectedSupTopicNode.replaceAll(" ", "-")
            );
          })
          .attr("x", width + 10)
          .attr("y", y(d[d.length - 1].articles))
          .style("fill", colourToUse)
          .text(pearlData.selectedSupTopicNode);

        return (
          "focus line " + pearlData.selectedSupTopicNode.replaceAll(" ", "-")
        );
      })
      .attr("d", focusLine)
      .style("stroke", colourToUse);

    context
      .append("path")
      .datum(pearlData.constructedLineData[pearlData.selectedSupTopicNode])
      .attr(
        "class",
        "context line " + pearlData.selectedSupTopicNode.replaceAll(" ", "-")
      )
      .attr("d", contextLine)
      .style("stroke", colourToUse);

    d3.selectAll(".brush").moveToFront();
  } else {
    d3.selectAll(
      ".focus.line." + pearlData.selectedSupTopicNode.replaceAll(" ", "-")
    ).remove();
    d3.selectAll(
      ".context.line." + pearlData.selectedSupTopicNode.replaceAll(" ", "-")
    ).remove();
    d3.selectAll(
      ".line-annotation-label." +
        pearlData.selectedSupTopicNode.replaceAll(" ", "-")
    ).remove();
  }

  return;
} // end function lineAddRemove
