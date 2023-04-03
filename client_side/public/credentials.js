let roll=document.getElementById("roll")
let password=document.getElementById("password")

let cred_form=document.getElementById("cred_form")

cred_form.addEventListener("submit",(e)=>{
    
    sessionStorage.setItem("roll",roll.value)
    sessionStorage.setItem("password",password.value)
})
