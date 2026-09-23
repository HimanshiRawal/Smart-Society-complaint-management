/* ============================================================
   SMART SOCIETY — Login / Sign Up
   Uses the shared helpers from auth.js (loaded before this file).
   Demo storage: accounts live in localStorage under "ss_users".
   Swap the two marked spots for real calls to your Flask
   /api/auth/login and /api/auth/signup routes.
   ============================================================ */

const $ = s => document.querySelector(s);

const tabResident = $("#tabResident");
const tabAdmin = $("#tabAdmin");
const formResident = $("#residentForm");
const formAdmin = $("#adminForm");
const loginErr = $("#loginError");
const loginOk = $("#loginOk");

let loginRole = "resident";
let loginMode = "signin"; // or "signup"

function showMsg(kind, msg){
  loginErr.hidden = kind !== "error";
  loginOk.hidden = kind !== "ok";
  if(kind === "error") loginErr.textContent = msg;
  if(kind === "ok") loginOk.textContent = msg;
}
function clearMsg(){ loginErr.hidden = true; loginOk.hidden = true; }

function refreshUI(){
  tabResident.classList.toggle("is-on", loginRole === "resident");
  tabAdmin.classList.toggle("is-on", loginRole === "admin");
  formResident.hidden = loginRole !== "resident";
  formAdmin.hidden = loginRole !== "admin";

  [formResident, formAdmin].forEach(f => f.classList.toggle("mode-signup", loginMode === "signup"));
  $("#rSubmit").textContent = loginMode === "signup" ? "CREATE ACCOUNT" : "SIGN IN";
  $("#aSubmit").textContent = loginMode === "signup" ? "CREATE ACCOUNT" : "SIGN IN";
  $("#modeToggle").textContent = loginMode === "signup" ? "Already have an account? Sign in" : "New here? Create an account";
  $("#loginTagline").textContent = loginMode === "signup" ? "Create your account" : "Sign in to continue";
  clearMsg();
}

tabResident.addEventListener("click", () => { loginRole = "resident"; refreshUI(); });
tabAdmin.addEventListener("click", () => { loginRole = "admin"; refreshUI(); });
$("#modeToggle").addEventListener("click", () => {
  loginMode = loginMode === "signup" ? "signin" : "signup";
  refreshUI();
});
refreshUI();

function goToApp(session){
  setSession(session);
  const next = new URLSearchParams(location.search).get("next");
  if(next && (session.role === "admin" || next !== "admin.html")){
    location.href = next;
  } else {
    location.href = session.role === "admin" ? "admin.html" : "dashboard.html";
  }
}

/* ---------- resident ---------- */
formResident.addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target;
  const address = f.address.value.trim();
  const password = f.password.value;
  if(!address){ showMsg("error", "Enter your address."); f.address.focus(); return; }
  if(!password){ showMsg("error", "Enter a password."); f.password.focus(); return; }

  const users = loadUsers();
  const key = userKey("resident", address);

  if(loginMode === "signup"){
    const name = f.fullName.value.trim();
    const phone = f.phone.value.trim();
    const password2 = f.password2.value;
    if(!name){ showMsg("error", "Enter your name."); f.fullName.focus(); return; }
    if(password.length < 4){ showMsg("error", "Password should be at least 4 characters."); f.password.focus(); return; }
    if(password !== password2){ showMsg("error", "Passwords don't match."); f.password2.focus(); return; }
    if(users[key]){ showMsg("error", "This address is already registered. Sign in instead."); return; }

    /* REPLACE with: await fetch('/api/auth/signup', {...}) */
    users[key] = { role:"resident", name, address, phone, password };
    saveUsers(users);
    goToApp({ role:"resident", name, address, phone });
  } else {
    const u = users[key];
    if(!u){ showMsg("error", "No account for this address yet. Create one first."); return; }
    if(u.password !== password){ showMsg("error", "Incorrect password."); f.password.focus(); return; }

    /* REPLACE with: await fetch('/api/auth/login', {...}) */
    goToApp({ role:"resident", name:u.name, address:u.address, phone:u.phone });
  }
});

/* ---------- staff / admin ---------- */
formAdmin.addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target;
  const staffId = f.staffId.value.trim();
  const password = f.password.value;
  if(!staffId){ showMsg("error", "Enter your staff ID."); f.staffId.focus(); return; }
  if(!password){ showMsg("error", "Enter a password."); f.password.focus(); return; }

  const users = loadUsers();
  const key = userKey("admin", staffId);

  if(loginMode === "signup"){
    const name = f.fullName.value.trim();
    const password2 = f.password2.value;
    if(!name){ showMsg("error", "Enter your name."); f.fullName.focus(); return; }
    if(password.length < 4){ showMsg("error", "Password should be at least 4 characters."); f.password.focus(); return; }
    if(password !== password2){ showMsg("error", "Passwords don't match."); f.password2.focus(); return; }
    if(users[key]){ showMsg("error", "This staff ID is already registered. Sign in instead."); return; }

    users[key] = { role:"admin", name, staffId:staffId.toUpperCase(), password };
    saveUsers(users);
    goToApp({ role:"admin", name, staffId:staffId.toUpperCase() });
  } else {
    const u = users[key];
    if(!u){ showMsg("error", "No account for this staff ID yet. Create one first."); return; }
    if(u.password !== password){ showMsg("error", "Incorrect password."); f.password.focus(); return; }

    goToApp({ role:"admin", name:u.name, staffId:u.staffId });
  }
});

/* if already signed in, skip straight past the login page */
(function(){
  const s = getSession();
  if(s){
    const next = new URLSearchParams(location.search).get("next");
    location.href = (next && (s.role === "admin" || next !== "admin.html")) ? next : (s.role === "admin" ? "admin.html" : "dashboard.html");
  }
})();
