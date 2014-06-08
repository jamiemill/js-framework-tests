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
    rootRegion: '#root'
});

App.addInitializer(function(options) {
    this.session = new Session();
    this.appController = new AppController({app: this, session: this.session});
    this.appRouter = new AppRouter({controller: this.appController});
    Backbone.history.start({pushState: true});
});

App.commands.setHandler('show:home', function() {
    App.appController.showHome();
});

App.commands.setHandler('show:stock', function(stockId) {
    App.appController.showStock(stockId);
});

App.commands.setHandler('logout', function(stockId) {
    App.session.destroy()
        .then(function() {
            App.session.clear();
            Backbone.history.navigate('login', {trigger: true});
        })
        .fail(errorMessager('Error logging out.'));
});

App.commands.setHandler('login', function(username, password) {
    App.session.clear();
    App.session.set({
        username: username,
        password: password
    });
    App.session.save()
        .then(function() {
            if (App.session.get('authenticated')) {
                Backbone.history.navigate('', {trigger: true});
            } else {
                errorMessager('Credentials incorrect.')();
            }
        })
        .fail(errorMessager('Could not submit login.'));
});

function requireAuth(cb) {
    return function() {
        var args = arguments;
        if (this.session.get('authenticated')) {
            cb.apply(this, args);
        } else {
            this.session.fetch()
                .then(_.bind(function(session) {
                    if (this.session.get('authenticated')) {
                        cb.apply(this, args);
                    } else {
                        Backbone.history.navigate('login', {trigger: true});
                    }
                }, this))
                .fail(errorMessager('Cannot fetch session.'));
        }
    }
}

function errorMessager(msg) {
    return function() {
        alert(msg);
    }
}

var AppController = Backbone.Marionette.Controller.extend({
    app: null,
    session: null, // Necessary for requireAuth() actions
    initialize: function(options) {
        this.app = options.app;
        this.session = options.session;
    },
    showHome: requireAuth(function() {
        var watchlist = new Watchlist();
        watchlist.fetch().fail(errorMessager('Could not load watchist.'));

        var appView = new AppView({app: this.app});
        this._show(appView, 'home', '');
        appView.showHome(watchlist);
    }),
    showStock: requireAuth(function(stockId) {
        var stock = new Stock({id: stockId});
        stock.fetch().fail(errorMessager('Could not load stock.'));

        var appView = new AppView({app: this.app});
        this._show(appView, 'stock', 'stock/' + stockId);
        appView.showStock(stock);
    }),
    showLogin: function() {
        this._show(new LoginView({app: this.app}), 'login' , 'login');
    },
    _show: function(view, pageName, route) {
        this.app.rootRegion.show(view);
        this.app.vent.trigger('page:shown', pageName);
        // TODO: should this be via event too?
        this.app.appRouter.navigate(route);
    }
});

var AppRouter = Backbone.Marionette.AppRouter.extend({
    controller: null,
    session: null,
    appRoutes: {
        '': 'showHome',
        'stock/:id': 'showStock',
        'login': 'showLogin'
    }
});

var AppView = Backbone.Marionette.Layout.extend({
    template: '#app-template',
    regions: {
        navRegion: '#nav-container',
        mainRegion: '#main-view-container'
    },
    initialize: function(options) {
        this.app = options.app;
    },
    showHome: function(watchlist) {
        this.mainRegion.show(new HomeView({watchlist: watchlist}));
    },
    showStock: function(stock) {
        this.mainRegion.show(new StockView({model: stock}));
    },
    onShow: function() {
        this.navRegion.show(new NavView({app: this.app}));
    }
});


var LoginView = Backbone.Marionette.ItemView.extend({
    session: null,
    events: {
        'submit form': '_onSubmit'
    },
    initialize: function(options) {
        this.app = options.app;
    },
    template: '#login-template',
    _onSubmit: function(e) {
        e.preventDefault();
        this.app.execute('login', this.$('.username').val(), this.$('.password').val());
    }
});

var HomeView = Backbone.Marionette.Layout.extend({
    template: '#home-template',
    regions: {
        watchlistRegion: '.watchlist-container'
    },
    initialize: function(options) {
        this.watchlist = options.watchlist;
    },
    onShow: function() {
        this.watchlistRegion.show(new WatchlistView({collection: this.watchlist}));
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

var NavView = Backbone.Marionette.ItemView.extend({
    app: null,
    template: '#nav-template',
    events: {
        'click a': '_navClicked',
        'click .logout': '_onLogoutClick'
    },
    initialize: function(options) {
        this.app = options.app;
        this.listenTo(this.app.vent, 'page:shown', this._highlight, this);
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
    _highlight: function(pageName) {
        this.$('a').removeClass('current');
        this.$('a.' + pageName).addClass('current');
    },
    _onLogoutClick: function(e) {
        e.preventDefault();
        this.app.execute('logout');
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

var Session = Backbone.Model.extend({
    url: function() {
        return '/sessions.json'
    }
});
