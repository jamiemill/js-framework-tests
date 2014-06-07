$(document).ready(function() {
    var app = new App();
    Backbone.history.start({pushState: true});
});

// Parent version: routes-triggered

// In this version:
// - html5 pushstate is used
// - navigation clicks are intercepted
// - they are translated into instructions to the App object to show a page
// - the App object then notifies the router to update the URL passively
// - the nav view's lifecycle is long, it is told to change state when
//   the main view changes.


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

var App = function() {
    this.initialize.apply(this, arguments);
};
App.prototype = {
    appRouter: null,
    mainView: null,
    session: null,
    initialize: function() {
        this.session = new Session();
        this.appRouter = new AppRouter({app: this, session: this.session});
    },
    showHome: function() {
        var appView = new AppView({app: this});
        this._show(appView, '');
        var watchlist = new Watchlist();
        watchlist.fetch().fail(errorMessager('Could not load watchist.'));
        appView.home(watchlist);
    },
    showStock: function(stockId) {
        var appView = new AppView({app: this});
        this._show(appView, 'stock/' + stockId);
        var stock = new Stock({id: stockId});
        stock.fetch().fail(errorMessager('Could not load stock.'));
        appView.stock(stock);
    },
    showLogin: function() {
        this._show(new LoginView({session: this.session}), 'login');
    },
    _show: function(view, route) {
        this.mainView && this.mainView.remove();
        this.mainView = view;
        this.mainView.render().$el.appendTo($('body'));
        this.appRouter.navigate(route);
    },
    logout: function() {
        this.session.destroy()
            .then(_.bind(this._onLogoutSuccess, this))
            .fail(_.bind(this._onLogoutFail, this));
    },
    _onLogoutSuccess: function() {
        this.session.clear();
        Backbone.history.navigate('login', {trigger: true});
    },
    _onLogoutFail: errorMessager('Error logging out.')
};

var AppRouter = Backbone.Router.extend({
    app: null,
    session: null,
    routes: {
        '': 'home',
        'stock/:id': 'stock',
        'login': 'login'
    },
    initialize: function(options) {
        this.app = options.app;
        this.session = options.session;
    },
    login: function() {
        this.app.showLogin();
    },
    home: requireAuth(function() {
        this.app.showHome();
    }),
    stock: requireAuth(function(stockId) {
        this.app.showStock(stockId);
    })
});

var AppView = Backbone.View.extend({
    navView: null,
    mainView: null,
    initialize: function(options) {
        this.navView = new NavView({app: options.app});
    },
    render: function() {
        var template = _.template($('#app-template').text());
        this.$el.html(template());
        this.navView.render().$el.appendTo(this.$('#nav-container'));
        return this;
    },
    home: function(watchlist) {
        this._show(new HomeView({watchlist: watchlist}), 'home');
    },
    stock: function(stock) {
        this._show(new StockView({stock: stock}), 'stock');
    },
    _show: function(view, pageName) {
        this.mainView && this.mainView.remove();
        this.mainView = view;
        this.mainView.render().$el.appendTo($('#main-view-container'));
        this.navView.setCurrent(pageName);
    }
});


var LoginView = Backbone.View.extend({
    session: null,
    events: {
        'submit form': '_onSubmit'
    },
    initialize: function(options) {
        this.session = options.session;
    },
    render: function() {
        var template = _.template($('#login-template').text());
        this.$el.html(template());
        return this;
    },
    _onSubmit: function(e) {
        e.preventDefault();
        this.session.clear();
        this.session.set({
            username: this.$('.username').val(),
            password: this.$('.password').val()
        });
        this.session.save()
            .then(_.bind(this._onLoginSuccessfulSubmission, this))
            .fail(_.bind(this._onLoginFailedSubmission, this));
    },
    _onLoginSuccessfulSubmission: function() {
        if (this.session.get('authenticated')) {
            Backbone.history.navigate('', {trigger: true});
        } else {
            errorMessager('Credentials incorrect.')();
        }
    },
    _onLoginFailedSubmission: errorMessager('Could not submit login.')
});

var HomeView = Backbone.View.extend({
    watchlistView: null,
    initialize: function(options) {
        this.watchlistView = new WatchlistView({watchlist: options.watchlist});
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
    app: null,
    events: {
        'click a': '_navClicked',
        'click .logout': '_onLogoutClick'
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
    },
    _onLogoutClick: function(e) {
        e.preventDefault();
        this.app.logout();
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

var Session = Backbone.Model.extend({
    url: function() {
        return '/sessions.json'
    }
});
