(function () {

  "use strict";

  var width = 960,
    height = 500;

  var projection = d3.geo.robinson()
        .scale(150)
        .translate([width / 2, height / 2])
        .precision(.1);

  var path = d3.geo.path()
        .projection(projection);

  var graticule = d3.geo.graticule();

  var svg = d3.select("#figure").append("svg")
        .attr("width", width)
        .attr("height", height);

  svg.append("defs").append("path")
        .datum({type: "Sphere"})
            .attr("id", "sphere")
                .attr("d", path);

  svg.append("use")
        .attr("class", "stroke")
            .attr("xlink:href", "#sphere");

  svg.append("use")
        .attr("class", "fill")
            .attr("xlink:href", "#sphere");

  d3.json("world-50m.json", function(error, world) {
    svg.insert("path", ".graticule")
          .datum(topojson.feature(world, world.objects.land))
          .attr("class", "land")
          .attr("d", path);

    svg.insert("path", ".graticule")
          .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
          .attr("class", "boundary")
          .attr("d", path);
  });

  d3.json("dotastro.json", function (error, data) {
    for (var j = 0, l = data.authors.length; j < l; ++j) {
      var locations = data.authors[j].locations.map(function (obj) {
        obj.name = data.authors[j].name;
        obj.latlng = [obj.latlng[1], obj.latlng[0]];
        return obj;
      }).sort(function (a, b) {
        return a.year - b.year;
      });

      // Total hack to fix bad results.
      locations = locations.filter(function (obj, i) {
        if (i > 1 && i < locations.length-1) {
          var p1 = locations[i-1].latlng,
              p2 = obj.latlng,
              p3 = locations[i+1].latlng,
              d1 = (p2[0]-p1[0])*(p2[0]-p1[0]) + (p2[1]-p1[1])*(p2[1]-p1[1]),
              d2 = (p2[0]-p3[0])*(p2[0]-p3[0]) + (p2[1]-p3[1])*(p2[1]-p3[1]);
          if (d1 > 1000 && d2 > 1000) return false;
        }
        return true;
      });

      svg.append("path")
            .datum({
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: locations.map(function (d) { return d.latlng; })
              }
            })
            .attr("class", "route route-"+j)
            .attr("d", d3.geo.path().projection(projection));
      var points = svg.selectAll(".location-"+j).data(locations);
      points.enter().append("circle")
            .attr("class", "location location-"+j)
            .attr("transform", function(d) {
              return "translate(" + projection(d.latlng) + ")";
            })
            .attr("r", 4)
            .on("click", function (obj) {
              window.open("http://labs.adsabs.harvard.edu/adsabs/abs/"+obj.code);
              return false;
            })
            .on("mouseover", function (obj) {
              d3.select("#author").text(obj.name);
              d3.select("#year").text(obj.year);
              d3.select("#affiliation").text(obj.affiliation);
            });
    }
    var select = d3.select("#authors").on("change", function () {
      var ind = this.value;
      if (ind >= 0) {
        svg.selectAll(".route").style("display", "none");
        svg.select(".route-"+ind).style("display", null).style("opacity", 0.5);
        svg.selectAll(".location").style("display", "none");
        svg.selectAll(".location-"+ind).style("display", null);
      } else {
        svg.selectAll(".route").style("display", null).style("opacity", 0.3);
        svg.selectAll(".location").style("display", null);
      }
    });
    data.authors.map(function (author, i) {
      select.append("option").attr("value", i).text(author.name);
    });
  });

})();
