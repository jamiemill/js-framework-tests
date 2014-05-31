$(document).ready(function() {
    var appRouter = new AppRouter();
    Backbone.history.start({pushState: false});
});

// In this version:
// - navigation is via real clicks on links that are just anchors
// - therefore routes get triggered automatically by backbone
// - there is no html5 pushstate
// - the nav view's lifecycle is long, it is told to change state when
//   the main view changes.


var AppRouter = Backbone.Router.extend({
    mainView: null,
    navView: null,
    routes: {
        '': 'home',
        'stock': 'stock'
    },
    initialize: function() {
        this.navView = new NavView();
        this.navView.render().$el.appendTo('#nav-container');
    },
    home: function() {
        this.mainView && this.mainView.remove();
        this.mainView = new HomeView();
        this.mainView.render().$el.appendTo($('#main-view-container'));
        this.navView.setCurrent('home');
    },
    stock: function() {
        this.mainView && this.mainView.remove();
        this.mainView = new StockView();
        this.mainView.render().$el.appendTo($('#main-view-container'));
        this.navView.setCurrent('stock');
    }
});


var HomeView = Backbone.View.extend({
    render: function() {
        var template = _.template($('#home-template').text());
        this.$el.html(template());
        return this;
    }
});


var StockView = Backbone.View.extend({
    render: function() {
        var template = _.template($('#stock-template').text());
        this.$el.html(template());
        return this;
    }
});

var NavView = Backbone.View.extend({
    current: null,
    _highlightCurrent: function() {
        this.$('a').removeClass('current');
        this.$('a.' + this.current).addClass('current');
    },
    setCurrent: function(current) {
        this.current = current;
        this.render();
    },
    render: function() {
        var template = _.template($('#nav-template').text());
        this.$el.html(template());
        this._highlightCurrent();
        return this;
    }
});
