/* ============================================================
   SMART SOCIETY — shared auth helpers
   Loaded by every page (login + app pages) before their own script.
   Accounts and session live in localStorage for this demo — swap
   for real calls to your Flask /api/auth routes when ready.
   ============================================================ */

function loadUsers(){
  try{ return JSON.parse(localStorage.getItem("ss_users") || "{}"); }
  catch(e){ return {}; }
}
function saveUsers(u){ try{ localStorage.setItem("ss_users", JSON.stringify(u)); }catch(e){} }

function getSession(){
  try{ return JSON.parse(localStorage.getItem("ss_session") || "null"); }
  catch(e){ return null; }
}
function setSession(s){ try{ localStorage.setItem("ss_session", JSON.stringify(s)); }catch(e){} }
function clearSession(){ try{ localStorage.removeItem("ss_session"); }catch(e){} }

function currentUser(){
  const s = getSession();
  return s
    ? { name: s.name, address: s.address || "—", phone: s.phone || "" }
    : { name:"Resident", address:"—", phone:"" };
}

function userKey(role, id){ return role + ":" + id.trim().toLowerCase(); }
