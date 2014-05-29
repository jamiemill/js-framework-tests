$(document).ready(function() {
    var appRouter = new AppRouter();
    Backbone.history.start({pushState: false});
});


var AppRouter = Backbone.Router.extend({
    mainView: null,
    routes: {
        '': 'home',
        'stock': 'stock'
    },
    home: function() {
        this.mainView && this.mainView.remove();
        this.mainView = new HomeView();
        this.mainView.render().appendTo($('#main-view-container'));
    },
    stock: function() {
        this.mainView && this.mainView.remove();
        this.mainView = new StockView();
        this.mainView.render().appendTo($('#main-view-container'));
    }
});


var HomeView = Backbone.View.extend({
    render: function() {
        var template = _.template($('#home-template').text());
        this.$el.html(template());
        return this.$el;
    }
});


var StockView = Backbone.View.extend({
    render: function() {
        var template = _.template($('#stock-template').text());
        this.$el.html(template());
        return this.$el;
    }
});
