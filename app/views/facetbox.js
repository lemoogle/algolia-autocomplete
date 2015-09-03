export default Ember.Checkbox.extend({
        checked: function () {
            var currentFacet=this.get('facet');
            var facets = this.get('selected')[currentFacet];
            return facets.contains(this.get('content'));
        }.property('content', 'selected.[]'),

        click: function (evt) {
            var checked = this.get('checked'),
                facet = this.get('content');
            var currentFacet=this.get('facet');
            var facets = this.get('selected');
             if (checked) {
                 facets[currentFacet].pushObject(facet);
             } else {
                 facets[currentFacet].removeObject(facet);
             }
             this.get('controller').propertyDidChange('model.selectedFacets')

         }
    });
