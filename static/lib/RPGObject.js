var RpgModule =  (function () {

  var rpgObject;
  var rpgKeyPress;
  var divWindow;
  var socket;

  //flat list of all objects
  var objects = {};

  var playerData = {};

  function createLoginForm(){
    var usernameLabel = createHTMLElement('label','username', {
      "backgroundColor" : 'rgba(0,0,0,0)',
      "color" : playerData.login.textColor,
    } , 'Username', 14, 1, 3, 5);
    var usernameInput = createHTMLElement('input', 'username',{
      "borderstyle" : "none",
      "backgroundColor" : playerData.login.inputBackgroundColor,
      "color" : playerData.login.inputColor
    } ,'', 14, 1, 3, 6);


    var passwordLabel = createHTMLElement('label','password', {
      "backgroundColor" : 'rgba(0,0,0,0)',
      "color" : playerData.login.textColor,
    } , 'Password', 14, 1, 3, 8);
    var passwordInput = createHTMLElement('input', 'password',{
      "borderstyle" : "none",
      "backgroundColor" : playerData.login.inputBackgroundColor,
      "color" : playerData.login.inputColor
    } ,'', 14, 1, 3, 9);
    passwordInput.type = 'password';

    var submitButton = createHTMLElement('button','login', {
      "border" : "none",
      "backgroundColor" : 'rgba(0,0,0,0)',
      "color" : 'grey'
    }, '>Click here to start<', 15, 1, 1, 6)
    submitButton.type = 'button';
    submitButton.disabled = 'disabled';

    var statusLabel = createHTMLElement('label','status', {
      "backgroundColor" : "rgba(0,0,0,0)",
      "color" : playerData.login.textColor,
      "textAlign" : "center"
    } , 'Connecting to server...', 14, 1, 3, 13);

    var loginForm = document.createElement('form');
    loginForm.name = 'login_form';
    /*
    loginForm.appendChild(usernameLabel);
    loginForm.appendChild(usernameInput);
    loginForm.appendChild(passwordLabel);
    loginForm.appendChild(passwordInput);
    */
    loginForm.appendChild(submitButton);
    loginForm.appendChild(statusLabel);

    divWindow.appendChild(loginForm);

    /*
    divWindow.onkeydown = function(event){
      if(event.keyCode == 13){
        var out = {"username" : usernameInput.value , "password" : passwordInput.value};
        socket.emit('login', out);
      }  
    }  
    */

    submitButton.onclick = function(){
        var out = {"username" : "player" , "password" : passwordInput.value};
        //var out = {"username" : usernameInput.value , "password" : passwordInput.value};
        socket.emit('login', out);      
    }
    submitButton.disabled = '';
    submitButton.style.color = playerData.login.inputColor;
    statusLabel.innerHTML = '';   
  }

  function clearDivWindow(){
    while (divWindow.hasChildNodes()) {
      divWindow.removeChild(divWindow.lastChild);
    }
  }

  function createHTMLElement(type, name, styleParams, value, boxWidth, boxHeight, boxX, boxY){
    var element = document.createElement(type);
    element.id = type + '_' + name;
    element.style.zIndex = 99;
    element.style.width = boxWidth * rpgObject.tileWidth * playerData.view.scale + 'px';
    element.style.height = boxHeight * rpgObject.tileHeight * playerData.view.scale + 'px';
    element.style.position = 'absolute';
    element.style.left = playerData.view.posLeft + boxX * rpgObject.tileWidth * playerData.view.scale + 'px';
    element.style.top = playerData.view.posLeft + boxY * rpgObject.tileHeight * playerData.view.scale + 'px';

    element.style.fontFamily = 'RpgFont';
    element.style.fontSize = rpgObject.tileHeight * playerData.view.scale + 'px';

    for(var key in styleParams){
      element.style[key] = styleParams[key];
    };

    if(element.value){ 
      element.value = value;  
    } else {
      element.innerHTML = value;
    };

    return element;
  };

  return {
    init : function(inDivWindow, io, socketUrl){
      var loginElements;
      divWindow = inDivWindow;   
      rpgObject = new RpgObject;

      socket = io.connect(socketUrl);

      socket.on('error', function(){
      });

      socket.on('connect', function (){ 
        socket.emit('handshake', '');
      });

      socket.on('handshake', function(inData){
        playerData = inData.playerData;
        rpgObject.init(inData.playerData, inData.rpgObject, divWindow, objects, function(){
          createLoginForm();  
        });
      });

      socket.on('login', function(inData){
        clearDivWindow();

        //Build object tree view
        rpgObject = new RpgObject;
        objects = {};
        playerData = inData.playerData;
        playerData.view.rpgObjectId = inData.rpgData._id;
        rpgObject.init(playerData, inData.rpgData, divWindow, objects, function(){
          var timer = 0;
          //RPG Clock, at approx 16 times a sec TODO: describe what this does  
          setInterval(function(){
            timer++;
            if(rpgKeyPress){
              if(objects[playerData.rpgObjectId].move({"direction":rpgKeyPress})){
                socket.emit("move", {"direction":rpgKeyPress});
              }
            };

            for(var key in objects){
              objects[key].progressAnimation(timer);
            };
          }, 62);             
        });
       
      });

      socket.on('move', function(inData){
        objects[playerData.view.rpgObjectId].updateEdgeBuffer(inData);
      });

    },
    setKeyPress : function(keyPress){
      rpgKeyPress = keyPress;
    }
  }; 

}());

