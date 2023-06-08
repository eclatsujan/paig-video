import { Socket,Server } from "socket.io";
import {User} from './socketData';
export class SocketHandler{
    private activeSockets: string[] = [];
    private userInformation: User[]=[];
    private socket:Socket;
    private io:Server;
    
    public constructor(sock:Socket,io:Server){
        this.socket=sock;
        this.io=io;
    }
    
    public setSocket(sock:Socket){
        this.socket=sock;
    }
    
    public handleEvents(){
        const existingSocket = this.activeSockets.find(
            existingSocket => existingSocket === this.socket.id
        );
        if (!existingSocket) {
            this.activeSockets.push(this.socket.id);
            this.sendUserInformation();
        }
        this.socket.on("user",(name:string)=>{
            const existingSocket = this.userInformation.find(
                existingSocket => existingSocket.id === this.socket.id
            );
            if(!existingSocket){
                this.userInformation.push({
                    id:this.socket.id,
                    name
                });
            } 
            this.sendUserInformation();  
        });
        
        this.socket.on("getUser",()=>{
            this.sendUserInformation();  
        });
        
        this.socket.on("callUser", data => {
            this.socket.to(data.to).emit("callMade", {
                offer: data.offer,
                to: this.socket.id
            });
        });

        this.socket.on("makeAnswer", data => {
            this.socket.to(data.to).emit("answerMade", {
                to: this.socket.id,
                answer: data.answer
            });
        });
        
        this.socket.on('getRooms',()=> {
            console.log("looged");
           this.sendRooms();
        });
        
        this.socket.on("createRoom",(name)=>{
            this.socket.join(name);
            console.log("ok");
            this.sendRooms();
        });
        
        this.socket.on("joinRoom",data=>{
           this.socket.join(data.room); 
        });
        
        this.socket.on('disconnect', ()=> {
            this.removeUser(this.socket.id);
            this.sendUserInformation();
        });
    }
    
    public removeUser(socketId:string){
        this.userInformation=this.userInformation.filter(user=>{
            return user.id!==socketId;
        });
    }
    
    public sendUserInformation(){
        this.socket.broadcast.emit("updateUserList", this.userInformation);
    }
    
    public sendRooms(){
        let rooms=[...Array.from(this.io.of("/").adapter.rooms.keys())];
        rooms=rooms.filter((r:string)=>{
            return !this.activeSockets.includes(r);
        });
        this.socket.emit('rooms',rooms);
    }
}