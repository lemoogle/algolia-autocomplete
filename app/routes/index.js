import Ember from 'ember';
export default Ember.Route.extend({
  setupController: function(controller, search){
    controller.set('model',search);
  },
  model: function(params){
   var selectedFacets={"brand":[],"categories":[],"type":[],"price":[]}

   return {'page':0, 'ranking':'', 'text':'', 'selectedFacets':selectedFacets}

  }
});
