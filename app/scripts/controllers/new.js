'use strict';

angular.module('tictactoeApp')
  .controller('NewCtrl', ['$scope', 'localStorageService', '$http', 'socket', '$modal', 'user', 'game', '$location', function ($scope, localStorageService, $http, socket, $modal, user, game, $location) {

    $scope.opponent = {};
    $scope.startErrors = null;
		$scope.gameKey = null;
    $scope.inviteStatus = null;

		var uid = localStorageService.get('uid');

    $scope.init = function() {
      // Retrieve any existing pending games. Future feature!
    };

    $scope.createGame = function(form) {
      $scope.startErrors = null;
      $scope.inviteStatus = null;
      if(form.$valid) {
        game.create({
          opponent: $scope.opponent.username,
          initiated: uid
        }, function(response) {
					// console.log('game.create callback: ' + JSON.stringify(response));
					if (response && response.status === 'Ok') {
            $scope.inviteStatus = true;
						$scope.gameKey = response.gameKey;

            //store the latest key so it can be accessed on the main/Play page to retrieve the game
            localStorageService.set('newkey', $scope.gameKey);

            //this delegates to the Socket.IO client API emit method and sends the post
            //see server.js for the listener          
            socket.emit('invite',{initiated: uid, opponent: $scope.opponent.username, gameKey: response.gameKey});

            //switch to main/home tab
            $location.path('/home');
					} else {
	          $scope.startErrors = response.message;
					}
        });
      }
    };

  }]);
