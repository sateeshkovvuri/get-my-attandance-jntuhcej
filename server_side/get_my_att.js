const events=require("eventemitter3")
let exit_event=new events()

const send_cap_src=require("./socket.js")[0]
let credentials_inp=require("./socket.js")[2]
let data_msg=require("./socket.js")[3]


const get_att=async(device_id)=>{
    return new Promise(async(accept,reject)=>{
        try{

            let incorrect_credentials_msg="Invalid username or password";
            let incorrect_captcha_msg="Please enter Secuirity Code Correct";
            let browser = undefined;
            let early_disconnect_request=false;

            await exit_event.on(`exit ${device_id}`,async()=>{
                try{
                    await browser.close();
                }
                catch(e){
                    early_disconnect_request=true;
                }
                finally{
                    reject("user disconnected");
                }
            })
        
            
            
            const PUPPETEER=require("puppeteer")
            browser= await PUPPETEER.launch({"headless":false})
        
            let tab=await browser.newPage();

            if(early_disconnect_request){
                await browser.close();
            }
        
            async function captcha(){
                let element = await tab.$("span img");
                const src = await element.evaluate((e) => {
                    return e.getAttribute("src"); 
                });
                return src;
            }

            async function pullAttandance(){
                try{
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
                
                await tab.goto("https://exams.jntuhcej.ac.in/student/login/logout");
                await browser.close();
                accept(att_record);
                }

                catch(e){
                    reject("already logged in")
                }
            }
        
            
        
        
            tab.on("dialog",async (dialog)=>{
                    already_logged_in=true;
                    await dialog.accept();
                    await tab.waitForNavigation();
                    await browser.close();
                    reject("already logged in")
            })
        
            tab.setDefaultNavigationTimeout(0)
        
            await tab.goto("https://exams.jntuhcej.ac.in/student/login")
            await tab.waitForSelector("#error_msg")
        
            await tab.evaluate(()=>{
                let error_box=document.getElementById("error_msg")
                const observer_func=(observe_on,changes)=>{
                    let error_message=error_box.innerText
                    console.log(error_message)
                }
                let observer=new MutationObserver(observer_func)
                observer.observe(error_box,{childList:true})
            })
        
            tab.on("console",async(message)=>{
                let captcha_src=message.text();
        
                if(captcha_src==incorrect_captcha_msg) {
                    data_msg.emit("data from "+device_id,"incorrect captcha")
                }
                else if(captcha_src==incorrect_credentials_msg){
                    data_msg.emit("data from "+device_id,"incorrect roll number or password")
                }
        
            })
        
            let prev_captcha_src="";
        
            while(tab.url()=="https://exams.jntuhcej.ac.in/student/login"){
        
                let src= setInterval(async()=>{
                    try{
                        let current_captcha_src= await captcha();
                        if(prev_captcha_src!= current_captcha_src){
                            send_cap_src.emit(device_id+" new src",current_captcha_src);
                            prev_captcha_src=current_captcha_src;
                            clearInterval(src);
                        }
                    }
                    catch(e){
                        pullAttandance();
                        clearInterval(src)
                    }
                    
                },500)
                
                let credentials=await credentials_inp(device_id)
                credentials= await JSON.parse(credentials)
                await tab.type("#username",credentials.roll)
                await tab.type("#password",credentials.password)
                await tab.type("#scode",credentials.captcha)
                await tab.click("#login")
        
            }
        }

        catch(e){
            reject("user disconnected")
        }
    })

}

module.exports=[get_att,exit_event]
