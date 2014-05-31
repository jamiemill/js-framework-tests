$(document).ready(function() {
    var appRouter = new AppRouter();
    Backbone.history.start({pushState: true});
});

// Parent version: master

// In this version:
// - html5 pushstate is used
// - navigation clicks are intercepted
// - they are translated to calls to router.navigate with {trigger:true}
// - the nav view's lifecycle is long, it is told to change state when
//   the main view changes.
// - note that when the nav view intercepts a click on a menu item
//   it doesn't highlight that menu item, it just tells the router
//   to navigate, and waits to be told what to highlight in response.
// - instead it could highlight the item immediately, but then there
//   are two codepaths for highlighting the current item (being told
//   externally after initial construction, and internally on click)


var AppRouter = Backbone.Router.extend({
    mainView: null,
    navView: null,
    routes: {
        '': 'home',
        'stock/:id': 'stock'
    },
    initialize: function() {
        this.navView = new NavView({router: this});
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
    router: null,
    current: null,
    events: {
        'click a': '_navClicked'
    },
    initialize: function(options) {
        this.router = options.router;
    },
    _navClicked: function(e) {
        e.preventDefault();
        var pageName = e.target.pathname.substr(1);
        this.router.navigate(pageName, {trigger: true});
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