//Universal RpgObject Class, used for any tilebased entity or map
var RpgObject = function(){

  //Select is the portion of the this.tileMap that displays on the screen
  //is a rectangle defined by orig and bound points.
  this.canvasSelect = {};
  this.canvasSelect.orig = {};
  this.canvasSelect.bound = {};
  this.rpgParentNode = {};

  this.animations = [];
};

RpgObject.prototype.playerData = {};

RpgObject.prototype.init = function(playerData, objData, divWindow, objects, callback){

  var self = this;
  this.divWindow = divWindow;
  this.playerData = playerData;

 //Copy all properties from objData to this
  for(var key in objData){
    this[key] = objData[key];
  };

  if(this._id == playerData.rpgObjectId){
   //Methods and properties for a non map-type object (currently only for player)
    if(playerData.walkSpeed >= 0 && playerData.walkSpeed <= playerData.view.tileWidth / 2){
      this.walkSpeed = playerData.walkSpeed * 2;
    } else {
      this.walkSpeed = 1;
    };

    //Setup player canvas that will overlay on the Map Canvas
    this.canvasSelect.orig.x = 0;
    this.canvasSelect.orig.y = 0;
    this.canvasSelect.bound.x = this.tileMap[this.state][0].length;
    this.canvasSelect.bound.y = this.tileMap[this.state].length;
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'view_' + objData.id;
    this.canvas.style.zIndex = 1;
    this.canvas.width = this.tileMap[this.state][0].length * this.tileWidth * playerData.view.scale;
    this.canvas.height = this.tileMap[this.state].length * this.tileHeight * playerData.view.scale;
    this.canvas.style.position = 'absolute';
    this.canvasPosition = {};
    this.canvasPosition.x = ((parseInt(playerData.view.width / 2) * playerData.view.tileWidth) + parseInt(self.tileWidth / 2)) * playerData.view.scale + playerData.view.posLeft;
    this.canvasPosition.y = ((parseInt(playerData.view.height / 2) * playerData.view.tileHeight) + parseInt(self.tileHeight / 4)) * playerData.view.scale + playerData.view.posTop;
    this.canvas.style.left = this.canvasPosition.x + 'px';
    this.canvas.style.top = this.canvasPosition.y + 'px';
    divWindow.appendChild(this.canvas);
    this.context = this.canvas.getContext('2d');
    this.context.scale(playerData.view.scale, playerData.view.scale); 

  } else if(this.side == 'inside') {
    //Methods and properties specific to the inside of an object
    this.inside = {};
    playerData.view.scale = playerData.view.scale;

    //Set sublocation, the pixel position within a tile location
    this.sublocation = {};
    this.sublocation.x = this.tileWidth / 2;
    this.sublocation.y = this.tileHeight / 2;
      
    //Center Selection on spawn point
    this.canvasSelect = playerData.canvasSelect;
    this.mapSelect = playerData.mapSelect;

    //Create Map Work Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'work_RpgWindow';
    this.canvas.width = this.canvasSelect.width * this.tileWidth;
    this.canvas.height = this.canvasSelect.height * this.tileHeight;
    this.context = this.canvas.getContext('2d');

    //Create Map Canvas, the work canvas will be flipped to this and graphics will be scaled up
    this.playerView = {};
    this.playerView.canvas = document.createElement('canvas');
    this.playerView.canvas.id = 'view_RpgWindow';
    this.playerView.canvas.style.zIndex = 0;
    this.playerView.canvas.width = this.canvasSelect.width * this.tileWidth * playerData.view.scale;
    this.playerView.canvas.height = this.canvasSelect.height * this.tileHeight * playerData.view.scale;
    this.playerView.canvas.style.position = 'absolute';
    this.playerView.canvas.style.left = playerData.view.posLeft + 'px';
    this.playerView.canvas.style.top = playerData.view.posTop + 'px';
    divWindow.appendChild(this.playerView.canvas);
    this.playerView.context = this.playerView.canvas.getContext('2d');
    this.playerView.context.scale(playerData.view.scale, playerData.view.scale);

    //Create overlay to border map and hide tile scroll updates
    this.overlay = {};
    this.overlay.canvas = document.createElement('canvas');
    this.overlay.canvas.id = 'view_RpgWindowOverlay';
    this.overlay.canvas.style.zIndex = 999;
    this.overlay.canvas.style.position = 'absolute';
    this.overlay.canvas.style.left = playerData.view.posLeft +'px';
    this.overlay.canvas.style.top = playerData.view.posTop +'px';
    this.overlay.canvas.style.zIndex = 1;
    this.overlay.canvas.width = this.playerView.canvas.width;
    this.overlay.canvas.height = this.playerView.canvas.height;
    divWindow.appendChild(this.overlay.canvas);
    this.overlay.context = this.overlay.canvas.getContext('2d');
    this.overlay.context.scale(playerData.view.scale, playerData.view.scale);   

  } else {

    //Setup player canvas that will overlay on the Map Canvas
    this.canvasSelect.orig.x = 0;
    this.canvasSelect.orig.y = 0;
    this.canvasSelect.bound.x = this.tileMap[this.state][0].length;
    this.canvasSelect.bound.y = this.tileMap[this.state].length;
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'view_' + objData.id;
    this.canvas.style.zIndex = 1;
    this.canvas.width = this.tileWidth * this.tileMap[this.state][0].length * playerData.view.scale;
    this.canvas.height = this.tileHeight * this.tileMap[this.state].length * playerData.view.scale;
    this.canvas.style.position = 'absolute';

    this.canvasPosition = {};
    this.canvasPosition.x = ((this.location.x - this.rpgParentNode.canvasSelect.orig.x) * this.rpgParentNode.tileWidth + this.rpgParentNode.sublocation.x) * playerData.view.scale;
    this.canvasPosition.y = ((this.location.y - this.rpgParentNode.canvasSelect.orig.y) * this.rpgParentNode.tileHeight + this.rpgParentNode.sublocation.y) * playerData.view.scale;
    this.canvas.style.left = this.canvasPosition.x + 'px';
    this.canvas.style.top = this.canvasPosition.y + 'px';

    divWindow.appendChild(this.canvas);
    this.context = this.canvas.getContext('2d');
    this.context.scale(playerData.view.scale, playerData.view.scale); 

  }

  this.loadTileDictionary(function(){

    // animations from this.tileMap
    for(var i = 0; i < self.tileMap.length; i++){
      self.animations[i] = [];
      for(var selectY = 0; selectY < self.tileMap[self.state].length; selectY++){
        for(var selectX = 0; selectX < self.tileMap[self.state][0].length; selectX++){
          if(self.tileMap[i][selectY] && self.tileMap[i][selectY][selectX]){
            var tile = self.tileDictionary[self.tileMap[i][selectY][selectX]];
            if(tile.animation){
              self.animations[i].push({'x' : selectX, 'y' : selectY});
            }        
          }
        }
      }
    }

    //Recursively iterates through an object/container tree and creates rpgObjects from objectData
    objects[self._id] = self;
    for(var key in self.rpgChildNodes){
      var childObj = new RpgObject;
      childObj.init(playerData, self.rpgChildNodes[key], divWindow, objects);
      childObj.rpgParentNode = self;
      self.objectPush({"rpgObject" : childObj});
    };

    self.display(self.state);

    if(callback){
      callback();
    }

  })

};

