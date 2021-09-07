const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const app = express()
const PORT = process.env.PORT || 4000;


const server = http.createServer(app)
const io = socketio(server)
var list = []
var map = new Map();


io.on('connection', (socket) => {
    const { roomId } = socket.handshake.query;
    var room = map.get(roomId);
    
    if(room === undefined){
        map.set(roomId, [[],[]]); // 0th array moves, 1st total users
    }
    socket.join(roomId)
    map.get(roomId)[1].push(socket.id)
    console.log(socket.id + " has joined")
    console.log('room: '+ roomId +' has ' +map.get(roomId)[1].length + " total clients")

    if(map.get(roomId)[1].length == 2 ){
        io.to(roomId).emit("restart")
        io.to(map.get(roomId)[1][0]).emit("playerOne")
        io.to(map.get(roomId)[1][0]).emit("enable")
        io.to(map.get(roomId)[1][1]).emit("enable")
        socket.emit("changePlayer")
    }
    if(map.get(roomId)[1].length > 2){
        socket.emit("disable")
        for(let i = 0; i<map.get(roomId)[0].length; i++){
            socket.emit("moveEvent",map.get(roomId)[0][i])
        }
    }
    socket.on("moveEvent" , (data) => {
        map.get(roomId)[0].push(data)
        socket.to(roomId).emit("moveEvent",data);
    })

    socket.on("disconnect", () => {
        for(let i = 0; i<map.get(roomId)[1].length; i++){
            if(socket.id === map.get(roomId)[1][i]){
                map.get(roomId)[1].splice(i,1);
                socket.leave(roomId)
                if(i<2){
                    io.in(roomId).emit("restart")
                    map.get(roomId)[0] = []
                    if(map.get(roomId)[1].length>1){
                        io.to(map.get(roomId)[1][0]).emit("enable")
                        io.to(map.get(roomId)[1][0]).emit("playerOne")
                        io.to(map.get(roomId)[1][1]).emit("enable")
                        io.to(map.get(roomId)[1][1]).emit("changePlayer")
                    }
                    else if(list.length==1){
                        io.to(map.get(roomId)[1][0]).emit("enable")
                    }
                } 
                break;
            }
        }
        console.log(socket.id + " has left")
        console.log(map.get(roomId)[1].length + " total clients")
    });
})

// usually this is where we try to connect to our DB.
server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})