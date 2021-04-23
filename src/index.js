const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const  { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectory = path.join(__dirname, '../public')

app.use(express.static(publicDirectory))

io.on('connection', (socket) =>{
    console.log('New websocket connection')

    socket.on('join', ({username, room}, callback) => {

        const {error, user} = addUser({id: socket.id, username, room})

        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        //io.to.emit In a room
        //socket.broadcast.to.emit limiting it to a specific chat room
        socket.emit('newUser', generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('newUser', generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)


        io.to(user.room).emit('newUser', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (coords, callback) =>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude}, ${coords.longitude}`))
        callback()
    })

    socket.on('disconnect',() => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('newUser',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () =>{
    console.log(`Server is up on port ${port}!`)
})



    // socket.emit('countUpdated', count)

    // socket.on('increment', () => {
    //     count++
    //     // socket.emit('countUpdated', count)
    //     io.emit('countUpdated', count)
    // })

    //We'll be emitting objects instead of direct strings
    // socket.emit('newUser', 'Welcome!')