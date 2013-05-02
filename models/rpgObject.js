var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var schemaOptions = { safe: true, strict: true };

// -------- Schemas ----------
var rpgObjectSchema = new Schema({
  'state' : Number,
  'name' : String,
  'tileWidth' : Number,
  'tileHeight' : Number,
  'location' : {
    'containerId' : Schema.Types.ObjectId,
    'side' : String,
    'x' : Number,
    'y' : Number
  },
  'stateList' : [String],
  'tileMap' : Schema.Types.Mixed,
  'tileDictionary' : Schema.Types.Mixed
  /*
  'tileDictionary' : [{
    'walkable' : Boolean,
    'animation' : {
      'continuous' : Boolean,
      'active' : Boolean,
      'interval' : Number,
      'length' : Number,
      'position' : Number,
      'frames' : [{
        'url' : String}]
    },
    'image' : {
      'url' : String
    }  
  }]
  */
}, schemaOptions);

var loadMap = function(rpgObject, selectX, selectY, boundX, boundY){
  //Build tilemap
  var rpgMap = {};
  for(var key in rpgObject){
    if(key != 'tileMap'){
      rpgMap[key] = rpgObject[key];
    } else {
      var selectXSave;
      selectXSave = selectX;
      rpgMap[key] = [];
      for(var i = 0; i < rpgObject[key].length; i++){
        rpgMap[key][i] = [];
        var y = 0;
        for(; selectY < boundY; selectY++){
          rpgMap[key][i][y] = [];
          var x = 0;
          selectX = selectXSave;
          for(; selectX < boundX; selectX++){
            if(rpgObject[key][i][selectY] && rpgObject[key][i][selectY][selectX]){
              rpgMap[key][i][y][x] = rpgObject[key][i][selectY][selectX];
            } else {
              rpgMap[key][i][y][x] = 0;
            }
            x++;
          }
          y++;
        }
      }
    }
  }

  return rpgMap;
};

rpgObjectSchema.statics.getRpgObject = function(rpgObjectId, callback){
  this.model('RpgObject').findById(rpgObjectId, function(err, rpgObject){
    callback(err, rpgObject);
  });
};


rpgObjectSchema.methods.buildRpgMap = function(user, rpgMapObj, callback){
  var rpgMap = {};
  var self = this;

  var populateRpgObject = function(rpgObject, callback){
    var rpgChildNodes = {};
    var err = {};
    self.model('RpgObject').find({'location.containerId' : rpgObject._id, 'location.side' : 'outside'}, function(err, childRpgObjs){
      for(var i=0; i<childRpgObjs.length; i++){
        rpgChildNodes[childRpgObjs[i]._doc._id] = childRpgObjs[i]._doc;
        rpgChildNodes[childRpgObjs[i]._doc._id].side = 'outside';
        rpgChildNodes[childRpgObjs[i]._doc._id].rpgChildNodes = {};
        populateRpgObject(childRpgObjs[i]._doc, function(err, results){
          rpgChildNodes[childRpgObjs[i]._doc._id].rpgChildNodes = results;
          callback(err, rpgChildNodes);
        });
      }
    });
  };

  //find all objects contained on the inside of map
  this.model('RpgObject').find({'location.containerId' : rpgMapObj._doc._id, 'location.side' : 'inside'}, function(err, rpgObjs){
    if(rpgObjs){
      rpgMap = loadMap(rpgMapObj._doc, user._doc.mapSelect.orig.x, user._doc.mapSelect.orig.y, user._doc.mapSelect.bound.x, user._doc.mapSelect.bound.y);
      rpgMap.rpgChildNodes = {};
      rpgMap.side = 'inside'
      for(var i = 0; i < rpgObjs.length; i++){
        rpgMap.rpgChildNodes[rpgObjs[i]._doc._id] = rpgObjs[i]._doc;
        rpgMap.rpgChildNodes[rpgObjs[i]._doc._id].rpgChildNodes = {};
        populateRpgObject(rpgObjs[i]._doc, function(err, rpgChildNodes){
          rpgMap.rpgChildNodes[rpgObjs[i]._doc._id].side = 'outside';
          rpgMap.rpgChildNodes[rpgObjs[i]._doc._id].rpgChildNodes = rpgChildNodes;
        });
        //rpgMap.rpgChildNodes[rpgObjs[i]._doc._id] = populateRpgObject(rpgObjs[i]._doc);
        callback(err, rpgMap);
      }
    }
  });
};


module.exports = mongoose.model('RpgObject', rpgObjectSchema, 'rpgObjects');
