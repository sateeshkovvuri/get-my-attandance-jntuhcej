const captcha=document.getElementById("captcha_img")
const socket_client_side = io.connect("http://localhost:5067");
const solved_captcha = document.getElementById("captcha");
const msg = document.getElementById("message")

const roll = document.getElementById("roll")
const password = document.getElementById("password")
const attandance_box =document.getElementById("attendance")
const login=document.getElementById("login")
const back = document.getElementById("back")


captcha.setAttribute("src", "#");
solved_captcha.setAttribute("placeholder", "captcha will be loaded");
solved_captcha.value = "";
const legend = document.getElementById("legend")
legend.hidden=true

back.addEventListener("click",()=>{
  window.location.replace("http://localhost:5000/getmyatt")
})
back.hidden=true

let ID = {
  connection_id: undefined,
};

socket_client_side.on("id", (id) => {
  ID.connection_id = id;
  socket_client_side.on(id + " disconnect", () => {
    socket_client_side.disconnect();
  });


  socket_client_side.on(id + " attandance is fetched", async (data) => {

    if(data=="incorrect roll number or password" || data =="incorrect captcha" || data=="already logged in"){
      msg.innerText=data;
      msg.classList.add("message");
      if(data=="incorrect roll number or password"){
        roll.value="";
        password.value="";
      }
      
      solved_captcha.setAttribute("placeholder", "captcha will be loaded");
      

      setTimeout(()=>{
        msg.innerText="";
        msg.classList.remove("message")
      },3000)
    }

    else if(data=="user disconnected"){
      msg.classList.add("message")
      msg.innerHTML="<p>some error occured,</p><p>please check your internet<p/><p>(reloading..)</p>";
      setTimeout(()=>{
        window.location.reload();
      },1000)
      
    }

    else{
      let previous_data_exists = false;
      let rewrite = false;

      await fetch("http://localhost:5000/db", {
        method: "post",
        headers: {
          "Content-type": "application/x-www-form-urlencoded",
        },
        body: `roll=${roll.value.toUpperCase()}`,
      })
        .then((data) => {
          return data.json();
        })
        .then(async (data_record) => {
          
          let db = {};
          
          if (data_record.msg == undefined) {
            for (sub of data_record) {
              previous_data_exists = true;
              if (
                data.find((s) => {
                  return s == sub.subject;
                }) == undefined &&
                sub.subject != "TOTAL"
              ) {
                db = {};
                rewrite = true;
                break;
              }

              db[sub.subject] = [
                sub.classesConducted,
                sub.classesAttended,
                sub.attandanceGathered,
              ];
            }
          }

          let table = document.createElement("table");
          let i = 0;
          let arr = [];
          let subject = undefined;
          let table_header = document.createElement("tr");
          table_header.className = "header";
          table_header.innerHTML =
            "<td>subject</td><td>classes conducted</td><td>classes attended</td><td>attandance gathered</td>";
          table.appendChild(table_header);
          for (i; i < data.length - 3; i++) {
            if (i % 4 == 0) subject = data[i];
            let table_data = document.createElement("td");
            table_data.innerHTML = `<strong>${data[i]}</strong>`;
            if (
              !rewrite &&
              data_record.msg == undefined &&
              i % 4 > 0 &&
              previous_data_exists
            ) {
              if (Number(data[i]) > Number(db[subject][(i % 4) - 1])) {
                table_data.className = "increased";
              } else if (Number(data[i]) < Number(db[subject][(i % 4) - 1])) {
                table_data.className = "decreased";
              }
            }
            arr.push(table_data);
            if (i % 4 == 3) {
              let table_row = document.createElement("tr");
              let n = arr.length;
              for (let j = 0; j < n; j++) {
                table_row.appendChild(arr[j]);
              }
              arr = [];
              table.appendChild(table_row);
            }
          }
          let table_row = document.createElement("tr");
          let table_data = document.createElement("td");
          table_data.innerHTML = "<strong>total</strong>";
          table_row.appendChild(table_data);

          let k = 0;
          for (i; i < data.length; i++) {
            let table_data = document.createElement("td");
            table_data.innerHTML = `<strong>${data[i]}</strong>`;
            if (
              !rewrite &&
              previous_data_exists &&
              data_record.msg == undefined &&
              Number(data[i]) < Number(db["TOTAL"][k])
            )
              table_data.className = "decreased";
            else if (
              !rewrite &&
              previous_data_exists &&
              data_record.msg == undefined &&
              Number(data[i]) > Number(db["TOTAL"][k])
            )
              table_data.className = "increased";
            k++;
            table_row.appendChild(table_data);
          }

          table.appendChild(table_row);
          
          await fetch("http://localhost:5000/attupdate", {
            method: "post",
            headers: {
              "Content-type": "application/json",
            },
            body: JSON.stringify({
              att: data,
              roll: roll.value.toUpperCase(),
              "new user": !previous_data_exists,
              rewrite: rewrite,
            }),
          });

          document.title="attandance";
          login.style.display="none";
          attandance_box.innerHTML = "";
          attandance_box.appendChild(table);
          legend.style.display="flex";
          legend.hidden=false;
          back.hidden=false;
        });
    }
    

  })

  socket_client_side.on(id + " new captcha", (link) => {
    solved_captcha.required=true
    captcha.setAttribute("src", link);
    solved_captcha.setAttribute("placeholder", "solve this captcha");
  });

});

socket_client_side.io.on("reconnect", () => {
  captcha.setAttribute("src", "#");
  solved_captcha.setAttribute("placeholder", "captcha will be loaded");
  solved_captcha.value = "";
  attandance_box.innerHTML = "";
  msg.innerText="Reconnected"
  msg.classList.add("message");
  setTimeout(()=>{
    msg.innerText="";
    msg.classList.remove("message")
  },2000)
});

let get_att = document.getElementById("fetch_att");
get_att.addEventListener("click", () => {
  let credentials={};
  credentials["roll"] = roll.value
  credentials["password"] = password.value
  credentials["captcha"] = solved_captcha.value
  credentials = JSON.stringify(credentials)
  let captcha_value = solved_captcha.value;
  if (captcha_value.length >= 3 && captcha.getAttribute("src") != "#") {
    solved_captcha.required=false
    socket_client_side.emit(
      ID.connection_id + " captcha is solved",
      credentials
    );
    captcha.setAttribute("src", "#");
    msg.innerText="fetching your attandance"
    msg.classList.add("message")
    solved_captcha.setAttribute("placeholder", "captcha submitted");
    solved_captcha.value = "";
  }
});
