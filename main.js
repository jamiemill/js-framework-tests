$(document).ready(function() {
    var app = new App();
    Backbone.history.start({pushState: true});
});

// Parent version: master

// In this version:
// - html5 pushstate is used
// - navigation clicks are intercepted
// - they are translated into instructions to the App object to show a page
// - the App object then notifies the router to update the URL passively
// - the nav view's lifecycle is long, it is told to change state when
//   the main view changes.
// - note that when the nav view intercepts a click on a menu item
//   it doesn't highlight that menu item, it just tells the app what
//   view to show, and waits to be told what to highlight in response.
// - instead it could highlight the item immediately, but then there
//   are two codepaths for highlighting the current item (being told
//   externally after initial construction, and internally on click)


var App = function() {
    this.initialize.apply(this, arguments);
};
App.prototype = {
    appRouter: null,
    mainView: null,
    navView: null,
    initialize: function() {
        this.appRouter = new AppRouter({app: this});
        this.navView = new NavView({app: this});
        this.navView.render().$el.appendTo('#nav-container');
    },
    showHome: function() {
        this._show(new HomeView(), 'home', '');
    },
    showStock: function(stockId) {
        this._show(new StockView({stockId: stockId}), 'stock', 'stock/' + stockId);
    },
    _show: function(view, pageName, route) {
        this.mainView && this.mainView.remove();
        this.mainView = view;
        this.mainView.render().$el.appendTo($('#main-view-container'));
        this.navView.setCurrent(pageName);
        this.appRouter.navigate(route);
    }
};


var AppRouter = Backbone.Router.extend({
    routes: {
        '': 'home',
        'stock/:id': 'stock'
    },
    app: null,
    initialize: function(options) {
        this.app = options.app;
    },
    home: function() {
        this.app.showHome();
    },
    stock: function(stockId) {
        this.app.showStock(stockId);
    }
});


var HomeView = Backbone.View.extend({
    watchlistView: null,
    initialize: function() {
        this.watchlistView = new WatchlistView();
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
        this.stock = new Stock({id: options.stockId});
        this.stock.fetch();
        this.stock.on('change', this.render, this);
    },
    render: function() {
        var template = _.template($('#stock-template').text());
        this.$el.html(template({stock: this.stock.toJSON()}));
        return this;
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
    },
    _navClicked: function(e) {
        e.preventDefault();
        var pageName = $(e.target).data('page');
        if (pageName === 'home') {
            this.app.showHome();
        } else if (pageName === 'stock') {
            this.app.showStock($(e.target).data('stock-id'));
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

var WatchlistView = Backbone.View.extend({
    watchlist: null,
    initialize: function() {
        this.watchlist = new Watchlist();
        this.watchlist.fetch();
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
