var testAppControllers = angular.module('testAppControllers', []);

testAppControllers.controller('WatchlistCtrl', function($scope, $http) {
    $scope.orderBy = 'id';

    $http.get('/watchlist.json').success(function(data) {
        $scope.watchlist = data;
    }).catch(errorMessager('Could not fech watchlist'));
});

function errorMessager(msg) {
    return function() {
        alert(msg);
    };
}
