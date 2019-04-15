window.onload = start;

// This is where all of our javascript code resides. This method
// is called by "window" when the document (everything you see on
// the screen) has finished loading.
function start() {

    var graph = document.getElementById('graph');

    var width = 700;
    var height = 600;

    var svg = d3.select(graph)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    var bars = svg.append('g');

    var xScale = d3.scaleLinear().range([0, width]);
    var yScale = d3.scaleBand().rangeRound([0, height], 0.8);

    var yAxis = d3.axisLeft(yScale);

    // clean up and organize data
    d3.csv("movies.csv", function(d) {
        return {
          country : d.country,
          title : d.movie_title,
          budget : +d.budget,
          imdb_score : +d.imdb_score
        }; 
      }, function(data) {
        var country_count = {};
        var country_budget = {};
        var country_imdbscore = {};
        var country_budget_count = {}
        for (var i = 0; i < data.length; i++) {
            country_count[data[i].country] = 1 + (country_count[data[i].country] || 0);
            // account for missing budgets
            if (data[i].budget) {
                country_budget_count[data[i].country] = 1 + (country_budget_count[data[i].country] || 0);
            }
            country_budget[data[i].country] = (country_budget[data[i].country] + data[i].budget || data[i].budget);
            country_imdbscore[data[i].country] = (country_imdbscore[data[i].country] + data[i].imdb_score || data[i].imdb_score);
            
        }
        var country_data = []
        for (country in country_count){
            country_data.push({
                "country" : country,
                "count" : +country_count[country],
                "avg_budget": +country_budget[country] /  country_budget_count[country],
                "avg_imdbscore": +country_imdbscore[country] /  country_count[country]
            });   
        }


        xScale.domain([0, d3.max(country_data, function(d) {
            return d.avg_budget;
        })]);

        yScale.domain(country_data.map(function(d) {
            return d.country;
        }));

        bars.append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate(20, 0)')
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
    });
 
}