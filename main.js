var testApp = angular.module('testApp', []);

function errorMessager(msg) {
    return function() {
        alert(msg);
    };
}

testApp.controller('WatchlistCtrl', function($scope, $http) {
    $scope.orderBy = 'id';

    $http.get('/watchlist.json').success(function(data) {
        $scope.watchlist = data;
    }).catch(errorMessager('Could not fech watchlist'));
});
