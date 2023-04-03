function loginPage(){
  sessionStorage.clear()
  window.location.replace("http://localhost:5000/get_my_att")
}

const attandance_box = document.getElementById("attandance");
const legend=document.getElementById("legend")
const captcha_box = document.getElementById("captcha_box");
const captcha = document.getElementById("captcha");
let roll = sessionStorage.getItem("roll");
let password = sessionStorage.getItem("password");
const solved_captcha = document.getElementById("solved_captcha");
const attandance = document.getElementById("attandance");
const login_btn=document.getElementById("login")



const socket_client_side = io.connect("http://localhost:5067", {
  query: `roll=${roll}&password=${password}`,
});

legend.hidden=true
login_btn.hidden=true

let ID = {
  connection_id: undefined,
};

socket_client_side.on("id", (id) => {
  ID.connection_id = id;
  socket_client_side.on(id + " disconnect", () => {
    socket_client_side.disconnect();
  });

  socket_client_side.on(id + " new captcha", (link) => {
    captcha.setAttribute("src", link);
    solved_captcha.setAttribute("placeholder", "solve this captcha");
  });

  let err_msgs = [
    "already logged in",
    "incorrect roll number or password",
    "incorrect captcha",
    "user disconnected",
  ];

  socket_client_side.on(id + " attandance is fetched", async (data) => {
    captcha_box.remove();
    let error = false;
    for (msg of err_msgs) {
      if (msg == data) {
        error = true;
        attandance_box.style.backgroundColor = "red";
        attandance_box.innerText = data;
        setTimeout(() => {
          if (data == "incorrect roll number or password") {
            sessionStorage.clear()
            window.location.replace("http://localhost:5000/get_my_att");
          } else window.location.reload();
        }, 500);
      }
    }

    if (!error) {
      let previous_data_exists = false;
      let rewrite = false;

      await fetch("http://localhost:5000/db", {
        method: "post",
        headers: {
          "Content-type": "application/x-www-form-urlencoded",
        },
        body: `roll=${roll}`,
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
              roll: roll,
              "new user": !previous_data_exists,
              rewrite: rewrite,
            }),
          });

          attandance_box.innerHTML = "";
          attandance_box.appendChild(table);
          legend.style.display="flex"
          legend.hidden=false
          login_btn.hidden=false
        });
    }
  });
});

socket_client_side.io.on("reconnect", () => {
  captcha.setAttribute("src", "#");
  solved_captcha.setAttribute("placeholder", "captcha will be loaded");
  solved_captcha.value = "";
  attandance.innerHTML = "";
});

let get_att = document.getElementById("fetch_att");
get_att.addEventListener("click", () => {
  let captcha_value = solved_captcha.value;
  if (captcha_value.length >= 3 && captcha.getAttribute("src") != "#") {
    socket_client_side.emit(
      ID.connection_id + " captcha is solved",
      captcha_value
    );
    captcha.setAttribute("src", "#");
    solved_captcha.setAttribute("placeholder", "captcha submitted");
    solved_captcha.value = "";
    attandance.innerHTML = "<i>fetching your attandance</i>";
  }
});
