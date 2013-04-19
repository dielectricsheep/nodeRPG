/**
 * Module dependencies.
 */
var util = require('util');

// Get General Options
programSettings = require('./lib/server_settings.js').getProgramSettings();

// Configure Winston Logger
// Logging levels: error(9), debug(8), warn(7), data(5), info(4)
// Logging transports:  console, mongodb, SMS(eventually)
var logger = require('winston');
// Add Winston Console Logger
logger.remove(logger.transports.Console);
switch(programSettings.envMode){
  case 'development':
    logger.add(logger.transports.Console, {'timestamp' : true, 'colorize' : true, 'level' : 'info'});
  break;
  case 'production':
    logger.add(logger.transports.Console, {'timestamp' : true, 'colorize' : true, 'level' : 'info'});
  break
};

//Setup Web Server
//Get port number
var port = require('./lib/server_settings.js').getHTTPSettings().port;
var express = require('express');
var app = express();  
var http = require('http').createServer(app).listen(port);
logger.info('Web server listening on port ' + port + '.');
var engines = require('consolidate');

//Setup Engine
app.engine('html', engines.mustache);
app.set('view engine', 'html');

//Define Express Middleware
app.use(express.bodyParser());
app.use(app.router);

//Serve Static Files
app.use('/images', express.static(__dirname + '/static/images'));
app.use('/styles', express.static(__dirname + '/static/styles'));
app.use('/lib', express.static(__dirname + '/static/lib'));
app.use('/fonts', express.static(__dirname + '/static/fonts'));

//Serve Root
app.get('/', function(req, res) {
  var resData = {'hostUrl' : req.headers.host};
  res.render('index', resData);
});

// Start web socket server, and start listening for client connections
var socketServer = require('socket.io').listen(http);
switch(programSettings.envMode){
  case 'development':
    socketServer.set('log level', 3);
  break;
  case 'production':
    socketServer.set('log level', 1);
  break
};


logger.info('Socket server listening on port ' + port + '.');

