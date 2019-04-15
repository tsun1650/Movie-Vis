// var mydata = d3.csv("movies.csv", function(d) {

//     for (var i=0; i<csv.length; ++i) {
//         csv[i].COUNTRY = (csv[i].country);
//         csv[i].IMDB_SCORE = Number(csv[i].imdb_score);
//         csv[i].BUDGET = Number(csv[i].budget);
//         csv[i].COUNT = 
//     }
// });
var mydata = d3.csv("movies.csv", function(d) {
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
            "count" : country_count[country],
            "avg_budget": country_budget[country] /  country_budget_count[country],
            "avg_imdbscore": country_imdbscore[country] /  country_count[country]
        });   
    }
    console.log(country_data)
    // for (var i = 0; i < country_count.length; i++) {
    //     country_budget[country_count[i]]
    // }
    // console.log(country_imdbscore)
  });
 