/*

Push parameters:
Insert one RPG object into another
params : {
  rpgObject : {...}
}
*/
RpgObject.prototype.objectPush = function(params){
  if(params.rpgObject.location.containerId === this._id  && params.rpgObject.location.side === this.side){
      //TODO  Check if object exists, check for changes from prior object 
      this.rpgChildNodes[params.rpgObject._id] = params.rpgObject;
  }
};

//Move RPG object
//TODO: Add logic to move objects other than player
RpgObject.prototype.move = function(params){
  if(this.playerData.rpgObjectId === this._id){
    this.changeState(params.direction);
    var result = this.rpgParentNode.viewScroll({
      "direction" : params.direction,
      "scrollPx" : this.playerData.walkSpeed,
      "location" : this.playerData.location,
      "sublocation" : this.rpgParentNode.sublocation
    });

    this.playerData.location = result.location;
    this.rpgParentNode.sublocation = result.sublocation;  
    if(result.movedTile){
      return true;
    }  
  }
  return false;
}

//Method to check if a point or rectangle is within bounds of an object
RpgObject.prototype.checkInBounds = function(x, y, xBound, yBound){
  var result = true;
  if(!(this.tileMap[this.state][this.canvasSelect.orig.y] && this.tileMap[this.state][this.canvasSelect.orig.y][this.canvasSelect.orig.x + x])){
    return false;
  }
  return true;
};