socketServer.on('connection', function (socket) {
  var loggedIn = false;
  //Log Connection 
  if(programSettings.envMode == 'development'){
    var address = socket.handshake.address; 
    logger.debug('New socket connection from ' + address.address + ':' + address.port + '.');
  };

  //On close unregister user with socket
  socket.on('disconnect', function(){
    //
  });

 //**** temp list of logged on users ****
  socket.on('handshake', function (inData){
    //Debug message
    if(programSettings.envMode == 'development'){
      var address = socket.handshake.address; 
      logger.debug('Handshake message received from ' + address.address + ':' + address.port + ': ' + JSON.stringify(inData));
    }

    if(!loggedIn){
      playerData['login'] = login;
      socket.emit('handshake', playerData);
    }


  });

  //Listen for messages
  socket.on('login', function (inData){
    //Debug message
    if(programSettings.envMode == 'development'){
      var address = socket.handshake.address; 
      logger.debug('Login message received from ' + address.address + ':' + address.port + ': ' + JSON.stringify(inData));
    };

    if(!loggedIn){
      loggedIn = true;
      var rpgData = {};

      playerData.location = {};
      //Set location where player appears
      if(canaan.spawnPoints['default']){
        playerData.location = canaan.spawnPoints['default'];
      } else {
        playerData.location.x = 0;
        playerData.location.y = 0;
      };

      delete playerData.login;
      //portion of map viewable on player's canvas
      playerData.canvasSelect = {};
      playerData.canvasSelect.width = playerData.view.width;
      playerData.canvasSelect.height = playerData.view.height; 
      playerData.canvasSelect.orig = {};
      playerData.canvasSelect.orig.x = playerData.location.x - parseInt(playerData.canvasSelect.width / 2);
      playerData.canvasSelect.orig.y = playerData.location.y - parseInt(playerData.canvasSelect.height / 2);
      playerData.canvasSelect.bound = {};
      playerData.canvasSelect.bound.x = playerData.canvasSelect.orig.x + playerData.canvasSelect.width;
      playerData.canvasSelect.bound.y = playerData.canvasSelect.orig.y + playerData.canvasSelect.height;   
      //total amount of data sent to player including buffer
      playerData.mapSelect = {};
      playerData.mapSelect.width = playerData.canvasSelect.width + playerData.view.tileBuffer * 2;
      playerData.mapSelect.height = playerData.canvasSelect.height + playerData.view.tileBuffer * 2; 
      playerData.mapSelect.orig = {};
      playerData.mapSelect.orig.x = playerData.canvasSelect.orig.x - playerData.view.tileBuffer;
      playerData.mapSelect.orig.y = playerData.canvasSelect.orig.y - playerData.view.tileBuffer;
      playerData.mapSelect.bound = {};
      playerData.mapSelect.bound.x = playerData.canvasSelect.bound.x + playerData.view.tileBuffer;
      playerData.mapSelect.bound.y = playerData.canvasSelect.bound.y + playerData.view.tileBuffer;  

      playerData.view.id = canaan.id;

      //Build and send initial payload
      rpgData.states = {};
      for(var key in canaan){
        if(key != 'states'){
          rpgData[key] = canaan[key];
        } else {
          for(stateKey in canaan.states){
            var selectY;
            var selectX;
            var selectXSave;
            var boundY;
            var boundX;
            rpgData[key][stateKey] = {};
            rpgData[key][stateKey].tileMap = [];

            selectY = playerData.mapSelect.orig.y;
            boundY = playerData.mapSelect.bound.y;
            boundX = playerData.mapSelect.bound.x;

            var y = 0;
            for(; selectY < boundY; selectY++){
              rpgData[key][stateKey].tileMap[y] = [];
              var x = 0;
              selectX = playerData.mapSelect.orig.x;
              for(; selectX < boundX; selectX++){
                if(canaan[key][stateKey].tileMap[selectY] && canaan[key][stateKey].tileMap[selectY][selectX]){
                  rpgData[key][stateKey].tileMap[y][x] = canaan[key][stateKey].tileMap[selectY][selectX];
                } else {
                  rpgData[key][stateKey].tileMap[y][x] = 0;
                }
                x++;
              }
              y++;
            }
          }
        }
      }

      var playerDataOut = (JSON.parse(JSON.stringify(playerData)));
      playerDataOut.location.x = parseInt(playerData.mapSelect.width / 2);
      playerDataOut.location.y = parseInt(playerData.mapSelect.height / 2);
      playerDataOut.canvasSelect.orig.x = playerData.canvasSelect.orig.x - playerData.mapSelect.orig.x;
      playerDataOut.canvasSelect.orig.y = playerData.canvasSelect.orig.y - playerData.mapSelect.orig.y;
      playerDataOut.canvasSelect.bound.x = playerData.canvasSelect.orig.x + playerData.view.width;
      playerDataOut.canvasSelect.bound.y = playerData.canvasSelect.orig.y + playerData.view.height; 
      playerDataOut.mapSelect.orig.x = 0;
      playerDataOut.mapSelect.orig.y = 0;
      playerDataOut.mapSelect.bound.x = playerData.mapSelect.width;
      playerDataOut.mapSelect.bound.y = playerData.mapSelect.height;   

      rpgData.rpgChildNodes[player.name] = player;

      var payload = {};
      payload.playerData = playerDataOut;
      payload.rpgData = rpgData;

      socket.emit('login', payload);

      //{'direction' : '[up,right,down,left]'}
      socket.on('move', function (inData){
        var tileArray = [];

        //TODO: Check collisions on server side.

        //Send data to scroll onto client map
        switch(inData.direction){
          case 'up':
            playerData.mapSelect.orig.y--;
            playerData.mapSelect.bound.y--;
            playerData.canvasSelect.orig.y--;
            playerData.canvasSelect.orig.y--;
            for(var x = playerData.mapSelect.orig.x; x < playerData.mapSelect.bound.x; x++){
              if(canaan.states[canaan.state].tileMap[playerData.mapSelect.orig.y] && canaan.states[canaan.state].tileMap[playerData.mapSelect.orig.y][x]){
                tileArray.push(canaan.states[canaan.state].tileMap[playerData.mapSelect.orig.y][x]);
              } else {
                tileArray.push(0);
              }
            }
          break;
          case 'right':
            playerData.mapSelect.orig.x++;
            playerData.mapSelect.bound.x++;
            playerData.canvasSelect.orig.x++;
            playerData.canvasSelect.orig.x++;
            for(var y = playerData.mapSelect.orig.y; y < playerData.mapSelect.bound.y; y++){
              if(canaan.states[canaan.state].tileMap[y] && canaan.states[canaan.state].tileMap[y][playerData.mapSelect.bound.x - 1]){
                tileArray.push(canaan.states[canaan.state].tileMap[y][playerData.mapSelect.bound.x - 1]);
              } else {
                tileArray.push(0);
              }
            }       
          break;
          case 'down':
            playerData.mapSelect.orig.y++;
            playerData.mapSelect.bound.y++;
            playerData.canvasSelect.orig.y++;
            playerData.canvasSelect.orig.y++;
            for(var x = playerData.mapSelect.orig.x; x < playerData.mapSelect.bound.x; x++){
              if(canaan.states[canaan.state].tileMap[playerData.mapSelect.bound.y - 1] && canaan.states[canaan.state].tileMap[playerData.mapSelect.bound.y - 1][x]){
                tileArray.push(canaan.states[canaan.state].tileMap[playerData.mapSelect.bound.y - 1][x]);
              } else {
                tileArray.push(0);
              }
            }           
          break;
          case 'left':
            playerData.mapSelect.orig.x--;
            playerData.mapSelect.bound.x--;
            playerData.canvasSelect.orig.x--;
            playerData.canvasSelect.orig.x--;   
            for(var y = playerData.mapSelect.orig.y; y < playerData.mapSelect.bound.y; y++){
              if(canaan.states[canaan.state].tileMap[y] && canaan.states[canaan.state].tileMap[y][playerData.mapSelect.orig.x]){
                tileArray.push(canaan.states[canaan.state].tileMap[y][playerData.mapSelect.orig.x]);
              } else {
                tileArray.push(0);
              }
            }          
          break;
        }
        socket.emit('move', {'direction' : inData.direction, 'tileArray' : tileArray})
      });
    }
  });
});

