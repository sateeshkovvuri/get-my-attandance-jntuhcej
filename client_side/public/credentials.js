let visibility_option=document.getElementsByName("visibility_option")
visibility_option[0].checked=false
visibility_option[0].addEventListener("change",()=>{
    let password_field=document.getElementById("password");
    if(visibility_option[0].checked){
        password_field.type="text";
    }
    else{
        password_field.type="password";
    }
})