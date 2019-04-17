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
    w= 1000;
    h = 800
   
    var projection = d3.geoMercator()
        .translate([w/2, h/1.5])
        .scale([150]);

    //Define default path generator
    var path = d3.geoPath()
        .projection(projection);
    var svg = d3.select("#world")
        .append("svg")
            .attr("id", "chart")
            .attr("width", w)
            .attr("height", h)
            .append("g")
                //.attr("tranform", "translate(0 ," + margin.top + ")");

    var color = d3.scaleQuantile()
        .range(["rgb(237, 248, 233)", "rgb(186, 228, 179)", "rgb(116,196,118)", "rgb(49,163,84)", "rgb(0,109,44)"]);
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

        //Merge the agriculture and GeoJSON data
        //Loop through once for each agriculture data value
        for(var i = 0; i < country_data.length; i++){
            // grab state name
            var dataCountry = country_data[i].country;

            //grab data value, and convert from string to float
            var dataValue = parseFloat(country_data[i].avg_budget);
            // console.log(dataCountry," ", dataValue);
            //find the corresponding state inside the GeoJSON
            for(var n = 0; n < json.features.length; n++){

                    // properties name gets the states name
                    var jsonCountry = json.features[n].properties.name;
                    // if statment to merge by name of state
                    if(dataCountry == jsonCountry){
                        //Copy the data value into the JSON
                        // basically creating a new value column in JSON data
                        json.features[n].properties.value = dataValue;
                        // console.log(dataCountry, ", ", jsonCountry, ', ', dataValue)
                        //stop looking through the JSON
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
                    // If value is undefined
                    //we do this because alaska and hawaii are not in dataset we are using but still in projections
                    return "#ccc"
                }
            });
        });
}

function initialize() {
    setup();
    build_scales();
    updateScalesFromData(); 
    updating();
    createChoropleth();
}