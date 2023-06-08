import express, {Application} from "express";
import socketIO, {Server as SocketIOServer, Socket} from "socket.io";
import {createServer, Server as HTTPServer} from "http";
import path from 'path';
import cors from 'cors';
import User from "./User";
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "./socket/socketData";
import { SocketHandler } from "./socket/socketHandler";
export class Server {
    private httpServer: HTTPServer;
    private app: Application;
    private io: SocketIOServer;
    private DEFAULT_PORT = parseInt(process.env.PORT||'5000');
    private activeSockets: string[] = [];
    private userInformation: User[]=[];
    private socket:Socket|null=null;

    constructor() {
        this.app = express();
        this.app.use(cors());
        this.httpServer = createServer({},this.app);
        this.io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(this.httpServer,{
            // allowEIO3: true,
            cors:{
                origin:"http://localhost:3000",
                methods:["*"]
            }
        });
        // this.io.attachApp(this.app);
        this.initialize();
        this.handleRoutes();
    }

    private initialize(): void {
        this.configureApp();
        this.handleSocketConnection();
    }

    private handleRoutes(): void {
        this.app.get("/", (req, res) => {
            res.send(`<h1>Hello World</h1>`);
        });
    }

    private handleSocketConnection(): void {
        let sockethandler:SocketHandler|null=null;
        this.io.on("connection", socket => {
            this.socket=socket;
            const existingSocket = this.activeSockets.find(
                existingSocket => existingSocket === socket.id
            );
            if (!existingSocket) {
                this.activeSockets.push(socket.id);
                this.sendUserInformation();
            }
            socket.on("user",(name:string)=>{
                const existingSocket = this.userInformation.find(
                    existingSocket => existingSocket.id === socket.id
                );
                if(!existingSocket){
                    this.userInformation.push({
                        id:socket.id,
                        name
                    });
                } 
                this.sendUserInformation();  
            });
            
            socket.on("getUser",()=>{
                this.sendUserInformation();  
            });
            
            socket.on("callUser", data => {
                socket.to(data.to).emit("callMade", {
                    offer: data.offer,
                    to: socket.id
                });
            });
    
            socket.on("makeAnswer", data => {
                socket.to(data.to).emit("answerMade", {
                    to: socket.id,
                    answer: data.answer
                });
            });
            
            socket.on('getRooms',()=> {
                this.sendRooms();
            });
            
            socket.on("createRoom",(name)=>{
                socket.join(name);
                this.sendRooms();
            });
            
            socket.on("joinRoom",data=>{
               socket.join(data.room); 
            });
            
            socket.on('disconnect', ()=> {
                this.removeUser(socket.id);
                this.sendUserInformation();
            });
        });
    }
    
    private removeUser(socketId:string){
        this.userInformation=this.userInformation.filter(user=>{
            return user.id!==socketId;
        });
    }
    
    private sendUserInformation(){
        if(this.socket==null){
            return;
        }
        this.socket.broadcast.emit("updateUserList", this.userInformation);
    }
    
    private sendRooms(){
        if(this.socket==null){
            return;
        }
        let rooms=[...Array.from(this.io.of("/").adapter.rooms.keys())];
        rooms=rooms.filter((r:string)=>{
            return !this.activeSockets.includes(r);
        });
        console.log(rooms);
        this.socket.broadcast.emit('rooms',rooms);
    }

    public listen(callback: (port: number) => void): void {
        this.httpServer.listen(this.DEFAULT_PORT,() =>
            callback(this.DEFAULT_PORT)
        );
    }

    private configureApp(): void {
        this.app.use(express.static(path.join(__dirname, "../public")));
    }
}