//Player data
var playerData =
{
  'id' : 'player',
  'walkSpeed' : 2,
  'location' : {
    'x' : 0,
    'y' : 0
  },
  'view' : {
    'height' : 13,
    'width' : 17,
    'posLeft' : 0,
    'posTop' : 0,
    'scale' : 3,
    'tileWidth' : 16,
    'tileHeight' : 16,
    'overlayTileColor' : '#434687',
    'defaultTileColor' : '#000000',
    'tileBuffer' : 5
  },
}

var login = 
{
  'inputBackgroundColor' : '#FFFFFF',
  'inputColor' : '#FFFFFF',
  'textColor' : '#FFFFFF',
  'rpgObject' : {
    'state' : 'default',
    'side' : 'inside',
    'name' : 'login',
    'id' : 'login',
    'tileWidth' : 16,
    'tileHeight' : 16,
    'tileMapWidth' : 16,
    'tileMapHeight' : 20,
    'states' : {
      'default' : {
        'tileMap' : [
        ]
      }
    },
    'tileDictionary' : {
    },
    'spawnPoints' : {
      'default' : {
        'x' : 8,
        'y' : 20
      }
    },
    'rpgChildNodes' : {
    }
  }
}

var canaan = 
{
  'state' : 'default',
  'side' : 'inside',
  'name' : 'Canaan',
  'id' : 'Canaan',
  'tileWidth' : 16,
  'tileHeight' : 16,
  'tileMapWidth' : 29,
  'tileMapHeight' : 31,
  'states' : {
    'default' : {
      'tileMap' : [
            ,[8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,36,36,36,36,36,36,36,36,36,36,36,36,36,36,8,8]
            ,[8,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,32,32,32,32,8,8,8,8,8,8,8,8,36,10,8]
            ,[8,36,35,35,35,35,35,35,35,35,35,35,35,35,35,14,8,31,33,31,31,12,12,30,12,12,8,8,8,36,10,8]
            ,[8,36,10,8,8,23,23,23,8,23,23,23,8,8,8,14,8,8,31,12,12,38,37,37,37,37,32,8,8,36,10,8]
            ,[8,36,10,22,22,22,22,22,8,8,32,8,8,8,13,8,12,12,12,38,37,37,37,37,37,32,31,8,8,36,10,8]
            ,[8,36,10,20,20,20,20,20,10,32,31,8,32,8,14,32,39,37,37,37,32,32,37,37,37,33,8,8,8,36,10,8]
            ,[8,36,10,11,41,41,6,34,9,31,8,8,31,8,14,33,39,32,32,32,33,33,39,37,37,33,8,8,8,36,10,8]
            ,[8,36,10,23,7,7,23,7,23,8,8,8,8,8,14,33,39,33,31,31,33,33,32,32,32,33,8,8,8,36,10,8]
            ,[8,36,10,23,23,23,23,32,23,23,8,23,8,8,14,31,39,31,8,8,31,31,31,31,31,31,8,8,8,36,10,8]
            ,[8,36,10,23,23,23,23,31,23,23,23,23,8,8,12,12,42,12,12,8,8,8,8,8,8,8,8,12,12,36,10,8]
            ,[8,36,10,8,8,23,23,23,23,23,23,23,23,8,8,8,42,8,8,12,12,12,12,12,30,12,12,9,8,36,10,8]
            ,[8,36,10,8,8,22,19,22,23,29,29,29,29,29,8,8,39,8,8,8,8,8,8,8,8,8,8,8,32,36,10,8]
            ,[8,36,10,8,8,16,25,18,10,28,28,28,28,28,10,8,39,8,8,8,8,8,8,8,8,8,32,32,33,36,10,8]
            ,[8,36,10,8,8,34,11,34,10,41,6,41,41,34,9,8,39,8,8,8,8,22,19,22,8,32,33,33,33,36,10,8]
            ,[8,36,10,32,8,34,6,34,9,8,3,7,7,7,3,3,1,3,3,8,8,16,26,18,10,33,33,33,33,36,10,8]
            ,[8,36,10,31,8,8,3,7,7,8,3,7,7,3,3,12,38,3,3,3,3,34,6,34,9,31,31,33,33,36,10,8]
            ,[8,36,10,8,32,3,3,3,3,3,3,3,3,3,3,39,37,3,3,3,3,3,3,3,8,8,8,31,33,36,10,8]
            ,[8,36,10,8,31,3,40,3,3,3,3,3,3,3,3,39,3,3,3,3,3,3,3,22,19,22,8,8,31,36,10,8]
            ,[8,36,10,8,8,3,3,3,3,22,21,19,22,3,12,38,12,3,3,3,3,3,3,16,27,18,8,8,8,36,10,8]
            ,[8,36,10,8,22,22,22,22,22,20,16,17,18,3,39,37,37,12,2,12,12,8,32,34,34,34,10,8,8,36,10,8]
            ,[8,36,10,8,20,24,20,20,20,34,34,34,34,5,39,37,37,37,2,39,37,8,31,34,11,34,10,32,8,36,10,8]
            ,[8,36,10,7,11,34,11,34,11,34,11,34,11,5,39,37,37,3,3,8,37,8,8,34,6,34,9,31,8,36,10,8]
            ,[8,36,10,7,11,6,11,34,11,34,11,6,11,4,3,3,3,3,3,8,39,8,8,8,3,8,12,12,12,36,10,8]
            ,[8,36,10,7,7,3,3,3,3,3,3,3,3,3,3,40,3,3,3,3,1,3,3,3,3,8,39,37,37,36,10,8]
            ,[8,36,10,7,7,7,7,7,7,8,8,8,8,3,3,3,3,3,8,8,39,12,12,12,12,12,38,23,23,36,10,8]
            ,[8,36,10,8,7,7,7,7,8,8,8,8,8,8,3,3,3,8,8,8,39,37,37,37,37,37,37,30,12,36,10,8]
            ,[8,36,10,8,8,8,8,8,8,8,8,8,8,8,8,3,8,8,8,8,8,8,8,37,37,37,37,37,37,36,10,8]
            ,[8,36,36,36,36,36,36,36,36,36,36,36,36,36,36,8,36,36,36,36,36,36,36,36,36,36,36,36,36,36,10,8]
            ,[8,35,35,35,35,35,35,35,35,35,35,35,35,35,35,9,35,35,35,35,35,35,35,35,35,35,35,35,35,35,9,8]
            ,[8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8]
      ]
    }  
  },
  'tileDictionary' : {
    '1' : {
      'walkable' : true,
      'image' : {
        'url' : 'images/bridge.png'
      }
    },
    '2' : {
      'walkable' : true,
      'image' : {
        'url' : 'images/bridge_vert.png'
      }
    },
    '3' : {
      'walkable' : true,
      'image' : {
        'url' : 'images/cobblestone.png'
      }
    },
    '4' : {
      'walkable' : true,
      'image' : {
        'url' : 'images/cobblestone_corner.png'
      }
    },
    '5' : {
      'walkable' : true,
      'image' : {
        'url' : 'images/cobblestone_shadow.png'
      }
    },
    '6' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/door.png'
      }
    },
    '7' : {
      'walkable' : true,
      'image' : {
        'url' : 'images/flowers.png'
      }
    },
    '8' : {
      'walkable' : true,
      'image' : {
        'url' : 'images/grass.png'
      }
    },
    '9' : {
      'walkable' : true,
      'image' : {
        'url' : 'images/grass_corner.png'
      }
    },
    '10' : {
      'walkable' : true,
      'image' : {
        'url' : 'images/grass_shadow.png'
      }
    },
    '11' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/house_wall.png'
      }
    },
    '12' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/outcropping.png'
      }
    },
    '13' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/out_corner.png'
      }
    },
    '14' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/out_left.png'
      }
    },
    '15' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/out_top.png'
      }
    },
    '16' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/peak_left.png'
      }
    },
    '17' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/peak_mid.png'
      }
    },
    '18' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/peak_right.png'
      }
    },
    '19' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/peak_top.png'
      }
    },
    '20' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/roof.png'
      }
    },
    '21' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/roof_chimney.png'
      }
    },
    '22' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/roof_top.png'
      }
    },
    '23' : {
      'walkable' : true,
      'image' : {
        'url' : 'images/rough.png'
      }
    },
    '24' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/sign_inn.png'
      }
    },
    '25' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/sign_shield.png'
      }
    },
    '26' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/sign_star.png'
      }
    },
    '27' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/sign_sword.png'
      }
    },
    '28' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/slate.png'
      }
    },
    '29' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/slate_top.png'
      }
    },
    '30' : {
      'walkable' : true,
      'image' : {
        'url' : 'images/stairs.png'
      }
    },
    '31' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/tree_bottom.png'
      }
    },
    '32' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/tree_top.png'
      }
    },
    '33' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/trees.png'
      }
    },
    '34' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/two_windows.png'
      }
    },
    '35' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/wall_bottom.png'
      }
    },
    '36' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/wall_top.png'
      }
    },
    '37' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/water.png'
      }
    },
    '38' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/water_corner.png'
      }
    },
    '39' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/water_shadow.png'
      }
    },
    '40' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/well.png'
      }
    },
    '41' : {
      'walkable' : false,
      'image' : {
        'url' : 'images/window.png'
      }
    },
    '42' : {
      'walkable' : false,
      'animation' : {
        'continuous' : true,
        'active' : true,
        'interval' : 4,
        'length' : 8,
        'position' : 0,
        'frames' : [
          {
            'url' : 'images/waterfall_1.png'
          },
          {
            'url' : 'images/waterfall_2.png'
          },
          {
            'url' : 'images/waterfall_3.png'
          },
          {
            'url' : 'images/waterfall_4.png'
          },
          {
            'url' : 'images/waterfall_5.png'
          },
          {
            'url' : 'images/waterfall_6.png'
          },
          {
            'url' : 'images/waterfall_7.png'
          },
          {
            'url' : 'images/waterfall_8.png'
          },
          {
            'url' : 'images/waterfall_9.png'
          }
        ]
      }
    }
  },
  'spawnPoints' : {
    'default' : {
      'x' : 15,
      'y' : 30
    }
  },
  'location' : {
    'id' : 'nowhere',
    'side' : 'inside',
    'x' : 1,
    'y' : 1
  },
  'rpgChildNodes' : {
  }
};

