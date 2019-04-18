//window.onload = initialize;
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

// load movie data
//nest country data here 
var atlas = {}
var seencountries = []
d3.csv("data/movies.csv", function(movies) {
    d3.json('data/world.json', function(geojsondata) {
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
                            "avg_budget" : budget
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
                "count" : atlas[thiscountry].count    
            })
        }

    });
    
    
    
    initialize();
    
});


function setup_graph() {
   
    width = 900 - margin.left - margin.right;
    height = 700 - margin.top - margin.bottom;
    
    svg = d3.select("#graph")
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
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
        .text("Budget")
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
        .call(xAxis);
    svg.select(".x-axis")
        .select('path')
        .style('stroke-width','1')
        .style('stroke', 'black');
    svg.append("g")
        .attr("transform", "translate(0,0)")
        .attr("class", "y-axis")
        .call(yAxis);  
}

function updateScalesFromData() {
    console.log('hey',movie_data.length)
    for (v in movie_data) {
        console.log('hello', movie_data[v])
    }
    
    
    xScale.domain([0,d3.max(movie_data,d=> d.m_budget)]).nice();
    yScale.domain([0,d3.max(movie_data,d=> d.m_imdbscore)]).nice();
    xAxis.scale(xScale);
    yAxis.scale(yScale);
    d3.select(".x-axis").transition().duration(animation_duration).call(xAxis);
    d3.select(".y-axis").transition().duration(animation_duration).call(yAxis);    
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
      .append("text")
      .attr("x", 5)
      .attr("alignment-baseline", "middle")
      .text(d=> d.m_title);
  
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
       
    
        if (v == "Average IMDB Rating") setMeasure("avg_imdbscore");
        else if (v == "Average Budget") setMeasure("avg_budget");
        else if (v == "Total Movies") setMeasure("count");
        
         
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
    
}
function colorMap(measure_val){
    
    var color = d3.scaleQuantile()
        .range(['rgb(237,248,233)','rgb(186,228,179)','rgb(116,196,118)','rgb(49,163,84)','rgb(0,109,44)']);
    var min, max;
    if (measure_val == 'avg_budget') {
        min = Math.min.apply(null, country_data.map(item => item.avg_budget)),
        max = Math.max.apply(null, country_data.map(item => item.avg_budget));
    } else if (measure_val == 'avg_imdbscore') {
        min = Math.min.apply(null, country_data.map(item => item.avg_imdbscore)),
        max = Math.max.apply(null, country_data.map(item => item.avg_imdbscore));
    } else if (measure_val == 'count') {
        min = Math.min.apply(null, country_data.map(item => item.count)),
        max = Math.max.apply(null, country_data.map(item => item.count));
    }
    color.domain([min, max]);

   
    
    // d3.json("data/world.json", function(json){

    //     //Merge data
    //     for (var i = 0; i < country_data.length; i++){
    //         var dataCountry = country_data[i].country;
    //         var dataValue;
    //         if (measure_val == 'avg_budget') {
    //             dataValue = parseFloat(country_data[i].avg_budget);
    //         } else if (measure_val == 'avg_imdbscore') {
    //             dataValue = parseFloat(country_data[i].avg_imdbscore);
    //         } else if (measure_val == 'count') {
    //             dataValue = parseFloat(country_data[i].count);
    //         }
           
    //         for (var n = 0; n < json.features.length; n++){
    //                 var jsonCountry = json.features[n].properties.name;
    //                 if (dataCountry == jsonCountry){
    //                     //Copy the data value into the JSON
    //                     json.features[n].properties.value = dataValue;
    //                     break;
    //                 }
    //             }
    //         }
    //     //create a different function for init for coloring

        
    //     var paths = map_svg.selectAll("path")
    //         .data(json.features)
    //         .enter()
    //         // .update() instead of enter()- just take out .enter()
    //         .append("path")
    //         .attr("d", path)
    //         .style("fill", function(d){
    //             //get the data value
    //             var value = d.properties.value;
                
    //             if(value){
    //                 //If value exists
    //                 return color(value);
    //             } else {
    //                   return "#ccc"
    //             }
    //         })
    //         .on("mouseover", function(d) {
    //             d3.select(this).style("fill",'yellow')
    //             val = d3.select(this)
               
    //             tip.show(d, d3.select(this))
                
    //         }).on("mouseout", function(d) {
    //             tip.hide(d, d3.select(this))	
    //             if (color(d.properties.value)){
    //                 d3.select(this).style("fill",color(d.properties.value));
    //             } else {
    //                 d3.select(this).style("fill","#ccc");
    //             }
    //        });
    //     });

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
    



function initialize() {
    setup_graph();
    build_scales();
    // build_buttons();    
    updateScalesFromData(); 
    
    build_scatterplot();
  
    // createChoropleth();
    // updating();
    // colorMap("avg_budget");
    
}