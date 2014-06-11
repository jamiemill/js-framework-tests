var testAppControllers = angular.module('testAppControllers', []);

testAppControllers.controller('WatchlistCtrl', function($scope, $http) {
    $scope.orderBy = 'id';

    $http.get('/watchlist.json').success(function(data) {
        $scope.watchlist = data;
    }).catch(errorMessager('Could not fetch watchlist.'));
});

testAppControllers.controller('StockCtrl', function($scope, $http, $routeParams) {
    var stockId = $routeParams.stockId;
    $http.get('/stocks/' + stockId + '.json').success(function(data) {
        $scope.stock = data;
    }).catch(errorMessager('Could not fetch stock.'));
});

function errorMessager(msg) {
    return function() {
        alert(msg);
    };
}
