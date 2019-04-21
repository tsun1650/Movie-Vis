var country_data;
var xScale, yScale, yAxis, xAxis;
var bars, width, height, svg, map_svg, path, tip;
var selectList;
var world_data = [];
var movie_data = [];
const animation_duration = 2000;
const margin = {top: 20, right: 40, bottom: 20, left: 40};
var length1 = 0
var measureVal;
var firstRun = 0;
// load movie data
//nest country data here 
var atlas = {}
var seencountries = []
var raw_world = []
d3.csv("data/movies.csv", function(movies) {
    d3.json('data/world.json', function(geojsondata) {
        raw_world = geojsondata.features
       
        for (m in movies) {
            var moviecountry = movies[m].country;
            
            for (f in geojsondata.features){ 
                var jsoncountry = geojsondata.features[f].properties.name;
                if (moviecountry == jsoncountry) {
                    var score = parseFloat(movies[m].imdb_score ? movies[m].imdb_score : 0);
                    var budget = parseFloat(movies[m].budget ? movies[m].budget : 0);
                   
                    //unique countries 
                    if(seencountries.indexOf(moviecountry) === -1) {
                        seencountries.push(moviecountry);
                    }
                    if (moviecountry in atlas) {  
                        atlas[moviecountry].count += 1;
                        atlas[moviecountry].avg_imdbscore += score;
                        atlas[moviecountry].avg_budget += budget;
                    } else {   
                        atlas[moviecountry] = {
                            "count" : 1,
                            "avg_imdbscore" : score,
                            "avg_budget" : budget,
                            "index" : f
                        }; 
                    }
                }
            }
            
            if (movies[m].movie_title && moviecountry 
                && movies[m].budget && movies[m].imdb_score) {
                movie_data.push({
                    "m_title" : movies[m].movie_title.trim(),
                    "m_country" : moviecountry,
                    "m_budget" : movies[m].budget,
                    "m_imdbscore" : movies[m].imdb_score
                })
            }
        }
        
        for (x in seencountries) {
            thiscountry = seencountries[x]
            world_data.push({
                "country" : thiscountry,
                "avg_budget" : (atlas[thiscountry].avg_budget/atlas[thiscountry].count).toFixed(2),
                "avg_imdbscore" : (atlas[thiscountry].avg_imdbscore/atlas[thiscountry].count).toFixed(2),
                "count" : atlas[thiscountry].count,
                'index' : atlas[thiscountry].index
            })
        }
        
        // updateScalesFromData();
        setup_graph();
        build_scales();
        build_buttons();    
        updateScalesFromData(); 
        build_scatterplot();
        
        createChoropleth();
        // updating();
        firstColor();
        updating()
        // colorMap("count");
    });
   
    
    
    // initialize();
    
});


function setup_graph() {
   
    width = 900 - margin.left - margin.right;
    height = 700 - margin.top - margin.bottom;
    
    svg = d3.select("#graph")
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', 900 + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // add axis labels
    svg.append("text")
        .attr("x", 6)
        .attr("y", -2)
        .attr("class", "label")
        .text("IMDB Rating")
    svg.append("text")
        .attr("x", width-2)
        .attr("y", height-6)
        .attr("text-anchor", "end")
        .attr("class", "label")
        .text("Budget ($)")
}

function build_buttons() {
    //create select options to show countries by
    selectList = document.createElement("SELECT")
    selectList.id = 'sList';
    var ops = ["Average Budget","Total Movies", "Average IMDB Rating"];
    document.getElementById("world").appendChild(selectList);
    for (var i = 0; i < ops.length; i++) {
        var option = document.createElement("option");
        option.value = ops[i];
        option.text = ops[i];
        selectList.appendChild(option);
    }
    d3.select("#world")
        .append('p')
            .attr('id','buttonzone')
            .append('button')
                .attr('id','filterbutton')
                .style("border", "1px solid black")
                .text('Filter Data')
}
function build_scales() {
    // delete outlier 
    xScale = d3.scaleLinear().range([0, width]);
    yScale = d3.scaleLinear().range([height,0]);
    yAxis = d3.axisLeft(yScale)
    xAxis = d3.axisBottom(xScale)
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "x-axis")
        .call(xAxis)
            .selectAll("text")  
                
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)" );
        
    // svg.select(".x-axis")
    //     .select('path')
    //     .style('stroke-width','1')
    //     .style('stroke', 'black');

    svg.append("g")
        .attr("transform", "translate(0,0)")
        .attr("class", "y-axis")
        .call(yAxis);
}

