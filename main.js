//window.onload = initialize;
var country_data, country_count, country_budget, country_imdbscore, country_budget_count;
var xScale, yScale, yAxis, xAxis;
var bars, width, height, svg;
const animation_duration = 2000;
const margin = {top: 20, right: 40, bottom: 20, left: 90};

// load data
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
        if (data[i].country){ // in case country doesn't have name
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
    var selectList = document.createElement("SELECT")
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
  }

// function start() {
//                 document.getElementById('filterbutton').on('click', function() {
//                     bars.selectAll('.bar')
//                     .transition()
//                     .duration(function(d) {
//                         return Math.random() * 1000;
//                     })
//                     .delay(function(d) {
//                         return d.frequency * 8000
//                     })
                    
//                     .attr('width', function (d) {
//                         if (selectList.options[selectList.selectedIndex].value == "Average IMDB Rating"){
//                             xScale.domain([0, d3.max(country_data, function(d) {
//                                 return d.avg_imdbscore;
//                             })]);
//                             console.log('measure by rating');
//                             return xScale(d.avg_imdbscore);
//                         } 
//                         else if (selectList.options[selectList.selectedIndex].value == "Average Budget"){
//                             console.log('measure by budget');
//                             xScale.domain([0, d3.max(country_data, function(d) {
//                                 return d.avg_budget;
//                             })]);
//                             return xScale(d.avg_budget);
//                         } 
//                         else if (selectList.options[selectList.selectedIndex].value == "Total Movies"){
//                             console.log('measure by count');
//                             xScale.domain([0, d3.max(country_data, function(d) {
//                                 return d.count;
//                             })]);
//                             return xScale(d.count);
//                         } 
                        
//                     });
                
//                 });
    

 
// }

function initialize() {
    setup();
    build_scales();
    updateScalesFromData(); 
    updating();
    
}