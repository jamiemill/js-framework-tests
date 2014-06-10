var testApp = angular.module('testApp', []);

testApp.controller('WatchlistCtrl', function($scope) {
    $scope.watchlist = [
        {
            "id": 5,
            "symbol": "TWTR US",
            "name": "Twitter Inc"
        },
        {
            "id": 6,
            "symbol": "GOOG US",
            "name": "Google Inc"
        }
    ];
});
