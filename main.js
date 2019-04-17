//window.onload = initialize;
var country_data, country_count, country_budget, country_imdbscore, country_budget_count;
var xScale, yScale, yAxis, xAxis;
var bars, width, height, svg;
var selectList;
var world_data = [];
const animation_duration = 2000;
const margin = {top: 20, right: 40, bottom: 20, left: 90};


//load world map data 
// d3.json("data/world.json", function(error, p) {
//     all_features = p.features;
//     for (var i = 0; i < all_features.length; i++){
//         world_data.push(all_features[i].properties.name);
//     }
// });

// load movie data
d3.csv("data/movies.csv", function(d) {
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

function setup_graph() {
   
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
    // add axis labels
    svg.append("text")
        .attr("x", 80)
        .attr("y", 13)
        .attr("class", "label")
        // .text("Countries");
        .text("IMDB Rating")
    svg.append("text")
        .attr('id','xaxisname')
        .attr("x", width-2)
        .attr("y", height-6)
        .attr("text-anchor", "end")
        .attr("class", "label")
        // .text(selectList.options[selectList.selectedIndex].value);  
        .text("Budget")
}
function build_scales2() {
    xScale = d3.scaleLinear().range([0, width]);
    yScale = d3.scaleLinear().range([0, height]);
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
function build_scales() {
    xScale = d3.scaleLinear().range([0, width])
    yScale = d3.scaleBand().rangeRound([0, height], 0.8);
    yAxis = d3.axisLeft(yScale);
    xAxis = d3.axisBottom().scale(xScale);

    
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
    updateScalesFromData(); 
    updating();
    createChoropleth();
}