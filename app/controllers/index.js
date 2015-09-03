import Ember from 'ember';
import Algolia from '../adapters/algolia'
export default Ember.Controller.extend({

  results:[],
  facets:[],
  sortOptions: [
    {"name":"Relevance","value":""},
    {"name":"Price- Low","value":"priceasc"},
    {"name":"Price- High","value":"pricedesc"}
  ],
  adapter: Algolia.create(),
  ranking:"",

  search: function() {
    var model=this.get('model')
    var adapter = this.get('adapter')
    var self=this;
    this.set("model.ranking", this.get('ranking'))
    adapter.search(model).then(function(content){

      var facets= content.facets;
      function objToArray(obj){
        var res=[];
        for (var key in obj){
          res.push({"key":key,"val":obj[key]});
        }
        return res
      }
      for (var facet in facets){
        facets[facet]=objToArray(facets[facet]);
      }
      facets=objToArray(facets);

      self.set('results',content.hits);
      self.set('facets', facets)
    })
  }.observes('model.text','model.selectedFacets','ranking')

});
