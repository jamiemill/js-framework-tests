var testApp = angular.module('testApp', [
    'ngRoute',
    'testAppControllers'
]);

testApp.config(function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'watchlist.html',
        controller: 'WatchlistCtrl'
    });
});
