
export default Ember.Object.extend({

  search:function(model,params){
    var client = algoliasearch("2E5S5FGYCJ", "82df05a7b20f0c65534103e6ff2c8600");
    var index = client.initIndex('bestbuy'+model.ranking);
    var facetFilters=[];
    for (var facet in model.selectedFacets){
      var disjunctive=[];
      var selectedVals=model.selectedFacets[facet];
      if (selectedVals.length>0){
        for (var i=0; i<selectedVals.length;i++){
          disjunctive.push(facet+":"+selectedVals[i])
        }
        facetFilters.push(disjunctive);
      }
    }
    return index.search(model.text,{"maxValuesPerFacet":8, "facetFilters":facetFilters, "facets":"type,categories,brand,price"});
  }
});
