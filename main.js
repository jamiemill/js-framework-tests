$(document).ready(function() {
    var appRouter = new AppRouter();
    Backbone.history.start({pushState: false});
});

// Parent version: none

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
        'stock/:id': 'stock'
    },
    initialize: function() {
        this.navView = new NavView();
        this.navView.render().$el.appendTo('#nav-container');
    },
    home: function() {
        this._show(new HomeView(), 'home');
    },
    stock: function(stockId) {
        var stock = new Stock({id: stockId});
        stock.fetch();
        this._show(new StockView({stock: stock}), 'stock');
    },
    _show: function(view, pageName) {
        this.mainView && this.mainView.remove();
        this.mainView = view;
        this.mainView.render().$el.appendTo($('#main-view-container'));
        this.navView.setCurrent(pageName);
    }
});


var HomeView = Backbone.View.extend({
    watchlistView: null,
    initialize: function() {
        var watchlist = new Watchlist();
        watchlist.fetch();
        this.watchlistView = new WatchlistView({watchlist: watchlist});
    },
    render: function() {
        var template = _.template($('#home-template').text());
        this.$el.html(template());
        this.$('.watchlist-container').append(this.watchlistView.render().el);
        return this;
    }
});


var StockView = Backbone.View.extend({
    stock: null,
    initialize: function(options) {
        this.stock = options.stock;
        this.stock.on('change', this.render, this);
    },
    render: function() {
        var template = _.template($('#stock-template').text());
        this.$el.html(template({stock: this.stock.toJSON()}));
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

var WatchlistView = Backbone.View.extend({
    watchlist: null,
    initialize: function(options) {
        this.watchlist = options.watchlist;
        this.watchlist.on('sync', this.render, this);
    },
    render: function() {
        var template = _.template($('#watchlist-template').text());
        this.$el.html(template({watchlist: this.watchlist.toJSON()}));
        return this;
    }
});

var Stock = Backbone.Model.extend({
    url: function() {
        return '/stock-' + this.id + '.json';
    }
});

var Watchlist = Backbone.Collection.extend({
    model: Stock,
    url: '/watchlist.json'
});
