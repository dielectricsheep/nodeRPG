var mongoose = require('mongoose');
var mongoUrl = require('../config.js').getMongoSettings();
mongoose.connect(mongoUrl.mongoUrl); 

var RpgObject = require('../models/rpgObject.js');
var player = new RpgObject;
var map = new RpgObject;

var User = require('../models/user.js');
var user = new User;

map.state = 0;
map.name = 'Canaan';
map.tileWidth = 16;
map.tileHeight = 16;
map.statelist = ['default'];
map.tileMap = [
	[
		 [8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8]
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
];
map.tileDictionary = [
	{},
	{
	  'walkable' : true,
	  'image' : {
	    'url' : 'images/bridge.png'
	  }
	},
	{
	  'walkable' : true,
	  'image' : {
	    'url' : 'images/bridge_vert.png'
	  }
	},
	{
	  'walkable' : true,
	  'image' : {
	    'url' : 'images/cobblestone.png'
	  }
	},
	{
	  'walkable' : true,
	  'image' : {
	    'url' : 'images/cobblestone_corner.png'
	  }
	},
	{
	  'walkable' : true,
	  'image' : {
	    'url' : 'images/cobblestone_shadow.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/door.png'
	  }
	},
	{
	  'walkable' : true,
	  'image' : {
	    'url' : 'images/flowers.png'
	  }
	},
	{
	  'walkable' : true,
	  'image' : {
	    'url' : 'images/grass.png'
	  }
	},
	{
	  'walkable' : true,
	  'image' : {
	    'url' : 'images/grass_corner.png'
	  }
	},
	{
	  'walkable' : true,
	  'image' : {
	    'url' : 'images/grass_shadow.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/house_wall.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/outcropping.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/out_corner.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/out_left.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/out_top.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/peak_left.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/peak_mid.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/peak_right.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/peak_top.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/roof.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/roof_chimney.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/roof_top.png'
	  }
	},
	{
	  'walkable' : true,
	  'image' : {
	    'url' : 'images/rough.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/sign_inn.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/sign_shield.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/sign_star.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/sign_sword.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/slate.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/slate_top.png'
	  }
	},
	{
	  'walkable' : true,
	  'image' : {
	    'url' : 'images/stairs.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/tree_bottom.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/tree_top.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/trees.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/two_windows.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/wall_bottom.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/wall_top.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/water.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/water_corner.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/water_shadow.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/well.png'
	  }
	},
	{
	  'walkable' : false,
	  'image' : {
	    'url' : 'images/window.png'
	  }
	},
	{
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
];

map.save(function(err,map){
	if(err){
		console.log(err);
		process.exit();
	}
});

player.state = 0;
player.name = 'player';
player.tileWidth = 16;
player.tileHeight = 16;
player.stateList = ['default','up','right','down','left'];
player.location = {
	containerId : map._id, 	
	side : 'inside',
	x : 15,
	y : 15
};

player.tileMap = [
[[0]],
[[1]],
[[2]],
[[3]],
[[4]]  
];

player.tileDictionary = [
	{
	  'walkable' : false,
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
	{

	  'walkable' : false,
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
	{
	  'walkable' : false,
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
	{
	  'walkable' : false,
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
	{
	  'walkable' : false,
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
];

player.save(function(err,player){
	if(err){
		console.log(err);
		process.exit();
	};
});



user.name = 'player';
user.rpgObjectId = player._id;
user.walkSpeed = 2;
user.view = {
	'height' : 13,
	'width' : 17,
	'posLeft' : 0,
	'posTop' : 0,
	'scale' : 3,
	'tileWidth' : 16,
	'tileHeight' : 16,
	'overlayTileColor' : '#434687',
	'defaultTileColor' : '#000000',
	'tileBuffer' : 1
};

user.save(function(err,user){
	if(err){
		console.log(err);
	}
	process.exit();
});



