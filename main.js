$(document).ready(function() {
    App.start();
});

// Parent version: app-object-passive-router

// In this version:
// - This is supposed to be idiomatic Marionette
// - Marionette already adds a few features the main branch didn't have
//   - automatic re-rendering of watchlist when items are added/removed
// - html5 pushstate is used
// - navigation clicks are intercepted
// - they are translated into instructions to the App object to show a page
// - the App object then notifies the router to update the URL passively
// - the nav view's lifecycle is long, it is told to change state when
//   the main view changes.

var App = new Backbone.Marionette.Application();

App.addRegions({
    navRegion: '#nav-container',
    mainRegion: '#main-view-container'
});

App.addInitializer(function(options) {
    var appController = new AppController({app: this});
    // TODO get rid of these references by using events?
    this.appRouter = new AppRouter({controller: appController});

    this.navView = new NavView({controller: appController});
    this.navRegion.show(this.navView);

    Backbone.history.start({pushState: true});
});

var AppController = Backbone.Marionette.Controller.extend({
    app: null,
    initialize: function(options) {
        this.app = options.app;
    },
    showHome: function() {
        var watchlist = new Watchlist();
        watchlist.fetch();
        this._show(new HomeView({watchlist: watchlist}), 'home', '');
    },
    showStock: function(stockId) {
        var stock = new Stock({id: stockId});
        stock.fetch();
        this._show(new StockView({model: stock}), 'stock', 'stock/' + stockId);
    },
    _show: function(view, pageName, route) {
        this.app.mainRegion.show(view);
        this.app.navView.setCurrent(pageName);
        this.app.appRouter.navigate(route);
    }
});

var AppRouter = Backbone.Marionette.AppRouter.extend({
    appRoutes: {
        '': 'showHome',
        'stock/:id': 'showStock'
    }
});


var HomeView = Backbone.View.extend({
    watchlistView: null,
    initialize: function(options) {
        this.watchlistView = new WatchlistView({collection: options.watchlist});
    },
    render: function() {
        var template = _.template($('#home-template').text());
        this.$el.html(template());
        this.$('.watchlist-container').append(this.watchlistView.render().el);
        return this;
    }
});


var StockView = Backbone.Marionette.ItemView.extend({
    template: '#stock-template',
    // I'm surprised this is necessary, but it seems so, and can't
    // see evidence in docs or testsuite that this happens automatically.
    modelEvents: {
        'change': 'render'
    }
});

// TODO: don't talk to controller directly, use events
var NavView = Backbone.View.extend({
    controller: null,
    current: null,
    events: {
        'click a': '_navClicked'
    },
    initialize: function(options) {
        this.controller = options.controller;
    },
    _navClicked: function(e) {
        e.preventDefault();
        var pageName = $(e.target).data('page');
        if (pageName === 'home') {
            this.controller.showHome();
        } else if (pageName === 'stock') {
            this.controller.showStock($(e.target).data('stock-id'));
        }
    },
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

var WatchlistItemView = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    template: '#watchlist-item-template'
});

var WatchlistView = Backbone.Marionette.CompositeView.extend({
    template: '#watchlist-template',
    itemView: WatchlistItemView,
    itemViewContainer: 'ul'
});

var Stock = Backbone.Model.extend({
    // These are added to prevent template exploding when
    // rendered before model is fetched.
    // We could instead switch the template dymanically
    // to use a 'loading' template when not loaded.
    defaults: {
        symbol: '',
        name: ''
    },
    url: function() {
        return '/stock-' + this.id + '.json';
    }
});

var Watchlist = Backbone.Collection.extend({
    model: Stock,
    url: '/watchlist.json'
});