//Prototype Properties for all RpgObjects
//Display a tile on the canvas
RpgObject.prototype.displayTile = function(tile, x, y, subX, subY){
  var self = this;
  pixelX = x * this.tileWidth;
  pixelY = y * this.tileHeight;
  this.context.clearRect(pixelX + subX, pixelY + subY, this.tileWidth, this.tileHeight);
  this.context.drawImage(tile.img, pixelX + subX, pixelY + subY); 
};

//Look up tile by label from tileDictionary and display on the canvas
RpgObject.prototype.displayDicEntry = function(entry, x, y, subX, subY){
  var tile = this.tileDictionary[entry];
  if(tile.animation){
    this.displayTile(tile.animation.frames[tile.animation.position], x, y, subX, subY);
  } else {
    this.displayTile(tile, x, y, subX, subY);
  };
};

//Display method, this displays an entire object for whatever 'state' is specified
RpgObject.prototype.display = function(state){
  var displayState = this.tileMap[state];

  //draw overlay for mainview
  if(this.overlay){
    this.viewDrawOverlayWindow();
  }

  //iterate through and draw tiles from tile map
  var y = 0;
  for(var selectY = this.canvasSelect.orig.y; selectY < this.canvasSelect.bound.y; selectY++){
    var x = 0;
    for(var selectX = this.canvasSelect.orig.x; selectX < this.canvasSelect.bound.x; selectX++){
      if(this.inside){
        this.displayDicEntry(displayState[selectY][selectX], x, y, this.sublocation.x, this.sublocation.y);
      } else {
        this.displayDicEntry(displayState[selectY][selectX], x, y, 0, 0);
      }
      x++;  
    }
    y++;
  }

  //Flip updated image to map
  if(this.inside){
    this.playerView.context.drawImage(this.canvas,0,0);
  }

}

RpgObject.prototype.changeState = function(state){
  this.state = state;
  for(var i = 0; i < this.animations[this.state].length; i++){
    var x = this.animations[this.state][i].x;
    var y = this.animations[this.state][i].y;
    var tile = this.tileDictionary[this.tileMap[this.state][y][x]];
    tile.animation.active = true;
  }
};