var player = {
  'state' : 'default',
  'name' : 'player',
  'id' : 'player',
  'tileWidth' : 16,
  'tileHeight' : 18,
  'tileMapWidth' : 1,
  'tileMapHeight' : 1,
  'contents' : {
    'objects' : {}
  },
  'states' : {
    'left' : {
      'tileMap' : [
        [4]
      ]
    },
    'down' : {
      'tileMap' : [
        [3]
      ]
    },
    'right' : {
      'tileMap' : [
        [2]
      ]
    },
    'up' : {
      'tileMap' : [
        [1]
      ]
    },
    'default' : {
      'tileMap' : [
        [3]
      ]
    }
  },
  'tileDictionary' : {
    '0' : {
      'walkable' : 'false',
      'animation' : {
        'continuous' : false,
        'active' : false,
        'interval' : 2,
        'length' : 1,
        'position' : 0,
        'frames' : [
          {
            'url' : 'images/wiz_3.png'
          },
          {
            'url' : 'images/wiz_4.png'
          }
        ]
      }
    },
    '1' : {
      'walkable' : 'false',
      'animation' : {
        'continuous' : false,
        'active' : false,
        'interval' : 2,
        'length' : 1,
        'position' : 0,
        'frames' : [
          {
            'url' : 'images/wiz_3.png'
          },
          {
            'url' : 'images/wiz_4.png'
          }
        ]
      }
    },
    '2' : {
      'walkable' : 'false',
      'animation' : {
        'continuous' : false,
        'active' : false,
        'interval' : 2,
        'length' : 1,
        'position' : 0,
        'frames' : [
          {
            'url' : 'images/wiz_7.png'
          },
          {
            'url' : 'images/wiz_8.png'
          }
        ]
      }
    },
    '3' : {
      'walkable' : 'false',
      'animation' : {
        'continuous' : false,
        'active' : false,
        'interval' : 2,
        'length' : 1,
        'position' : 0,
        'frames' : [
          {
            'url' : 'images/wiz_1.png'
          },
          {
            'url' : 'images/wiz_2.png'
          }
        ]
      }
    },
    '4' : {
      'walkable' : 'false',
      'animation' : {
        'continuous' : false,
        'active' : false,
        'interval' : 2,
        'length' : 1,
        'position' : 0,
        'frames' : [
          {
            'url' : 'images/wiz_5.png'
          },
          {
            'url' : 'images/wiz_6.png'
          }
        ]
      }
    }
  },
  'location' : {
    'id' : 'Canaan',
    'side' : 'inside',
    'x' : 15,
    'y' : 30
  },
}
var someDude = {
  'state' : 'default',
  'name' : 'someDude',
  'id' : 'someDude',
  'tileWidth' : 16,
  'tileHeight' : 18,
  'tileMapWidth' : 1,
  'tileMapHeight' : 1,
  'contents' : {
    'objects' : {}
  },
  'states' : {
    'default' : {
      'tileMap' : [
        [
          {
            'tile' : 'default'
          }
        ]
      ]
    }
  },
  'tileDictionary' : {
    'default' : {
      'walkable' : 'false',
      'animation' : {
        'continuous' : false,
        'active' : false,
        'interval' : 2,
        'length' : 1,
        'position' : 0,
        'frames' : [
          {
            'url' : 'images/wiz_3.png'
          },
          {
            'url' : 'images/wiz_4.png'
          }
        ]
      }
    },
  },
  'location' : {
    'id' : 'Canaan',
    'side' : 'inside',
    'x' : 14,
    'y' : 15
  }
}

/*API - message type
{'newPlayerData', 'params' : [], 'id' :}
{'' : 'updatePlayerData', 'params' : [], 'id' :}

API - Recieve
{ 'login'}
*/