function updateScalesFromData() {
    
    xScale.domain([0,d3.max(movie_data,d=> d.m_budget)*3]).nice();
    yScale.domain([0,d3.max(movie_data,d=> d.m_imdbscore)]).nice();
    xAxis.scale(xScale);
    yAxis.scale(yScale);
    d3.select(".x-axis").transition().duration(animation_duration).call(xAxis);
    d3.select(".y-axis").transition().duration(animation_duration).call(yAxis);  
    svg.select(".x-axis")
        .call(xAxis)
            .selectAll("text")  
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)" );
        
    // build_scatterplot()  
}

function build_scatterplot() {

    var bubbleSelection = svg.selectAll("g.bubble")
      .data(movie_data, d=> d.m_title);
  
    bubbleSelection.exit()
    .transition().duration(animation_duration)
      .attr("transform", "translate(0,0)")
      .style("fill-opacity", 0) 
      .remove();
  
    var enter = bubbleSelection
      .enter()
      .append("g")
      .attr("class", "bubble");
    enter
      .append("circle")
      .attr("r", 5)
      .style("fill", 'red')
     
    enter
      .append("rect")
      .attr("fill","white")
      .attr("x",5)
      .attr("y", -10)
      .attr("height", 20)
      .attr("width", function(d) {
        // return 6*(d.m_title + '- $' + Number(d.m_budget).toLocaleString() + ', IMDB ' + d.m_imdbscore+ ' (' + d.m_country + ")").length;
      })
    enter
      .append("text")
      .attr("class", "label")
      .attr("x", 6)
      .attr("alignment-baseline", "middle")
      
      .text(function(d) {
        return d.m_title + '- $' + Number(d.m_budget).toLocaleString() + ', IMDB ' + d.m_imdbscore  +' (' + d.m_country + ")";
      })
  
    enter.merge(bubbleSelection)
      .transition().duration(animation_duration)
      .attr("transform", function(d) {
        return "translate(" + xScale(d.m_budget) + ","
        + yScale(d.m_imdbscore) + ")";
      });
}
  
function setMeasure(measure) {
    measureFilter = measure;
    // createChoropleth();
    colorMap(measureFilter);

}
function updating() {
    d3.select('#filterbutton').on('click', function() {
       
        v = selectList.options[selectList.selectedIndex].value
        console.log("clicking here")
    
        if (v == "Average IMDB Rating") colorMap("avg_imdbscore");
        else if (v == "Average Budget") colorMap("avg_budget");
        else if (v == "Total Movies") colorMap("count");
        
         
    });
}
function createChoropleth() {
    // define map projection
    w= 900;
    h = 600
   
    var projection = d3.geoMercator()
        .translate([w/2, h/1.5])
        .scale([130]);

    //Define default path generator
    path = d3.geoPath()
        .projection(projection);
    map_svg = d3.select("#world")
        .append("svg")
            .attr("id", "worldmap")
            .attr("width", w)
            .attr("height", h)
            .append("g")
                .attr("transform", "translate(" + 10 + "," + 10 + ")")
    console.log('created map')
}
function firstColor(){
    console.log('first')
    if (!(firstRun)){
    var color = d3.scaleQuantile()
        .range(['rgb(237,248,233)','rgb(186,228,179)','rgb(116,196,118)','rgb(49,163,84)','rgb(0,109,44)']);
    var min, max;
    
    min = Math.min.apply(null, world_data.map(item => item.avg_budget)),
    max = Math.max.apply(null, world_data.map(item => item.avg_budget));

    color.domain([min, max]);

    var paths;
    
    for (var i = 0; i < world_data.length; i++) {
        var dataCountry = world_data[i].country;
        var dataValue;
        dataValue = parseFloat(world_data[i].avg_budget);
        raw_world[world_data[i].index].properties.value = dataValue;
    }
    paths = map_svg.selectAll("path")
            .data(raw_world)
            .enter()
            // .update() instead of enter()- just take out .enter()
            .append("path")
            .attr("d", path)
            .style("fill", function(d){
                //get the data value
                if(d.properties.value){
                    return color(d.properties.value);
                } else {
                    return "#ccc"
                }
            })
    paths = map_svg.selectAll("path")
        .on("mouseover", function(d) {
            d3.select(this).style("fill",'lightblue')
            val = d3.select(this)
            tip.show(d, d3.select(this))
            
        }).on("mouseout", function(d) {
            tip.hide(d, d3.select(this))	
            if (color(d.properties.value)){
                d3.select(this).style("fill",color(d.properties.value));
            } else {
                d3.select(this).style("fill","#ccc");
            }
        })
        .on("click", function(d) {
            var clicked_country = d.properties.name;
                d3.select("#graph").selectAll('circle').classed('selected', false);
               
                d3.select("#graph").selectAll('circle').classed('selected', function(d2) {
                    // console.log(d2)
					if (d2.m_country == clicked_country) {
                        
                        d3.select(this).style('fill','blue')
						return true; 
					} else {
                        d3.select(this).style('fill','red')
						return false;
					}
				});
        });

        

    tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-7, 0])
        .html(function(d) {
            var dataval;
            
            dataval = (d.properties.value) ?  "$" + Number(d.properties.value.toFixed(2)).toLocaleString() :  "$0";
           
            return "<strong>"+d.properties.name + "</strong></br>" + dataval;      
        })
    map_svg.call(tip);
    firstRun = 1;
    }
}
    