//load images in tileDictionary to used by Object into memory
RpgObject.prototype.loadTileDictionary = function(callback){
  //Load images, read ahead to process callback on last entry
  var prevEntry;
  var lastImg;

  var tileCanvas;
  var tileContext;
  var parentObj;

  //create and load default(blank) and overlay(backgroundcolor) tiles
  if(this.inside){
    tileCanvas = document.createElement('canvas');
    tileCanvas.width = this.tileWidth;
    tileCanvas.height = this.tileHeight;
    tileContext = tileCanvas.getContext('2d');
    tileContext.fillStyle = this.playerData.view.overlayTileColor;
    tileContext.fillRect(0,0,tileCanvas.width,tileCanvas.height);
    this.overlay.tile = {};
    this.overlay.tile.image = {};
    this.overlay.tile.image.url = tileCanvas.toDataURL('image/png');
    this.overlay.tile.img = new Image;
    this.overlay.tile.img.src = this.overlay.tile.image.url;

    tileContext.fillStyle = this.playerData.view.defaultTileColor;
    tileContext.fillRect(0,0,tileCanvas.width,tileCanvas.height);
    if(!this.tileDictionary[0]){
      this.tileDictionary[0] = {};
      this.tileDictionary[0].image = {};
    }
    this.tileDictionary[0].image.url = tileCanvas.toDataURL('image/png');
  };

  for(var i = 0; i < this.tileDictionary.length; i++){
    if(prevEntry){
      if(prevEntry.animation){ 
        prevEntry.animation.frames.forEach(function(frame){
          frame.img = new Image;
          frame.img.src = frame.url;
        });
      } else {  
        prevEntry.img = new Image;
        prevEntry.img.src = prevEntry.image.url;
      };
    };
    prevEntry = this.tileDictionary[i];
  };

  //Set onload event to call callback on last image
  //to insure all images are loaded before canvas is drawn 
  if(prevEntry){
    var prevImage;
    if(prevEntry.animation){ 
      prevEntry.animation.frames.forEach(function(frame){
        if(prevImage){
          prevImage.img = new Image;
          prevImage.img.src = prevImage.url;
        };
        prevImage = frame;
      });
    } else {  
      prevEntry.img = new Image;
      prevImage = prevEntry;
    };
    if(prevImage){
      prevImage.img = new Image;
      prevImage.img.onload = function(){
        setTimeout(function(){
          callback();
        },250);
      };
      if(prevEntry.animation){
        prevImage.img.src = prevImage.url;
      } else {
        prevImage.img.src = prevImage.image.url;
      };
    };
  };
}; 

//progress frames on registered animations
RpgObject.prototype.progressAnimation = function(timer){
  var updated = false;
  for(var i = 0; i < this.animations[this.state].length; i++){
    var x = this.animations[this.state][i].x;
    var y = this.animations[this.state][i].y;
      var tile = this.tileDictionary[this.tileMap[this.state][y][x]];
      //need to verify animation, if screen update is executed as the map is scrolling
      if(tile.animation){
        if(tile.animation.active && !(timer % tile.animation.interval)){
          if(this.checkInBounds(x, y)){
            if(this.inside){
              this.displayTile(tile.animation.frames[tile.animation.position], x - this.canvasSelect.orig.x, y - this.canvasSelect.orig.y, this.tileWidth - this.sublocation.x, this.tileHeight - this.sublocation.y);
            } else {
              this.displayTile(tile.animation.frames[tile.animation.position], x - this.canvasSelect.orig.x, y - this.canvasSelect.orig.y, 0, 0);
            }
          } 
          tile.animation.position++;
          if(tile.animation.position > tile.animation.frames.length - 1){
            tile.animation.position = 0;
            if(!tile.animation.continuous){
              tile.animation.active = false;
            }
          }
          var updated = true;
        }        
      }
  }

  //Flip updated image to map
  if(this.inside && updated){
    this.playerView.context.drawImage(this.canvas,0,0);
  }
}

//Check if adjoining tile creates a collision event
RpgObject.prototype.checkCollision = function(x, y){
  if(!this.tileDictionary[this.tileMap[this.state][y][x]].walkable){
    return true;
  };
  return false;
};

//As main view scrolls, update scrolled edges with new tiles, register new animations
RpgObject.prototype.updateEdgeBuffer = function(params){
  switch(params.direction){
    case 1:   
      for(var x = 0; x < this.mapSelect.width; x++){
        this.tileMap[this.state][this.mapSelect.orig.y][x] = params.tileArray.shift();
        if(this.tileDictionary[this.tileMap[this.state][this.mapSelect.orig.y][x]].animation){
          this.animations[this.state].push({'x' : x, 'y' : this.mapSelect.orig.y});
        }
      }  
    break;
    case 2:  
      for(var y = 0; y < this.mapSelect.height; y++){
        this.tileMap[this.state][y][this.mapSelect.bound.x - 1] = params.tileArray.shift();
        if(this.tileDictionary[this.tileMap[this.state][y][this.mapSelect.bound.x - 1]].animation){
          this.animations[this.state].push({'x' : this.mapSelect.bound.x - 1, 'y' : y});
        }
      }       
    break;
    case 3:      
      for(var x = 0; x < this.mapSelect.width; x++){
        this.tileMap[this.state][this.mapSelect.bound.y - 1][x] = params.tileArray.shift();
        if(this.tileDictionary[this.tileMap[this.state][this.mapSelect.bound.y - 1][x]].animation){
          this.animations[this.state].push({'x' : x, 'y' : this.mapSelect.bound.y - 1});
        }
      }      
    break;
    case 4:  
      for(var y = 0; y < this.mapSelect.height; y++){
        this.tileMap[this.state][y][this.mapSelect.orig.x] = params.tileArray.shift();
        if(this.tileDictionary[this.tileMap[this.state][y][this.mapSelect.orig.x]].animation){
          this.animations[this.state].push({'x' : this.mapSelect.orig.x, 'y' : y});
        }
      }          
    break;
  }
};

