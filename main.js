//window.onload = initialize;
var country_data, country_count, country_budget, country_imdbscore, country_budget_count;
var xScale, yScale, yAxis, xAxis;
var bars, width, height, svg;
var selectList;
var world_data = [];
const animation_duration = 2000;
const margin = {top: 20, right: 40, bottom: 20, left: 90};



//load world map data 
d3.json("data/world.json", function(error, p) {
   
    all_features = p.features;
    for (var i = 0; i < all_features.length; i++){
        world_data.push(all_features[i].properties.name);
    }
});

// load movie data
d3.csv("movies.csv", function(d) {
    return {
        country : d.country,
        title : d.movie_title,
        budget : +d.budget,
        imdb_score : +d.imdb_score
    }; 
    }, function(data) {
    country_count = {};
    country_budget = {};
    country_imdbscore = {};
    country_budget_count = {}
    for (var i = 0; i < data.length; i++) {
        if (data[i].country && data[i].country != 'Official site'){ // in case country doesn't have name
            country_count[data[i].country] = 1 + (country_count[data[i].country] || 0);
            // account for missing budgets
            if (data[i].budget) {
                country_budget_count[data[i].country] = 1 + (country_budget_count[data[i].country] || 0);
            }
            country_budget[data[i].country] = (country_budget[data[i].country] + data[i].budget || data[i].budget);
            country_imdbscore[data[i].country] = (country_imdbscore[data[i].country] + data[i].imdb_score || data[i].imdb_score);
        }
    }
    country_data = []
    for (country in country_count){
        country_data.push({
            "country" : country,
            "count" : (+country_count[country] || 0),
            "avg_budget": (+country_budget[country] /  country_budget_count[country] || 0)  ,
            "avg_imdbscore": +country_imdbscore[country] /  country_count[country]
        });   
    }    
    initialize();
});



function setup() {
    console.log('setup')
    var graph = document.getElementById('graph');
    
    width = 900 - margin.left - margin.right;
    height = 700 - margin.top - margin.bottom;
    
    svg = d3.select(graph)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        
    bars = svg.append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");   
    
    d3.select(graph)
        .append('p')
            .attr('id','buttonzone')
            .append('button')
                .attr('id','filterbutton')
                .style("border", "1px solid black")
                .text('Filter Data')
    d3.select("#buttonzone")
        .append('button')
            .attr('id','desbutton')
            .style("border", "1px solid black")
            .text('Sort Descending')
    

    //create select options to show countries by
    selectList = document.createElement("SELECT")
    selectList.id = 'sList';
    var ops = ["Average Budget","Total Movies", "Average IMDB Rating"];
    document.getElementById("graph").appendChild(selectList);
    for (var i = 0; i < ops.length; i++) {
        var option = document.createElement("option");
        option.value = ops[i];
        option.text = ops[i];
        selectList.appendChild(option);
    }
    // add a axis label 
    svg.append("text")
        .attr("x", 80)
        .attr("y", 13)
        .attr("class", "label")
        .text("Countries");

    svg.append("text")
        .attr('id','xaxisname')
        .attr("x", width-2)
        .attr("y", height-6)
        .attr("text-anchor", "end")
        .attr("class", "label")
        .text(selectList.options[selectList.selectedIndex].value);  
}

function build_scales() {
    xScale = d3.scaleLinear().range([0, width]);
    yScale = d3.scaleBand().rangeRound([0, height], 0.8);
    yAxis = d3.axisLeft(yScale);

    // https://stackoverflow.com/questions/42337710/d3-bar-chart-sorting-not-working
    country_data.sort((a, b) => d3.descending(a.avg_budget, b.avg_budget));
    
    xScale.domain([0, d3.max(country_data, function(d) {
        return d.avg_budget;
    })]);

    yScale.domain(country_data.map(function(d) {
        return d.country;
    }));
}

function updateScalesFromData() {

    bars.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(20, 0)')
        .attr('id','y_axis')
        .call(yAxis);   
    bars.append('g')
        .selectAll('.bar')
       
        .data(country_data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 30)
        .attr('y', function(d) {
            return yScale(d.country);
        })
        .attr('width', function(d) {
            return xScale(d.avg_budget);
        })
        .attr('height', function(d) {
            return yScale.bandwidth()*.8;
        });
    
  }
  function updating() {
        //broken
        d3.select("#sortAsc").on("click", function() {
            console.log('clicked button')
            country_data.sort(function(a, b) {
            return d3.descending(a.avg_budget, b.avg_budget)
            })
            yScale.domain(country_data.map(function(d) {
            return d.country;
            }));
            // sort by asc
            // https://bl.ocks.org/anonymous/bc5a9691a3417b403d4e8ade3297afa3/3a2434c1c2849e476791e581754ec27e055db4d6
            svg.selectAll(".bar")
                .transition()
                .duration(500)
                .attr("y", function(d, i) {
                    return yScale(d.country);
                })
        
            svg.selectAll(".val-label")
                .transition()
                .duration(500)
                .attr("y", function(d, i) {
                    return yScale(d.country)+ yScale.bandwidth() / 2;
                })
        
            svg.selectAll(".bar-label")
                .transition()
                .duration(500)
                .attr("transform", function(d, i) {
                return "translate(" + (yScale(d.country) + yScale.bandwidth() / 2 - 8) + "," + (width + 15) + ")" + " rotate(45)"
                })
        })
        d3.select('#filterbutton').on('click', function() {
            d3.select('#xaxisname').text(selectList.options[selectList.selectedIndex].value)
           
            bars.selectAll('.bar')
                .transition()
                .duration(function(d) {
                    return Math.random() * 1000;
                })
                .delay(function(d) {
                    return d.frequency * 8000
                })
                // none of this works yet
                .attr('width', function (d) {
                    if (selectList.options[selectList.selectedIndex].value == "Average IMDB Rating"){
                        xScale.domain([0, d3.max(country_data, function(d) {
                            return d.avg_imdbscore;
                        })]);
                        return xScale(d.avg_imdbscore);
                    } 
                    else if (selectList.options[selectList.selectedIndex].value == "Average Budget"){
                        xScale.domain([0, d3.max(country_data, function(d) {
                            return d.avg_budget;
                        })]);
                        return xScale(d.avg_budget);
                    } 
                    else if (selectList.options[selectList.selectedIndex].value == "Total Movies"){
                        xScale.domain([0, d3.max(country_data, function(d) {
                            return d.count;
                        })]);
                        return xScale(d.count);
                    } 
                    
                });
            
        });
  }

