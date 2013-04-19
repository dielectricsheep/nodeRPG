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