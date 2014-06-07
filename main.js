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

var AppRouter = Backbone.Router.extend({
    mainView: null,
    navView: null,
    session: null,
    routes: {
        '': 'home',
        'stock/:id': 'stock',
        'login': 'login'
    },
    initialize: function() {
        this.session = new Session();
    },
    home: requireAuth(function() {
        var appView = new AppView({session: this.session});
        this._show(appView, 'home');
        appView.home();
    }),
    stock: requireAuth(function(stockId) {
        var appView = new AppView({session: this.session});
        this._show(appView, 'stock');
        appView.stock(stockId);
    }),
    login: function() {
        this._show(new LoginView({session: this.session}), 'login');
    },
    _show: function(view, pageName) {
        this.mainView && this.mainView.remove();
        this.mainView = view;
        this.mainView.render().$el.appendTo($('body'));
    }
});

var AppView = Backbone.View.extend({
    navView: null,
    mainView: null,
    session: null,
    initialize: function(options) {
        this.session = options.session;
        this.navView = new NavView({appView: this});
    },
    render: function() {
        var template = _.template($('#app-template').text());
        this.$el.html(template());
        this.navView.render().$el.appendTo(this.$('#nav-container'));
        return this;
    },
    home: function() {
        this._show(new HomeView(), 'home');
    },
    stock: function(stockId) {
        var stock = new Stock({id: stockId});
        stock.fetch().fail(errorMessager('Could not load stock.'));
        this._show(new StockView({stock: stock}), 'stock');
    },
    _show: function(view, pageName) {
        this.mainView && this.mainView.remove();
        this.mainView = view;
        this.mainView.render().$el.appendTo(this.$('#main-view-container'));
        this.navView.setCurrent(pageName);
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
    initialize: function() {
        var watchlist = new Watchlist();
        watchlist.fetch().fail(errorMessager('Could not load watchist.'));
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
    appView: null,
    initialize: function(options) {
        this.appView = options.appView;
    },
    events: {
        'click .logout': '_onLogoutClick'
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
        this.appView.logout();
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