function load_word_map() {
    console.log('world map')
    
    var mapboxAccessToken = "pk.eyJ1IjoidG9zdW4iLCJhIjoiY2p1anpyOGV3MGRjdDRhcXZsZndxNnZtbSJ9.A1_ZMPvZ0AASAQzzqM0e1g";
    var map = L.map('world').setView([51.505, -0.09], 2);
    
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token='+ mapboxAccessToken, {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.light',
        text: 'her',
        accessToken: "pk.eyJ1IjoidG9zdW4iLCJhIjoiY2p1anp0NXk3MGYydTN6bWl5cnFuaHdxNiJ9.AiRS14moB8D21HY8nDsokw"

    }).addTo(map);

    L.geoJson(world_data).addTo(map);
    // control that shows state info on hover
	var info = L.control();

	info.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'info');
		this.update();
		return this._div;
	};

	info.update = function (props) {
		this._div.innerHTML = '<h4>Country</h4>' +  (props ?
			'<b>' + props.country + '</b><br />'
			: 'Hover over a state');
	};

    info.addTo(map);
    // get color depending on population density value
	function getColor(d) {
		return d > 60000 ? '#800026' :
				d > 40000  ? '#BD0026' :
				d > 200  ? '#E31A1C' :
				d > 100  ? '#FC4E2A' :
				d > 50   ? '#FD8D3C' :
				d > 20   ? '#FEB24C' :
				d > 10   ? '#FED976' :
							'#FFEDA0';
	}

	function style(feature) {
		return {
			weight: 2,
			opacity: 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.7,
			fillColor: getColor(feature.properties.density)
		};
	}

	function highlightFeature(e) {
		var layer = e.target;

		layer.setStyle({
			weight: 5,
			color: '#666',
			dashArray: '',
			fillOpacity: 0.7
		});

		if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
			layer.bringToFront();
		}

		info.update(layer.feature.properties);
	}

	var geojson;

	function resetHighlight(e) {
		geojson.resetStyle(e.target);
		info.update();
	}

	function zoomToFeature(e) {
		map.fitBounds(e.target.getBounds());
	}

	function onEachFeature(feature, layer) {
		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlight,
			click: zoomToFeature
		});
	}
    var jsoncountry = JSON.stringify(country_count);
    console.log(jsoncountry)
	geojson = L.geoJson(jsoncountry, {
		style: style,
		onEachFeature: onEachFeature
	}).addTo(map);

	

	// var legend = L.control({position: 'bottomright'});

	// legend.onAdd = function (map) {

	// 	var div = L.DomUtil.create('div', 'info legend'),
	// 		grades = [0, 10, 20, 50, 100, 200, 500, 1000],
	// 		labels = [],
	// 		from, to;

	// 	for (var i = 0; i < grades.length; i++) {
	// 		from = grades[i];
	// 		to = grades[i + 1];

	// 		labels.push(
	// 			'<i style="background:' + getColor(from + 1) + '"></i> ' +
	// 			from + (to ? '&ndash;' + to : '+'));
	// 	}

	// 	div.innerHTML = labels.join('<br>');
	// 	return div;
	// };

	// legend.addTo(map);
    // // Map and projection
    // var path = d3.geoPath();
    // var projection = d3.geoMercator()
    // .scale(70)
    // .center([0,20])
    // .translate([w / 2, h / 2]);
    // // Data and color scale
    // var data = d3.map();
    // var colorScale = d3.scaleThreshold()
    // .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
    // .range(d3.schemeBlues[7]);
    // d3.queue()
    // .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
    // .defer(d3.csv, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv", function(d) { data.set(d.code, +d.pop); })
    // .await(ready);
    // function ready(error, topo) {

    //     // Draw the map
    //     svg.append("g")
    //       .selectAll("path")
    //       .data(topo.features)
    //       .enter()
    //       .append("path")
    //         // draw each country
    //         .attr("d", d3.geoPath()
    //           .projection(projection)
    //         )
    //         // set the color of each country
    //         .attr("fill", function (d) {
    //           d.total = data.get(d.id) || 0;
    //           return colorScale(d.total);
    //         });
    //       }
}


function initialize() {
    setup();
    build_scales();
    updateScalesFromData(); 
    updating();
    load_word_map();
}