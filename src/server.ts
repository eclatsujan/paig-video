import express, {Application} from "express";
import {Server as SocketIOServer} from "socket.io";
import {createServer, Server as HTTPServer} from "http";
import path from 'path';

export class Server {
    private httpServer: HTTPServer;
    private app: Application;
    private io: SocketIOServer;
    private activeSockets: string[] = [];

    private DEFAULT_PORT = parseInt(process.env.PORT||'9001');

    constructor() {
        this.app = express();
        this.httpServer = createServer({},this.app);
        this.io = new SocketIOServer(this.httpServer);
        this.initialize();
        this.handleRoutes();
        this.handleSocketConnection();
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
        this.io.on("connection", socket => {
            const existingSocket = this.activeSockets.find(
                existingSocket => existingSocket === socket.id
            );

            if (!existingSocket) {
                this.activeSockets.push(socket.id);

                console.log(this.activeSockets);
                socket.emit("update-user-list", {
                    users: this.activeSockets.filter(
                        existingSocket => existingSocket !== socket.id
                    )
                });

                socket.broadcast.emit("update-user-list", {
                    users: [socket.id]
                });
            }

            socket.on("call-user", data => {
                socket.to(data.to).emit("call-made", {
                    offer: data.offer,
                    socket: socket.id
                });
            });

            socket.on("make-answer", data => {
                socket.to(data.to).emit("answer-made", {
                    socket: socket.id,
                    answer: data.answer
                });
            });

        });
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