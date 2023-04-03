const express=require("express")
const server=new express()

const mysql=require("mysql")
const db=mysql.createConnection({
    host:"localhost",
    user:"sateesh",
    password:"25050023",
    database:"attandance_db" 
})

db.connect((err)=>{
    if(err)console.log(err)
    else{
        console.log("db online")
    }
})

server.listen(5000,()=>{
    console.log("client is active")
})

server.use(express.static("./public"))

server.set("view engine","ejs")

server.get("/get_my_att",(req,res)=>{
    res.render("./credentials.ejs")
})

server.use(express.urlencoded({extended:true}))
server.use(express.json({extended:true}))


server.post("/attandance",(req,res)=>{
    res.render("./client.ejs",{
        "roll":req.body.roll,
        "password":req.body.password
    })
})

server.post("/db",(req,res)=>{
    let query=`select * from ${req.body.roll}`
    db.query(query,(err,rows,cols)=>{
        if(err){

            query_create=`create table ${req.body.roll}(subject varchar(50),
            classesConducted varchar(4),
            classesAttended varchar(4),
            attandanceGathered varchar(6)
            )`
                db.query(query_create,(err,rows,cols)=>{

                })

                res.json({"msg":"new user"})
                
        }
        else{
            res.send(rows)
        }
    })
    
})

server.post("/attupdate",(req,res)=>{

    
    if(req.body["rewrite"] || req.body["new user"]){
        
        if(req.body["rewrite"]){
            let clear_query=`delete from ${req.body.roll}`
            db.query(clear_query,(err,rows,cols)=>{})
        }

        let common_query=`insert into ${req.body.roll} values(`
        let query=""
        let i=0
        let n=req.body.att.length
        for(i;i<n-3;i++){
            
            if(i%4==0){
                query+=common_query
            }
           
            query+=`'${req.body.att[i]}'`
            if(i%4!=3)query+=","
            if(i%4==3){
                query+=")"
                db.query(query,(err,rows,cols)=>{})
                query=""
            }
            
        }
        common_query+=`'TOTAL',`
        for(i;i<n;i++){
            common_query+=req.body.att[i]
            if(i!=n-1) common_query+=","
            
        }
        common_query+=")"
        
        db.query(common_query,(err,rows,cols)=>{})
        
        db.commit()

    }

    else{
        let common_query=`update ${req.body.roll} set `
        
        let i=0;
        let n=req.body.att.length
        let query=""
        let condition=""
        for(i;i<n-3;i++){
            if((i%4)==0){
                condition+=` where subject = '${req.body.att[i]}'`
            }
            else if((i%4)==1){
                query+=common_query
                query+=`classesConducted = '${req.body.att[i]}',`
            }
            else if((i%4)==2){
                query+=`classesAttended = '${req.body.att[i]}',`
            }
            else{
                query+=`attandanceGathered ='${req.body.att[i]}'`+condition
                db.query(query,(err,rows,cols)=>{
                    if(err){
                        console.log(err.message)
                    }
                })
                query=""
                condition=""
            }
        }

        common_query+=`classesConducted='${req.body.att[i]}',classesAttended='${req.body.att[i+1]}',attandanceGathered='${req.body.att[i+2]}' where subject='TOTAL'`
        db.query(common_query,(err,rows,cols)=>{})
    }
    db.commit()
    res.send("got it")
})

