
export interface ServerToClientEvents {
    callMade:(data:OfferData)=>void;
    answerMade:(data:AnswerData)=>void;
    updateUserList: (user:Array<User>) => void;
    rooms:(rooms:any)=>void;
}

export interface ClientToServerEvents {
    user: (name:string|null) => void;
    createRoom:(name:string|null)=>void;
    getUser:()=>void;
    callUser:(offer:OfferData)=>void;
    makeAnswer:(answer:AnswerData)=>void;
    getRooms:()=>void;
    disconnect:()=>void;
}

export interface SocketData {
    to: string;
    answer:any;
    offer:any;
}

export interface User{
    id:string,
    name:string
}

export interface InterServerEvents{
    
}

export interface OfferData{
    // offer:
    to:string,
    offer:any;
}

export interface AnswerData{
    // offer:
    to:string,
    answer:any;
}