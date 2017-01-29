//Licence MIT
//Version 0.2
//loading librairie express et socket.io
var express = require('express'),

app = express(),
server = require('http').createServer(app),
io = require('socket.io').listen(server),

//app.use(express.static('')),
users = {};

//rename port in 3000
server.listen(3000);

// function of load chargement template index.html
app.get('/', function(req, res){
    res.sendfile(__dirname + '/index.html');
});

//Liste des emoticons
const SMILES_MAP = {
  '_emoti1': '<img src="https://www.smileysapp.com/emojis/bow-tie-smiley.png" width="50" />',
  '_emoti2': '<img src="https://www.smileysapp.com/emojis/selfie-emoji.png" width="50" />',
  '_emoti3': '<img src="https://www.smileysapp.com/emojis/middle-finger-smiley.png" width="50" />',
  '_emoti4': '<img src="https://www.smileysapp.com/emojis/angry-emoji.png" width="50" />',
  '_emoti5': '<img src="https://www.smileysapp.com/emojis/cute-wink-smiley.png" width="50" />',
  '_emoti6': '<img src="https://www.smileysapp.com/emojis/blowing-a-kiss.png" width="50" />',
  '_emoti7': '<img src="https://www.smileysapp.com/emojis/angry-smiley.png" width="50" />',
  '_emoti8': '<img src="https://www.smileysapp.com/emojis/teary-eyes-emoji.png" width="50" />',
  '_emoti9': '<img src="https://www.smileysapp.com/emojis/smiley-on-laptop.png" width="50" />',
  '_emoti12': '<img src="https://www.smileysapp.com/emojis/sleeping-smiley.png" width="50" />',
  '_emoti11': '<img src="https://www.smileysapp.com/emojis/stressed-smiley.png" width="50" />',

  'gif1': '<img src="http://www.gifbin.com/bin/022014/1394128421_rihanna_dancing.gif"  >',
  'gif2': '<img src="http://www.gifbin.com/bin/042011/putin-and-a-cute-puppy.gif" >',
  'gif3': '<img src="http://www.gifbin.com/bin/112014/1416241579_girl_drinking_champagne_fail.gif">',
  'gif4': '<img src="http://www.gifbin.com/bin/092015/roger-rabbit-gets-hit-with-frying-pan-from-behind-the-screen.gif">',
  'gif5': '<img src="http://www.gifbin.com/bin/082011/1313398002_baby_falls_asleep.gif">',
  'gif6': '<img src="http://www.gifbin.com/bin/012017/tape-measure-trick.gif">',
  'gif7': '<img src="http://www.gifbin.com/bin/012015/1420739933_morpheus_parkour_fail.gif">',
  'gif8': '<img src="http://i.giphy.com/3o7TKr0LU13xOFgl4A.gif">'
};

io.sockets.on('connection', function(socket){

    //initialisation des objets et data
    socket.on('new user', function(data, callback){
        if(data in users)
            callback(false);
        else {
            var userNew = data.trim();
            if (userNew.substr(0,6) === "/nick "){
                callback(true);
                userNew = userNew.substr(6);

                socket.nickname = userNew;
                users[socket.nickname] = socket;
                updateNicknames();
           }
        }
    });

    //function why update users online
    function updateNicknames(){
        io.sockets.emit('usernames', Object.keys(users));
    }

    //Function for emoticon
    function buildMessage(message) {
      var smiles = Object.keys(SMILES_MAP);
      smiles.forEach(smile => message = message.replace(smile, SMILES_MAP[smile]));
      return message;
    }

    //send de message
    socket.on('send message', function(data, callback){
        var msg = data.trim();
        msg = buildMessage(msg);

        if (msg.substr(0,5) === "/msg ") {
            msg = msg.substr(5);

            var ind = msg.indexOf(' ');

            if (ind !== -1) {
                var name = msg.substring(0, ind);
                var msg = msg.substring(ind + 1);

                if(name in users)
                    users[name].emit('user', {msg: msg, nick: socket.nickname});
                else
                    callback('Error please enter a user valide');
            } else
                callback('Error please enter a message valide');
        } else
            io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
        //socket.broadcast.emit('new message', data);
    });

    // subscribe at chat room
    socket.on('subscribe', function(room) {
        console.log('joining room', room);
        socket.join(room);
    })

    // unsubscribe at chat room
    socket.on('unsubscribe', function(room) {
        console.log('leaving room', room);
        socket.leave(room);
    })

    socket.on('sendroom', function(data) {
        console.log('sending message'+ data);
        io.sockets.in(data.room).emit('message', data);
    });

    //function de deconnexion
    socket.on('disconnect', function(data){
        if(!socket.nickname) return;
        delete users[socket.nickname];
        updateNicknames();
    });
});