//Scroll map, canvas is scrolled by playerData.walkSpeed and edges are inserted with blank tiles to be updated by server
//regisetered animation locations are updated, out of bounds ones are removed
RpgObject.prototype.viewFeedTop = function(){
  var newRow = [];
  for(var x = 0; x < this.mapSelect.width; x++){
    if(x >= this.canvasSelect.orig.x && x < this.canvasSelect.bound.x){
      this.displayDicEntry(this.tileMap[this.state][this.canvasSelect.orig.y - 1][x], x - this.canvasSelect.orig.x, 0, this.tileWidth - this.sublocation.x, 0);
    }
    newRow.push(0);
  }
  this.tileMap[this.state].unshift(newRow);
  this.tileMap[this.state].pop();
  for(var i = 0; i < this.animations[this.state].length; i++){
    this.animations[this.state][i].y++;
    if(this.animations[this.state][i].y === this.mapSelect.bound.y){
      this.animations[this.state].splice(i,1);
    }
  } 
};
RpgObject.prototype.viewFeedRight = function(){
  for(var y = 0; y < this.mapSelect.height; y++){
    if(y >= this.canvasSelect.orig.y && y < this.canvasSelect.bound.y){
      this.displayDicEntry(this.tileMap[this.state][y][this.canvasSelect.bound.x - 1], this.canvasSelect.width - 1, y - this.canvasSelect.orig.y, 0, this.tileHeight - this.sublocation.y);
    }
    this.tileMap[this.state][y].shift();
    this.tileMap[this.state][y].push(0);
  }
  for(var i = 0; i < this.animations[this.state].length; i++){
    this.animations[this.state][i].x--;
    if(this.animations[this.state][i].x < this.mapSelect.orig.x){
      this.animations[this.state].splice(i,1);
    }
  }
};
RpgObject.prototype.viewFeedBottom = function(){
  var newRow = [];
  for(var x = 0; x < this.mapSelect.width; x++){
    if(x >= this.canvasSelect.orig.x && x < this.canvasSelect.bound.x){
      this.displayDicEntry(this.tileMap[this.state][this.canvasSelect.bound.y - 1][x], x - this.canvasSelect.orig.x, this.canvasSelect.height - 1, this.tileWidth - this.sublocation.x, 0);   
    }
    newRow.push(0);
  }
  this.tileMap[this.state].shift();
  this.tileMap[this.state].push(newRow);
  for(var i = 0; i < this.animations[this.state].length; i++){
    this.animations[this.state][i].y--;
    if(this.animations[this.state][i].y < this.mapSelect.orig.y){
      this.animations[this.state].splice(i,1);
    }
  }  
};
RpgObject.prototype.viewFeedLeft = function(){
  for(var y = 0; y < this.mapSelect.height; y++){
    if(y >= this.canvasSelect.orig.y && y < this.canvasSelect.bound.y){
      this.displayDicEntry(this.tileMap[this.state][y][this.canvasSelect.orig.x - 1], 0, y - this.canvasSelect.orig.y, 0, this.tileWidth - this.sublocation.y);
    }
    this.tileMap[this.state][y].unshift(0);
    this.tileMap[this.state][y].pop();
  }
  for(var i = 0; i < this.animations[this.state].length; i++){
    this.animations[this.state][i].x++;
    if(this.animations[this.state][i].x === this.mapSelect.bound.x){
      this.animations[this.state].splice(i,1);
    }
  }
};