function colorMap(measure_val){
    if (firstRun){
        console.log('runing')
    console.log('trying to color')
    var color = d3.scaleQuantile()
        .range(['rgb(237,248,233)','rgb(186,228,179)','rgb(116,196,118)','rgb(49,163,84)','rgb(0,109,44)']);
    var min, max;
    if (measure_val == 'avg_budget') {
        min = Math.min.apply(null, world_data.map(item => item.avg_budget)),
        max = Math.max.apply(null, world_data.map(item => item.avg_budget));
    } else if (measure_val == 'avg_imdbscore') {
        min = Math.min.apply(null, world_data.map(item => item.avg_imdbscore)),
        max = Math.max.apply(null, world_data.map(item => item.avg_imdbscore));
    } else if (measure_val == 'count') {
        min = Math.min.apply(null, world_data.map(item => item.count)),
        max = Math.max.apply(null, world_data.map(item => item.count));
    }
    color.domain([min, max]);

    var paths;
    
    for (var i = 0; i < world_data.length; i++) {
        var dataCountry = world_data[i].country;
        var dataValue;
        if (measure_val == 'avg_budget') {
            dataValue = parseFloat(world_data[i].avg_budget);
        } else if (measure_val == 'avg_imdbscore') {
            dataValue = parseFloat(world_data[i].avg_imdbscore);
        } else if (measure_val == 'count') {
            dataValue = parseFloat(world_data[i].count);
        }
        raw_world[world_data[i].index].properties.value = dataValue;
      
    }
    paths = map_svg.selectAll("path")
            .data(raw_world)
            .enter()
            // .update() instead of enter()- just take out .enter()
            .append("path")
            .attr("d", path)
            .style("fill", function(d){
                //get the data value
                if(d.properties.value){
                    return color(d.properties.value);
                } else {
                    return "#ccc"
                }
            })
    paths = map_svg.selectAll("path")
        .on("mouseover", function(d) {
            d3.select(this).style("fill",'lightblue')
            val = d3.select(this)
            tip.show(d, d3.select(this))
            
        }).on("mouseout", function(d) {
            tip.hide(d, d3.select(this))	
            if (color(d.properties.value)){
                d3.select(this).style("fill",color(d.properties.value));
            } else {
                d3.select(this).style("fill","#ccc");
            }
        }) .on("click", function(d) {
            var clicked_country = d.properties.name;
                d3.select("#graph").selectAll('circle').classed('selected', false);
               
                d3.select("#graph").selectAll('circle').classed('selected', function(d2) {
                    // console.log(d2)
					if (d2.m_country == clicked_country) {
                        
                        d3.select(this).style('fill','blue')
						return true; 
					} else {
                        d3.select(this).style('fill','red')
						return false;
					}
				});
        });

    tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-7, 0])
        .html(function(d) {
            var dataval;
            if (measure_val == 'avg_budget') {
                dataval = (d.properties.value) ?  "$" + d.properties.value.toFixed(2) :  "$0";
            } else if (measure_val == 'avg_imdbscore') {
                dataval = dataval = (d.properties.value) ?  d.properties.value.toFixed(2): '0';
            } else if (measure_val == 'count') {
                dataval = dataval = (d.properties.value) ?  d.properties.value: '0';
            }
            return "<strong>"+d.properties.name + "</strong></br>" + dataval;      
        })
    map_svg.call(tip);

}
}
    