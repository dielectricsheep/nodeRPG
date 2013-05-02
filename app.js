/**
 * Module dependencies.
 */
var util = require('util');

// Get General Options
programSettings = require('./config.js').getProgramSettings();

// Connect to MongoDB
var mongoUrl = require('./config.js').getMongoSettings();
var mongoose = require('mongoose');
mongoose.connect(mongoUrl.mongoUrl); 

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
var port = require('./config.js').getHTTPSettings().port;
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
    //Login screen data
    var userLogin =
    {
      'playerData' : {
        'rpgObjectId' : '',
        'name' : 'player',
        'walkSpeed' : 2,
        'location' : {
          'x' : 0,
          'y' : 0
        },
        'canvasSelect' : {
          'height' : 13,
          'width' : 17,
          'orig' : {
            'x' : 0,
            'y' : 0
          },
          'bound' : {
            'x' : 16,
            'y' : 12
          }
        },
        'login' : {
          'inputBackgroundColor' : '#FFFFFF',
          'inputColor' : '#FFFFFF',
          'textColor' : '#FFFFFF'
        },
        'view' : {
          'width' : 17,
          'height' : 13,
          'posLeft' : 0,
          'posTop' : 0,
          'scale' : 3,
          'tileWidth' : 16,
          'tileHeight' : 16,
          'overlayTileColor' : '#434687',
          'defaultTileColor' : '#000000',
          'tileBuffer' : 0
        }
      },
      'rpgObject' : {
        'state' : 0,
        'side' : 'inside',
        'name' : 'login',
        'id' : 'login',
        'tileWidth' : 16,
        'tileHeight' : 16,
        'tileMap' : [
          [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
          ]
        ],
        'tileDictionary' : [],
        'rpgChildNodes' : {
        }
      }
    };

    //Debug message
    if(programSettings.envMode == 'development'){
      var address = socket.handshake.address; 
      logger.debug('Handshake message received from ' + address.address + ':' + address.port + ': ' + JSON.stringify(inData));
    }

    if(!loggedIn){
      socket.emit('handshake', userLogin);
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

      var RpgObject = require('./models/rpgObject.js');
      var User = require('./models/user.js');

      User.validateUser(inData.username, inData.password, function(err, user){
        if(user){
          loggedIn = true;
          RpgObject.getRpgObject(user._doc.rpgObjectId, function(err, userRpgObj){
            if(userRpgObj){
              RpgObject.getRpgObject(userRpgObj._doc.location.containerId, function(err, rpgObjData){
                if(rpgObjData){
                  user.mapSelect(userRpgObj._doc.location);
                  rpgObjData.buildRpgMap(user, rpgObjData, function(err, rpgMap){
                    if(rpgMap){
                      //Build and send initial payload
                      var userOut = user.normalizeLocation(userRpgObj._doc.location);

                      var payload = {};
                      payload.playerData = userOut;
                      payload.rpgData = rpgMap;

                      socket.emit('login', payload);

                      //{'direction' : '[up,right,down,left]'}
                      socket.on('move', function (inData){
                        var tileArray = [];

                        //TODO: Check collisions on server side.

                        //Send data to scroll onto client map
                        switch(inData.direction){
                          case 1:
                            user._doc.mapSelect.orig.y--;
                            user._doc.mapSelect.bound.y--;
                            user._doc.canvasSelect.orig.y--;
                            user._doc.canvasSelect.orig.y--;
                            for(var x = user._doc.mapSelect.orig.x; x < user._doc.mapSelect.bound.x; x++){
                              if(rpgObjData.tileMap[rpgObjData.state][user._doc.mapSelect.orig.y] && rpgObjData.tileMap[rpgObjData.state][user._doc.mapSelect.orig.y][x]){
                                tileArray.push(rpgObjData.tileMap[rpgObjData.state][user._doc.mapSelect.orig.y][x]);
                              } else {
                                tileArray.push(0);
                              }
                            }
                          break;
                          case 2:
                            user._doc.mapSelect.orig.x++;
                            user._doc.mapSelect.bound.x++;
                            user._doc.canvasSelect.orig.x++;
                            user._doc.canvasSelect.orig.x++;
                            for(var y = user._doc.mapSelect.orig.y; y < user._doc.mapSelect.bound.y; y++){
                              if(rpgObjData.tileMap[rpgObjData.state][y] && rpgObjData.tileMap[rpgObjData.state][y][user._doc.mapSelect.bound.x - 1]){
                                tileArray.push(rpgObjData.tileMap[rpgObjData.state][y][user._doc.mapSelect.bound.x - 1]);
                              } else {
                                tileArray.push(0);
                              }
                            }       
                          break;
                          case 3:
                            user._doc.mapSelect.orig.y++;
                            user._doc.mapSelect.bound.y++;
                            user._doc.canvasSelect.orig.y++;
                            user._doc.canvasSelect.orig.y++;
                            for(var x = user._doc.mapSelect.orig.x; x < user._doc.mapSelect.bound.x; x++){
                              if(rpgObjData.tileMap[rpgObjData.state][user._doc.mapSelect.bound.y - 1] && rpgObjData.tileMap[rpgObjData.state][user._doc.mapSelect.bound.y - 1][x]){
                                tileArray.push(rpgObjData.tileMap[rpgObjData.state][user._doc.mapSelect.bound.y - 1][x]);
                              } else {
                                tileArray.push(0);
                              }
                            }           
                          break;
                          case 4:
                            user._doc.mapSelect.orig.x--;
                            user._doc.mapSelect.bound.x--;
                            user._doc.canvasSelect.orig.x--;
                            user._doc.canvasSelect.orig.x--;   
                            for(var y = user._doc.mapSelect.orig.y; y < user._doc.mapSelect.bound.y; y++){
                              if(rpgObjData.tileMap[rpgObjData.state][y] && rpgObjData.tileMap[rpgObjData.state][y][user._doc.mapSelect.orig.x]){
                                tileArray.push(rpgObjData.tileMap[rpgObjData.state][y][user._doc.mapSelect.orig.x]);
                              } else {
                                tileArray.push(0);
                              }
                            }          
                          break;
                        }
                        socket.emit('move', {'direction' : inData.direction, 'tileArray' : tileArray})
                      });

                    } else {
                      //TODO: send some ominous warning to client
                      logger.debug('MongoDB err: ' + err);
                      logger.warning('MongoDB err: ' + err);  
                    }
                  });
                } else {
                  if(err){
                    //TODO: send some ominous warning to client
                    logger.debug('MongoDB err: ' + err);
                    logger.warning('MongoDB err: ' + err);  
                  } 
                }
              });  
            } else {
              //TODO: send some ominous warning to client
              logger.debug('MongoDB err: ' + err);
              logger.warning('MongoDB err: ' + err);  
            }
          });
              
        } else {
          //Send some sort of invald login message to client
          if(err){
            logger.debug('MongoDB err: ' + err);
            logger.warning('MongoDB err: ' + err);  
          } 
        };

      });     
    }
  });
});


/*API - message type
{'newPlayerData', 'params' : [], 'id' :}
{'' : 'updatePlayerData', 'params' : [], 'id' :}

API - Receive
{ 'login'}
*/
