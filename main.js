$(document).ready(function() {
    var appRouter = new AppRouter();
    Backbone.history.start({pushState: true});
});

// In this version:
// - html5 pushstate is used
// - navigation clicks are intercepted
// - they are translated to calls to router.navigate with {trigger:true}

var AppRouter = Backbone.Router.extend({
    mainView: null,
    routes: {
        '': 'home',
        'stock': 'stock'
    },
    initialize: function() {
        new NavView({router: this}).render().$el.appendTo('#nav-container');
    },
    home: function() {
        this.mainView && this.mainView.remove();
        this.mainView = new HomeView();
        this.mainView.render().$el.appendTo($('#main-view-container'));
    },
    stock: function() {
        this.mainView && this.mainView.remove();
        this.mainView = new StockView();
        this.mainView.render().$el.appendTo($('#main-view-container'));
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
    router: null,
    events: {
        'click a': '_navClicked'
    },
    initialize: function(options) {
        this.router = options.router;
    },
    _navClicked: function(e) {
        e.preventDefault();
        this.router.navigate(e.target.hash.substr(1), {trigger: true});
    },
    render: function() {
        var template = _.template($('#nav-template').text());
        this.$el.html(template());
        return this;
    }
});
