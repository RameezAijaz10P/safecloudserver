var express = require('express');
var app = express();
var node_dropbox = require('node-dropbox');
var db = require('diskdb'),
db = db.connect('collections', ['dropbox']);

var app_key='ps438wprmnwof57';
var app_secret='wjgf8kparw9pgsx';
var redirect_url='http://localhost:5000/dropboxredirecturl';
var user={id:'',access_token:''};
app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    response.render('pages/index');
});

app.get('/authenticate/dropbox', function(request, response) {
    user.id=request.query.user_id||null;
    if(!user.id)
    {
        response.send('user id not found');
    }
    node_dropbox.Authenticate(app_key, app_secret, redirect_url, function(err, url){
        if(err)
            response.send(err);
        response.redirect(url);

        // redirect user to the url.
        // looks like this: "https://www.dropbox.com/1/oauth2/authorize?client_id=<key_here>&response_type=code&redirect_uri=<redirect_url_here>"
    });
});
app.get('/dropboxredirecturl', function(request, response) {
    var auth_code=request.query.code;
    if(!auth_code)
    {
        response.send('no authentication code')
    }
    node_dropbox.AccessToken(app_key, app_secret, auth_code, redirect_url, function(err, body) {
        if(err){
            response.send(err);
        }
        if(body.access_token)
        {
            db.dropbox.save({
                user_id: user.id,
                access_token: body.access_token
            });

            response.send('authenticated');
        }
        else{
            response.send(body);
        }


    });
});
app.get('/accesstoken', function(request, response) {
    var cloud_name=request.query.cloud_name;
    var user_id=request.query.user_id;
    !db[cloud_name] && response.json({err:'Invaid Cloud Name'});
    var user = db[cloud_name].findOne({
        user_id: user_id
    });
    !user && response.json({err:'Invaid User Id'});
    !user.access_token && response.json({err:'Access Token not found'});
    response.json(user);

});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});


