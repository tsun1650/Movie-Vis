//window.onload = initialize;
var country_data;
var xScale, yScale, yAxis, xAxis;
var bars, width, height, svg;
var selectList;
var world_data = [];
var movie_data = [];
const animation_duration = 2000;
const margin = {top: 20, right: 40, bottom: 20, left: 40};


// load movie data
d3.csv("data/movies.csv", function(d) {
    return {
        country : d.country,
        title : d.movie_title,
        budget : +d.budget,
        imdb_score : +d.imdb_score,
        director_name: d.director_name
    }; 
    }, function(data) {
        // setting up for world map data
        var country_count = {};
        var country_budget = {};
        var country_imdbscore = {};
        var country_budget_count = {};
        var country_movies = {};

        for (var i = 0; i < data.length; i++) {
            if (data[i].country && data[i].country != "Official site"){ // in case country doesn't have name
                country_count[data[i].country] = 1 + (country_count[data[i].country] || 0);
                if (country_movies[data[i].country]){
                    country_movies[data[i].country].push({
                        "movie_title": data[i].title,
                        "movie_budget": data[i].budget,
                        "movie_imdb": data[i].imdb_score,
                        "director_name": data[i].director_name
                    });
                } else {
                    country_movies[data[i].country] = [];
                    country_movies[data[i].country].push({
                        "movie_title": data[i].title,
                        "movie_budget": data[i].budget,
                        "movie_imdb": data[i].imdb_score,
                        "director_name": data[i].director_name
                    });
                }
            
            // account for missing budgets
            if (data[i].budget) {
                country_budget_count[data[i].country] = 1 + (country_budget_count[data[i].country] || 0);
            }
            country_budget[data[i].country] = (country_budget[data[i].country] + data[i].budget || data[i].budget);
            country_imdbscore[data[i].country] = (country_imdbscore[data[i].country] + data[i].imdb_score || data[i].imdb_score);
            }
            // keep track of movies and their measures
            if (data[i].title && data[i].budget && data[i].imdb_score) {
                movie_data.push(
                    {
                        'm_title' : data[i].title,
                        'm_budget': data[i].budget,
                        'm_imdb' : data[i].imdb_score
                    });
            } 
            
        }
    country_data = []
    
    for (country in country_count){
        country_data.push({
            "country" : country,
            "count" : (+country_count[country] || 0),
            "avg_budget": (+country_budget[country] /  country_budget_count[country] || 0)  ,
            "avg_imdbscore": +country_imdbscore[country] /  country_count[country],
            "movies": country_movies[country]
        });   
    }    
    initialize();
    });

function setup_graph() {
   
    width = 900 - margin.left - margin.right;
    height = 700 - margin.top - margin.bottom;
    
    svg = d3.select(graph)
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
    document.getElementById("graph").appendChild(selectList);
    for (var i = 0; i < ops.length; i++) {
        var option = document.createElement("option");
        option.value = ops[i];
        option.text = ops[i];
        selectList.appendChild(option);
    }
    d3.select(graph)
        .append('p')
            .attr('id','buttonzone')
            .append('button')
                .attr('id','filterbutton')
                .style("border", "1px solid black")
                .text('Filter Data')

}
function build_scales() {
    xScale = d3.scaleSqrt().range([0, width]);
    yScale = d3.scaleLinear().range([height,0]);
    yAxis = d3.axisLeft(yScale)
    xAxis = d3.axisBottom(xScale)
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "x axis")
    .call(xAxis);

    svg.append("g")
    .attr("transform", "translate(0,0)")
    .attr("class", "y axis")
    .call(yAxis);  
}

function updateScalesFromData() {
    xScale.domain([0,d3.max(movie_data,d=> d.m_budget)]).nice();
    yScale.domain([0,d3.max(movie_data,d=> d.m_imdb)]).nice();
    xAxis.scale(xScale);
    yAxis.scale(yScale);
    d3.select(".x.axis").transition().duration(animation_duration).call(xAxis);
    d3.select(".y.axis").transition().duration(animation_duration).call(yAxis);    
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
        + yScale(d.m_imdb) + ")";
      });
  }
  

function updating() {
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
function createChoropleth() {
    // define map projection
    w= 900;
    h = 600
   
    var projection = d3.geoMercator()
        .translate([w/2, h/1.5])
        .scale([130]);

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-7, 0])
        .html(function(d) {
            var price = (d.properties.value) ?  "$" + d.properties.value.toFixed(2) :  "$0";
            return "<strong>"+d.properties.name + "</strong></br>" + price;
            
        })
    //Define default path generator
    var path = d3.geoPath()
        .projection(projection);
    var svg = d3.select("#world")
        .append("svg")
            .attr("id", "worldmap")
            .attr("width", w)
            .attr("height", h)
            .append("g")
                .attr("transform", "translate(" + 10 + "," + 10 + ")")

    svg.call(tip);
    var color = d3.scaleQuantile()
        .range(["rgb(186, 228, 179)", "rgb(139, 201, 128)", "rgb(116,196,118)", "rgb(30, 158, 69)", "rgb(0,109,44)"]);

    var min = Math.min.apply(null, country_data.map(item => item.avg_budget)),
        max = Math.max.apply(null, country_data.map(item => item.avg_budget));
    color.domain([min, max]);
    d3.json("data/world.json", function(error, p) {
        all_features = p.features;
        for (var i = 0; i < all_features.length; i++){
            world_data.push(all_features[i].properties.name);
        }
    });
    d3.json("data/world.json", function(json){

        //Merge data
        for (var i = 0; i < country_data.length; i++){
            var dataCountry = country_data[i].country;
            var dataValue = parseFloat(country_data[i].avg_budget);
            
            for (var n = 0; n < json.features.length; n++){
                    var jsonCountry = json.features[n].properties.name;
                    if (dataCountry == jsonCountry){
                        //Copy the data value into the JSON
                        json.features[n].properties.value = dataValue;
                        break;
                    }
                }
            }

        svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", function(d){
                //get the data value
                var value = d.properties.value;
                if(value){
                    //If value exists
                    return color(value);
                } else {
                      return "#ccc"
                }
            })
            .on("mouseover", function(d) {
                d3.select(this).style("fill",'yellow')
                price = d3.select(this)
               
                tip.show(d, d3.select(this))
                //console.log(d.properties.name);
            }).on("mouseout", function(d) {
                tip.hide(d, d3.select(this))	
                if (color(d.properties.value)){
                    d3.select(this).style("fill",color(d.properties.value));
                } else {
                    d3.select(this).style("fill","#ccc");
                }
           });
        });
}


function initialize() {
    setup_graph();
    build_scales();
    build_buttons();    
    updateScalesFromData(); 
    build_scatterplot();
    updating();
    createChoropleth();
}