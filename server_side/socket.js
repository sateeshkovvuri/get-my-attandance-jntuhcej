const events = require("eventemitter3")
let new_cap_src=new events()
let input_resolve=new events()


let creds_inp=async(client_id)=>{
let creds_promise=new Promise((resolve,reject)=>{
input_resolve.on("resolve",(c_id,creds)=>{
    if(c_id==client_id){
        resolve(creds)
    }
})
})
return creds_promise
}

const open_socket=()=>{
const socket_server_end=require("socket.io")(5067,{cors:{
    origin:"http://localhost:5000"
}
})
console.log("socket open")
const get_att=require("./get_my_att")[0]
const exit_event=require("./get_my_att")[1]

socket_server_end.on("connection",async(device)=>{
    let creds=device.request._query
    console.log("connected")
    await device.on("disconnect",()=>{
        exit_event.emit("exit",device.id)
    })
    

    device.emit("id",device.id)

    
    
    device.on(device.id+" captcha is solved",(creds)=>{
        input_resolve.emit("resolve",device.id,creds)        
    })
    
    new_cap_src.on(device.id+" new src",(new_src)=>{
        device.emit(device.id+" new captcha",new_src)
    })

    while(true){
        let att_per=await get_att(creds.roll,creds.password,device.id)
        device.emit(device.id+" attandance is fetched",att_per)
        if(att_per!="incorrect captcha" && att_per!="already logged in" && att_per!="incorrect roll number or password"){
            break;
        }
    }

    device.emit(device.id+" disconnect")
    
    
}
)

}

module.exports = [new_cap_src,open_socket,creds_inp]