//draw border overlay on top of main window to hide scrolling tile updates
RpgObject.prototype.viewDrawOverlayWindow = function(){
  for(var x = 0; x < this.overlay.canvas.width; x += this.tileWidth){
    this.overlay.context.drawImage(this.overlay.tile.img, x, 0);
  }
  for(var y = 0; y < this.overlay.canvas.height; y+=this.tileHeight){
    this.overlay.context.drawImage(this.overlay.tile.img, (this.canvas.width - this.tileWidth), y);
  }
  for(var x = 0; x < this.overlay.canvas.width; x += this.tileWidth){
    this.overlay.context.drawImage(this.overlay.tile.img, x, (this.canvas.height - this.tileHeight));
  }
  for(var y = 0; y < this.overlay.canvas.height; y += this.tileHeight){
    this.overlay.context.drawImage(this.overlay.tile.img, 0, y);
  }
};

/*
params = {
  "direction" :
  "scrollPx" :
}
*/
RpgObject.prototype.objectScroll = function(params){
  switch(params.direction){
    case 1:
      this.canvasPosition.y += params.scrollPx * 2;
    break;
    case 2:
      this.canvasPosition.x -= params.scrollPx * 2;
    break;
    case 3:
      this.canvasPosition.y -= params.scrollPx * 2;
    break;
    case 4:
      this.canvasPosition.x += params.scrollPx * 2;
    break;
  };
  this.canvas.style.left = this.canvasPosition.x + 'px';
  this.canvas.style.top = this.canvasPosition.y + 'px';
};

/*
Scroll main view and all RPG objects with in main view
params = {
  "direction" :
  "scrollPx" :
  "location" :
  "sublocation" :
}
*/
RpgObject.prototype.viewScroll = function(params){

  var self = this;

  function scrollObjects(){
    for(var key in self.rpgChildNodes){
      if(self.playerData.rpgObjectId != self.rpgChildNodes[key]._id){
        self.rpgChildNodes[key].objectScroll({
          "direction" : params.direction,
          "scrollPx" : params.scrollPx
        });      
      };
    };    
  };

  switch(params.direction){
    case 1:
      if(params.sublocation.y - params.scrollPx < 0){
        if(!this.checkCollision(params.location.x, params.location.y - 1)){
          params.sublocation.y = this.tileHeight - params.scrollPx;
          this.viewFeedTop();
          this.context.drawImage(this.canvas, 0, params.scrollPx);
          scrollObjects();
          params.movedTile = true;
        };
      } else {
        params.sublocation.y -= params.scrollPx;
        this.context.drawImage(this.canvas, 0, params.scrollPx);
        scrollObjects();
      };
    break;
    case 2:
      if(params.sublocation.x + params.scrollPx > this.tileWidth - 1){
        if(!this.checkCollision(params.location.x + 1, params.location.y)){
          params.sublocation.x = 0;

          this.context.drawImage(this.canvas, -params.scrollPx, 0);
          this.viewFeedRight();
          scrollObjects();
          params.movedTile = true;
        };
      } else {
        params.sublocation.x += params.scrollPx;
        this.context.drawImage(this.canvas, -params.scrollPx, 0);
        scrollObjects();
      };
    break;
    case 3:
      if(params.sublocation.y + params.scrollPx > this.tileHeight - 1){
        if(!this.checkCollision(params.location.x, params.location.y + 1)){
          params.sublocation.y = 0;
          this.context.drawImage(this.canvas, 0, -params.scrollPx);
          this.viewFeedBottom();
          scrollObjects();
          params.movedTile = true;
        };
      } else {
        params.sublocation.y += params.scrollPx;
        this.context.drawImage(this.canvas, 0, -params.scrollPx);
        scrollObjects();
      };
    break;
    case 4:
      if(params.sublocation.x - params.scrollPx < 0){
        if(!this.checkCollision(params.location.x - 1, params.location.y)){
          params.sublocation.x = this.tileWidth - params.scrollPx;
          this.viewFeedLeft();
          this.context.drawImage(this.canvas, params.scrollPx, 0);
          scrollObjects();
          params.movedTile = true;
        };
      } else {
        params.sublocation.x -= params.scrollPx;
        this.context.drawImage(this.canvas, params.scrollPx, 0);
        scrollObjects();
      };
    break;
   }; 

    //Flip updated image to map
    this.playerView.context.drawImage(this.canvas,0,0);
    return params;
  } 
