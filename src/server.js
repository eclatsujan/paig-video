"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
var express_1 = __importDefault(require("express"));
var socket_io_1 = __importDefault(require("socket.io"));
var http_1 = require("http");
var path_1 = __importDefault(require("path"));
var Server = (function () {
    function Server() {
        this.activeSockets = [];
        this.DEFAULT_PORT = 5000;
        this.app = express_1.default();
        this.httpServer = http_1.createServer({}, this.app);
        this.io = socket_io_1.default(this.httpServer);
        this.initialize();
        this.handleRoutes();
        this.handleSocketConnection();
    }
    Server.prototype.initialize = function () {
        this.configureApp();
        this.handleSocketConnection();
    };
    Server.prototype.handleRoutes = function () {
        this.app.get("/", function (req, res) {
            res.send("<h1>Hello World</h1>");
        });
    };
    Server.prototype.handleSocketConnection = function () {
        var _this = this;
        this.io.on("connection", function (socket) {
            var existingSocket = _this.activeSockets.find(function (existingSocket) { return existingSocket === socket.id; });
            if (!existingSocket) {
                _this.activeSockets.push(socket.id);
                socket.emit("update-user-list", {
                    users: _this.activeSockets.filter(function (existingSocket) { return existingSocket !== socket.id; })
                });
                socket.broadcast.emit("update-user-list", {
                    users: [socket.id]
                });
            }
            socket.on("call-user", function (data) {
                socket.to(data.to).emit("call-made", {
                    offer: data.offer,
                    socket: socket.id
                });
            });
            socket.on("make-answer", function (data) {
                socket.to(data.to).emit("answer-made", {
                    socket: socket.id,
                    answer: data.answer
                });
            });
        });
    };
    Server.prototype.listen = function (callback) {
        var _this = this;
        this.httpServer.listen(this.DEFAULT_PORT, function () {
            return callback(_this.DEFAULT_PORT);
        });
    };
    Server.prototype.configureApp = function () {
        this.app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
    };
    return Server;
}());
exports.Server = Server;
//# sourceMappingURL=server.js.map