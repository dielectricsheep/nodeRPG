if(process.env.NODERPG){
  var env = JSON.parse(process.env.NODERPG);
} else 
{
  var env = {};
};

exports.getProgramSettings = function () {
  var envProgram = {};
  if(env['noderpg']){
    envProgram = env['noderpg'];
  };
  envProgram.envMode = (envProgram.envMode || 'production');
  return envProgram;
};

exports.getHTTPSettings = function () {
  var envHttp = {};
  if(env['http']){
    envHttp = env['http'];
  };
  envHttp.port = (envHttp.port || 80);
  return envHttp;
};

exports.getMongoSettings = function () {
  if(env['mongodb']){
    var envMongo = env['mongodb'].credentials;
  }
  else{
    var envMongo = {
      "hostname":"localhost",
      "port":27017,
      "username":"",
      "password":"",
      "name":"",
      "db":"db"
    }
  }

  envMongo.hostname = (envMongo.hostname || 'localhost');
  envMongo.port = (envMongo.port || 27017);
  envMongo.db = (envMongo.db || 'test');
  var mongoUrl;
  if(envMongo.username && envMongo.password){
    mongoUrl = "mongodb://" + envMongo.username + ":" + envMongo.password + "@" + envMongo.hostname + ":" + envMongo.port + "/" + envMongo.db;
  }
  else{
    mongoUrl = "mongodb://" + envMongo.hostname + ":" + envMongo.port + "/" + envMongo.db;
  }
  return { 'mongoUrl' : mongoUrl };
}; 