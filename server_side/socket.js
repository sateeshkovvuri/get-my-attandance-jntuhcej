const events = require("eventemitter3")
let new_cap_src=new events()
let input_resolve=new events()

let cap_inp=async(client_id)=>{
let captcha_promise=new Promise((resolve,reject)=>{
input_resolve.on("resolve",(c_id,value)=>{
    if(c_id==client_id){
        resolve(value)
    }
})
})
return captcha_promise
}


const open_socket=()=>{
const socket_server_end=require("socket.io")(5067)
console.log("socket open")
const get_att=require("./get_my_att")[0]
const exit_event=require("./get_my_att")[1]

socket_server_end.on("connection",async(device)=>{
    let creds=device.request._query

    await device.on("disconnect",()=>{
        exit_event.emit("exit",device.id)
    })
    

    device.emit("id",device.id)

    
    
    device.on(device.id+" captcha is solved",(value)=>{
        input_resolve.emit("resolve",device.id,value)        
    })
    
    new_cap_src.on(device.id+" new src",(new_src)=>{
        device.emit(device.id+" new captcha",new_src)
    })

    let att_per=await get_att(creds.roll,creds.password,device.id)
    device.emit(device.id+" attandance is fetched",att_per)
    device.emit(device.id+" disconnect")
    
    
}
)

}

module.exports = [new_cap_src,open_socket,cap_inp]
