const { RTCPeerConnection, RTCSessionDescription } = window;
const peerConnection=new RTCPeerConnection({
    iceServers: [{
        urls: "turn:13.237.145.223:3478",
        username: 'tonic',
        credential: 'tonic2022t'
    }]
});

if (typeof window.navigator !== "undefined") {
    // console.log(navigator.getUserMedia());
    navigator.mediaDevices.getUserMedia(
        {video: true, audio: true}
    ).then((stream)=>{
        console.log(stream);
        const localVideo = document.getElementById("local-video");
        if (localVideo) {
            localVideo.srcObject = stream;
        }
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    }).catch((error)=> {
        console.warn(error.message);
    });
}

(function () {
    const socket = io();
    let isAlreadyCalling;
    socket.on("update-user-list", ({users}) => {
        // console.log(users);
        updateUserList(users);
    });

    socket.on("remove-user", ({socketId}) => {
        const elToRemove = document.getElementById(socketId);

        if (elToRemove) {
            elToRemove.remove();
        }
    });

    socket.on("call-made", async data => {
        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.offer)
        );
        const answer = await peerConnection.createAnswer();
        console.log(answer);
        await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

        socket.emit("make-answer", {
            answer,
            to: data.socket
        });
    });

    socket.on("answer-made", async data => {
        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer)
        );

        if (!isAlreadyCalling) {
            await callUser(data.socket);
            isAlreadyCalling = true;
        }
    });

    socket.on("disconnect", () => {
        this.activeSockets = this.activeSockets.filter(
            existingSocket => existingSocket !== socket.id
        );
        socket.broadcast.emit("remove-user", {
            socketId: socket.id
        });
    });

    function updateUserList(socketIds) {
        const activeUserContainer = document.getElementById("active-user-container");

        socketIds.forEach(socketId => {
            const alreadyExistingUser = document.getElementById(socketId);
            if (!alreadyExistingUser) {
                const userContainerEl = createUserItemContainer(socketId);
                activeUserContainer.appendChild(userContainerEl);
            }
        });
    }

    function createUserItemContainer(socketId) {
        const userContainerEl = document.createElement("div");

        const usernameEl = document.createElement("p");

        userContainerEl.setAttribute("class", "active-user");
        userContainerEl.setAttribute("id", socketId);
        usernameEl.setAttribute("class", "username");
        usernameEl.innerHTML = `Socket: ${socketId}`;

        userContainerEl.appendChild(usernameEl);

        userContainerEl.addEventListener("click", () => {
            // unselectUsersFromList();
            userContainerEl.setAttribute("class", "active-user active-user--selected");
            const talkingWithInfo = document.getElementById("talking-with-info");
            talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
            callUser(socketId);
        });
        return userContainerEl;
    }
 
    async function callUser(socketId) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

        socket.emit("call-user", {
            offer,
            to: socketId
        });
    }
    peerConnection.ontrack = function({ streams: [stream] }) {
        const remoteVideo = document.getElementById("remote-video");
        if (remoteVideo) {
            remoteVideo.srcObject = stream;
        }
    };

    peerConnection.onnegotiationneeded=e=>{
        if (peerConnection.signalingState !== "stable") return;
    }

})();
