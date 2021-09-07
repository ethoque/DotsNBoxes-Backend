const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const app = express()
const PORT = process.env.PORT || 3000;


const server = http.createServer(app)
const io = socketio(server)
const list = []
var moves = []


io.on('connection', (socket) => {
    list.push(socket.id)
    console.log(socket.id + " has joined")
    console.log(list.length + " total clients")

    if(list.length == 2 ){
        io.emit("restart")
        io.to(list[0]).emit("playerOne")
        socket.emit("changePlayer")
    }
    if(list.length > 2){
        socket.emit("disable")
        for(let i = 0; i<moves.length; i++){
            socket.emit("moveEvent",moves[i])
        }
    }
    socket.on("moveEvent" , (data) => {
        moves.push(data)
        socket.broadcast.emit("moveEvent",data);
    })

    socket.on("disconnect", () => {
        for(let i = 0; i<list.length; i++){
            if(socket.id === list[i]){
                list.splice(i,1);
                if(i<2){
                    io.emit("restart")
                    moves = []
                    if(list.length>1){
                        io.to(list[0]).emit("enable")
                        io.to(list[0]).emit("playerOne")
                        io.to(list[1]).emit("enable")
                        io.to(list[1]).emit("changePlayer")
                    }
                    else if(list.length==1){
                        io.to(list[0]).emit("enable")
                    }
                }      
                break;
            }
        }
        console.log(socket.id + " has left")
        console.log(list.length + " total clients")
    });
})

// usually this is where we try to connect to our DB.
server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})