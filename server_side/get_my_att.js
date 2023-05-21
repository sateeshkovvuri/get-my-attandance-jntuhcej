const events=require("eventemitter3")
let exit_event=new events()

const send_cap_src=require("./socket.js")[0]
let credentials_inp=require("./socket.js")[2]


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
    browser= await PUPPETEER.launch({"headless":false})

    if(early_close_request) {
        browser.close()
        return "user disconnected"
    }

    let tab=await browser.newPage()
    

    try{

    tab.on("dialog",async (dialog)=>{
            already_logged_in=true;
            await dialog.accept()
            await tab.waitForNavigation()
            await browser.close()
            
    })

    tab.setDefaultNavigationTimeout(0)
    await tab.goto("https://exams.jntuhcej.ac.in/student/login")
    await tab.waitForSelector("span img")
    
    tab.on("console",async(message)=>{
        let captcha_src=message.text()
        
        if(message.type()=="log" && captcha_src!=incorrect_captcha_msg && captcha_src!=incorrect_credentials_msg){
            send_cap_src.emit(device_id+" new src",captcha_src)

            let credentials=await credentials_inp(device_id)
            credentials= await JSON.parse(credentials)
            await tab.type("#username",credentials.roll)
            await tab.type("#password",credentials.password)
            await tab.type("#scode",credentials.captcha)
            await tab.click("#login")
            
            
        }
        
        else if(captcha_src==incorrect_captcha_msg) {
            incorrect_captcha=true;
            await browser.close()
        }
        else if(captcha_src==incorrect_credentials_msg){
            incorrect_credentials=true;
            await browser.close()
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
    return "user disconnected"
}
    
    
}

module.exports=[get_att,exit_event]