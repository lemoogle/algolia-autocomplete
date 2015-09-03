#Algolia Autocomplete UI Exercise

Checkout the [Live Demo](http://lemoogle.github.io/algolia-autocomplete/)
Checkout the [Source Code](https://github.com/lemoogle/algolia-autocomplete)

## Objective: Build an Algolia-based auto-completion menu for e-commerce

![](http://puu.sh/jY3aa/d5f606a011.png)

My first decision was deciding whether I should simply implement a simple autocomplete solution, i.e. a dropdown on a text input, or if a fully fledged search app with filtering would be better.
Considering the realtime nature of algolia queries, a full search experience would essentially serve as an augmented Autocomplete, so I decided to go that way.

My next step was deciding what technologies to use, what I really wanted was to avoid too many ajax form submissions and click handlers on everything, so I decided to use an MVC framework.
I looked at Angular at first, as I wanted to learn something while achieving the exercise, but then decided on using Ember.js, a framework i've used before at hackathons, always badly or so I thought.

Halfway through building, I realized I was pretty much building [Algolia's Instant Search demo but in Ember](http://demos.algolia.com/instant-search-demo/), I decided to keep going and ended up taking a few pointers from it ( i.e. the Sort )

## Indexing of the data

* I dragged and dropped the JSON.
* Set facets to brand, type, categories, price
* Set fields to index brand, name , categories, description
* For price sorting, created 2 indexes with custom ranking on price.


## Ember-CLI

To scaffold the project, I would use [Ember-cli](http://www.ember-cli.com/). Ember-cli uses broccoli, meaning I did not use Grunt or Gulp, hence I pretty much fail that requirement already !! I also didn't really use SCSS since I tell ember to load the bootstrap CSS directly in the broccoli initialization.


### Scaffolding

Ember CLI scaffolds our Ember files into different folders. The relevant ones for our implementation are :

* Adapters : This is a custom folder I made to contain the Object that would call Algolia using the algoliaclient library.
* Controllers : Folder to contain each Controller's implementation
* Routes: Folder to contain route logic
* Styles: Contains the CSS that will load depending on the route. i.e. the Index route will load app.css and index.css
* Templates: Handlebars/Htmlbars templates that will be useed for the routes of the same name, can also be loaded from another template.
* Views : Folder for our view implementations. In our case we have a view for our checkboxes to handle their checked status and what happens when they're clicked. NOTE: I found out views are pretty much deprecated in Ember 2.\* but found that out too late.


## Our implementation

The chosen implementation was to have everything single paged. THis meant:

* One route :  the index route `routes/index.js`
* One model 
* One Controller : the index controller `controllers/index.js
* One Template : The index template. `views/index.hbs`
* One Adapter: to call Algolia

### The Model

Our model would need to contain all the information of our search.

```json
{
   "page":0,
   "ranking":"",
   "text":"",
   "selectedFacets":{
      "brand":["HP"],
      "categories":[],
      "type":[],
      "price":[]
   }
}
```

*Note:I didn't end up implementing pagination*

Text would contain our search query, the selected facets object tracks which facet value we've ticked, the ranking tracks the value of our "sort options" select allowing sorting by price.

Since I wasn't storing the searches, I decided to avoid using Ember's models and store and just used a plain javascript representation of the object as we will see in the route's implementation.

### The Route

```javascript
//routes/index.js
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
```

The index route's sole goal is to initialize the default model. 
>I don't like having to initialize the selectedFacets with each facet, but it saved a lot of time to do it this way, I would spend more time ensuring facets to be configurable

### The Algolia Adapter

```javascript
//adapters/algolia.js
export default Ember.Object.extend({

  search:function(model){
    var client = algoliasearch("2E5S5FGYCJ", "82df05a7b20f0c65534103e6ff2c8600");
    // Different indices for different sort options, we append the ranking to our default index name
    var index = client.initIndex('bestbuy'+model.ranking);
    // We read the selectedFacets values and generate the facetFilters parameter, using arrays for "OR" operator.
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
    // We return the promise to the controller
    return index.search(model.text,{"maxValuesPerFacet":8, "facetFilters":facetFilters, "facets":"type,categories,brand,price"});
  }
});

```

> Once again I don't like having the API key as well as the list of facets hardcoded here, but I need to figure out how to handle user configuration files/values for ember.

The Adapter takes a model, translates its values into parameters for the algolia client, and sends off the query. See the code comments above for annotations.

### The Index Controller

We have an adapter, but right now nothing is passing the model to the adapter, and nothing is handling it.

```javascript
//controllers/index.js
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

```

The first thing to note is that our controller has two empty paramters "results" and "facets", these are the controller values that will get filled with results once we fire off the query.

The controller also imports our Adapter and creates an instance of it, which it uses whenever a search needs to happen.

** The search function **

We only want to run a new search when our model changes. EMber lets us run the search function automatically by observing a few values `.observes('model.text','model.selectedFacets','ranking')`

This way whenever these values are changed, the search method will use the Algolia Adapter to send a call. Upon result it will populate 

> I have to turn the dictionary of facets returned into arrays of objects, since it seems that handlebars is not great at iterating through objects. And yes... I take a shortcut by declaring the function each time. Sorry ! :)

** Observing and changing our model ** 

I've just shown all of the logic that takes a model and gets the results from algolia, but let's have a look at how we display the model in our templates, and how we even use those templates to **change** our model.

### The Index template.


**The search input**

```hbs

    <span class="input input--isao">
      {{input class="input__field input__field--isao" type="text" value=model.text}}
    					<label class="input__label input__label--isao" for="input-38" data-content="Search">
    						<span class="input__label-content input__label-content--isao">Search</span>
    					</label>
    </span>
```

Ember offers an Input helper, we attach its value to "model.text" and that's all we need to do! Now any change to that input's value ( i.e. when we type in it) changes the model.text value. That change is observed by our index controller and it runs a search for each keystroke!

![](http://g.recordit.co/j99GMdR7JD.gif)

**Sort selection**


```hbs
        <div class="alert alert-success" role="alert">
          {{#view "select"
           content=sortOptions
           optionValuePath="content.value"
           optionLabelPath="content.name"
           value=ranking
        }}
        {{/view}}
          </div>
```

> I found out after implementation that views and the select preset are now deprecated! Would need to implement a component to do this. Would be quite good in a way since I would avoid the unstylable select tags

The "select" view is a preset that creates the select inputs for us. We use the sortOptions object we configured in the Controller to contain our values for Price Ascending and Price Descending to populate that select. We bind the `value` of our select to `ranking` which is also observed by the controller! Meaning any change to it will call our Search function again, which is what we want !


![](http://g.recordit.co/RoPNUuAYGM.gif)

**Facets**

Facets were a bit more difficult and I ended up having to create a custom view object!

```hbs
        {{#each facets as |facet|}}
        <div class="facets">
          <h3>{{facet.key}}</h3>
          <ul class="facet-list">
          {{#each facet.val as |entry|}}
            <li>
              <label>
                {{#view "facetbox" facet=facet.key selected=model.selectedFacets content=entry.key }}{{/view}}
                  {{entry.key}} - {{entry.val}}
              </label>
            </li>
          {{/each}}
          </ul>
        </div>
        {{/each}}
```

For each facet we display a list of its values, each element display the value name and its count.

For the checkboxes we want to make sure that whenever one is clicked, a new search is ran with the new facet selections! For that we create a new facetbox view!

> Yes... here again I find out views are now deprecated...


```
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
```

The `Ember.Checkbox` class will render a plain checkbox, we extend the `checked` function to make sure that any selected value will have its checkbox ticked. If the checkbox's associated facet value is present in our facet's selected values array then the checkbox will be ticked.

The `click` function, uses the checked logic. If we click a checked box, we need to remove it from our selected values, and if we click an unchecked box we want to do the oppsoite of that. Observing objects such as `model.selectedFacets` won't notice attribute changes, so we make sure that our controller notices the change by calling `this.get('controller').propertyDidChange('model.selectedFacets')`

![](http://g.recordit.co/UsJ9CakvP2.gif)

## Conclusion

That was pretty much all the code! Our goal was achieved, we avoided writing too many event handlers and having templates defined in the javascript itself!

## Extra notes

### Stuff I learnt out about algolia

* Damn it's fast :P 
* Sorting is done at index time!! I kept trying to pass "customRanking" parameters to my search ( that's what I get for reading documentation too fast !)

### Stuff I didn't do but wanted to

* I'm pretty sure that right now if the internet is slow and that you type fast, and an older request returns after the last keystroke's request, the older results are displayed. I'd need to find a way around that.
* Configurable APIkey and facets ( not hardcoded )
* Slider for Price
* Pagination: This one is pretty easy to implement, albeit a bit annoying to deal with the template to render accordingly depending on the page number ( min max etc ).
* Extra info like total results etc.

### Stuff that doesn't fit into any category

* I'll admit my CSS is not the greatest, I relied pretty heavily on bootstrap. I used some css code I often use from [Tympanus](http://tympanus) for the template.
