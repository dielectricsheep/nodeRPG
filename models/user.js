var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var schemaOptions = { safe: true, strict: true };

// -------- Schemas ----------
var userSchema = new Schema({
  'name' : String,
  'rpgObjectId' : Schema.Types.ObjectId,
  'walkSpeed' : Number,
  'view' : {
    'height' : Number,
    'width' : Number,
    'posLeft' : Number,
    'posTop' : Number,
    'scale' : Number,
    'tileWidth' : Number,
    'tileHeight' : Number,
    'overlayTileColor' : String,
    'defaultTileColor' : String,
    'tileBuffer' : Number
  }
}, schemaOptions);


//TODO: Real user auth
userSchema.statics.validateUser = function(username, password, callback){
  this.model('User').findOne()
    .where('name').equals(username)
    .exec(function(err, user){
      callback(err, user);
    });
};

//create and set user viewable selection coordinates
userSchema.methods.mapSelect = function(location){
  this._doc.canvasSelect = {};
  this._doc.canvasSelect.width = this._doc.view.width;
  this._doc.canvasSelect.height = this._doc.view.height; 
  this._doc.canvasSelect.orig = {};
  this._doc.canvasSelect.orig.x = location.x - parseInt(this._doc.canvasSelect.width / 2);
  this._doc.canvasSelect.orig.y = location.y - parseInt(this._doc.canvasSelect.height / 2);
  this._doc.canvasSelect.bound = {};
  this._doc.canvasSelect.bound.x = location.x + parseInt(this._doc.canvasSelect.width / 2) + (this._doc.canvasSelect.width % 2);
  this._doc.canvasSelect.bound.y = location.y + parseInt(this._doc.canvasSelect.height / 2) + (this._doc.canvasSelect.height % 2); 

  //total amount of data sent to player including buffer
  this._doc.mapSelect = {};
  this._doc.mapSelect.width = this._doc.canvasSelect.width + this._doc.view.tileBuffer * 2;
  this._doc.mapSelect.height = this._doc.canvasSelect.height + this._doc.view.tileBuffer * 2; 
  this._doc.mapSelect.orig = {};
  this._doc.mapSelect.orig.x = this._doc.canvasSelect.orig.x - this._doc.view.tileBuffer;
  this._doc.mapSelect.orig.y = this._doc.canvasSelect.orig.y - this._doc.view.tileBuffer;
  this._doc.mapSelect.bound = {};
  this._doc.mapSelect.bound.x = this._doc.canvasSelect.bound.x + this._doc.view.tileBuffer;
  this._doc.mapSelect.bound.y = this._doc.canvasSelect.bound.y + this._doc.view.tileBuffer;
};

//set coordinates of map portion to 0,0, center user on it
userSchema.methods.normalizeLocation = function(location){
  var userOut = (JSON.parse(JSON.stringify(this._doc)));
  userOut.location = {};
  userOut.location.x = parseInt(this._doc.mapSelect.width / 2);
  userOut.location.y = parseInt(this._doc.mapSelect.height / 2);
  userOut.canvasSelect.orig.x = this._doc.view.tileBuffer;
  userOut.canvasSelect.orig.y = this._doc.view.tileBuffer;
  userOut.canvasSelect.bound.x = userOut.canvasSelect.orig.x + this._doc.view.width;
  userOut.canvasSelect.bound.y = userOut.canvasSelect.orig.y + this._doc.view.height; 

  userOut.mapSelect.orig.x = 0;
  userOut.mapSelect.orig.y = 0;
  userOut.mapSelect.bound.x = this._doc.mapSelect.width;
  userOut.mapSelect.bound.y = this._doc.mapSelect.height;


  userOut.location = {};
  userOut.location.x = location.x - this._doc.mapSelect.orig.x;
  userOut.location.y = location.y - this._doc.mapSelect.orig.y;
  userOut.canvasSelect.orig.x = this._doc.view.tileBuffer;
  userOut.canvasSelect.orig.y = this._doc.view.tileBuffer;
  userOut.canvasSelect.bound.x = userOut.canvasSelect.orig.x + this._doc.view.width;
  userOut.canvasSelect.bound.y = userOut.canvasSelect.orig.y + this._doc.view.height; 

  userOut.mapSelect.orig.x = 0;
  userOut.mapSelect.orig.y = 0;
  userOut.mapSelect.bound.x = this._doc.mapSelect.width;
  userOut.mapSelect.bound.y = this._doc.mapSelect.height;

  return userOut;  
};

module.exports = mongoose.model('User', userSchema, 'users');
