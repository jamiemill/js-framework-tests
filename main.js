$(document).ready(function() {
    App.start();
});

// Parent version: app-object-passive-router

// In this version:
// - This is supposed to be idiomatic Marionette
// - Marionette already adds a few features the main branch didn't have
//   - automatic re-rendering of watchlist when items are added/removed
//   - hopefully proper cleanup of views when shown/hidden via regions
// - html5 pushstate is used
// - navigation clicks are intercepted
// - they are translated into 'commands' to show a page
// - the App object then tells a Controller to show something
// - the nav view's lifecycle is long, it changes state when it hears an
//   event saying that the page changed.

var App = new Backbone.Marionette.Application();

App.addRegions({
    navRegion: '#nav-container',
    mainRegion: '#main-view-container'
});

App.addInitializer(function(options) {
    this.appController = new AppController({app: this});
    this.appRouter = new AppRouter({controller: this.appController});
    this.navRegion.show(new NavView({app: this}));
    Backbone.history.start({pushState: true});
});

App.commands.setHandler('show:home', function() {
    App.appController.showHome();
});

App.commands.setHandler('show:stock', function(stockId) {
    App.appController.showStock(stockId);
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
        this.app.vent.trigger('page:shown', pageName);
        // TODO: should this be via event too?
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

var NavView = Backbone.View.extend({
    app: null,
    current: null,
    events: {
        'click a': '_navClicked'
    },
    initialize: function(options) {
        this.app = options.app;
        this.listenTo(this.app.vent, 'page:shown', this._setCurrent, this);
    },
    _navClicked: function(e) {
        e.preventDefault();
        var pageName = $(e.target).data('page');
        if (pageName === 'home') {
            this.app.execute('show:home');
        } else if (pageName === 'stock') {
            this.app.execute('show:stock', $(e.target).data('stock-id'));
        }
    },
    _highlightCurrent: function() {
        this.$('a').removeClass('current');
        this.$('a.' + this.current).addClass('current');
    },
    _setCurrent: function(current) {
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

