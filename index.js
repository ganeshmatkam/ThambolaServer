let app = require('express')();
let server = require('http').createServer(app);
let io = require('socket.io')(server);
let fs = require('fs');
let tambola = require('tambola');


var usrWriteStream = fs.createWriteStream("./database/users.txt", {flags:'a'});
var usrReadStream = fs.createReadStream("./database/users.txt");
var msgWriteStream = fs.createWriteStream("./database/messages.txt", {flags:'a'});
var msgReadStream = fs.createReadStream("./database/messages.txt");

io.on('connection', (socket) => {
    socket.on('disconnect', function () {
        io.emit('users-changed', {
            user: socket.username,
            event: 'left'
        });
    });

    socket.on('set-name', (name) => {
        socket.username = name;
        const newUserData = `${(new Date()).getTime()}\t${name}\n`;
        usrWriteStream.write(newUserData, (err) => {
            if(err) {
                console.error('Error saving user', err);
            }
            console.log("Added user: ", newUserData);
        });
        console.log('Sending new ticket to '+socket.username)
        socket.emit('new-thambola-ticket', {
            user: name, 
            event: 'new-thambola-ticket', 
            ticket: tambola.generateTicket()
        });
        io.emit('users-changed', {
            user: name,
            event: 'joined'
        });
    });

    socket.on('send-message', (message) => {
        const currentTime = new Date();
        const newMsg = {
            msg: message.text,
            user: socket.username,
            createdAt: currentTime
        }
        const newMsgStr = `${newMsg.user}\t${newMsg.msg}\t${newMsg.createdAt.getTime()}\n`;
        msgWriteStream.write(newMsgStr);
        io.emit('message', newMsg);
    });
});

var port = process.env.PORT || 3001;

server.listen(port, function () {
    console.log('listening in http://localhost:' + port);
});

server.on("close", (data)=> {
    console.log("Server closed", data);
    usrWriteStream.end();
    msgWriteStream.end();
})
