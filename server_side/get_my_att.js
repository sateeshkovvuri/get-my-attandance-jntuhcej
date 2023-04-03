const fetch= require("node-fetch")

const events=require("eventemitter3")
let exit_event=new events()

const send_cap_src=require("./socket.js")[0]
let captcha_inp=require("./socket.js")[2]


const get_att=async(roll,password,device_id)=>{
    
    try{
    let incorrect_credentials=false;
    let incorrect_captcha=false;
    let already_logged_in=false;
    let incorrect_credentials_msg="Invalid username or password"
    let incorrect_captcha_msg="Please enter Secuirity Code Correct"
    let browser=undefined
    let early_close_request=false;

    await exit_event.on("exit",async(d_id)=>{

        if(d_id==device_id && browser==undefined) early_close_request=true
        
        if(d_id==device_id && browser!=undefined) await browser.close()
        
        
    })

    
    
    const PUPPETEER=require("puppeteer")
    browser= await PUPPETEER.launch({"headless":true})

    if(early_close_request) {
        browser.close()
        return "user disconnected"
    }

    let tab=await browser.newPage()
    

    try{
    await tab.setDefaultNavigationTimeout(0)
    await tab.goto("https://exams.jntuhcej.ac.in/student/login")
    await tab.waitForSelector("#captcha_image")
    
    await tab.type("#username",roll)
    await tab.type("#password",password)



    await tab.on("console",async(message)=>{
        let captcha_src=message.text()
        
        if(message.type()=="log" && captcha_src!=incorrect_captcha_msg && captcha_src!=incorrect_credentials_msg){
    
            let flag1=captcha_src.indexOf(".jpg")
            
            let flag=1
            if(flag1!=-1){
            try{    
            let captcha_page_source_recieved=await fetch(captcha_src)
            let captcha_page_source=await captcha_page_source_recieved.text()
            flag= captcha_page_source.indexOf("Warning")
            }
            catch{}
            }
            

            if(flag==-1 && flag1!=-1){
            send_cap_src.emit(device_id+" new src",captcha_src)
            await tab.type("#scode",await captcha_inp(device_id))
            
            }

            else{
                await tab.type("#scode","///")
            }
            
            await tab.click("#login")
            
            
        }
        
        else if(captcha_src==incorrect_captcha_msg) {
            incorrect_captcha=true;
            browser.close()
        }
        else if(captcha_src==incorrect_credentials_msg){
            incorrect_credentials=true;
            browser.close()
        }
    })

    await tab.evaluate(()=>{
        let captcha_src=document.getElementsByTagName("img")[1].getAttribute("src")
        console.log(captcha_src)
        
    })


    await tab.evaluate(()=>{
        let error_box=document.getElementById("error_msg")
        const observer_func=(observe_on,changes)=>{
            let error_message=error_box.innerText
            console.log(error_message)
        }
        let observer=new MutationObserver(observer_func)
        observer.observe(error_box,{childList:true})
    })


    
    await tab.on("dialog",async (dialog)=>{
        already_logged_in=true;
        await dialog.accept()
        browser.close()
    })
}
    catch(e){
        return "user disconnected"
    }
    
    
     


    
    try{
        await tab.waitForNavigation()
        await tab.goto("https://exams.jntuhcej.ac.in/student/studentattendance/attendancesemester")
        await tab.waitForSelector("#mytable")
        
        let records=await tab.$$("td")

        let n=records.length
        let att_record=[]
        for(let i=0;i<n;i++){
            if(i<6 || (i+1)%6==1 || (i+1)%6==2 && i<n-3 ) continue;
            let data = await tab.evaluate(e=>e.textContent,records[i])
            data=data.trim()
            att_record.push(data)
        }
        
        await tab.goto("https://exams.jntuhcej.ac.in/student/login/logout")
        await browser.close()
        return att_record
        
    }
    
    catch(e){
        if(already_logged_in)return "already logged in"
        if(incorrect_credentials)return "incorrect roll number or password"
        if(incorrect_captcha) return "incorrect captcha"
        return "user disconnected"
    }
}

catch(e){
    console.log(e.message)
    return "user disconnected"
}
    
    
}

module.exports=[get_att,exit_event]
