/* ============================================================
   SMART SOCIETY — Complaint & Service Portal
   Shared script for every page after login.
   Uses getSession/currentUser/etc from auth.js (loaded first).
   Data lives in localStorage for this demo. Swap the API
   object's three methods for Flask calls when ready.
   ============================================================ */

/* ---------- auth guard ---------- */
const PAGE = (location.pathname.split("/").pop() || "dashboard.html");
const session = getSession();

if(!session){
  location.href = "login.html?next=" + encodeURIComponent(PAGE);
} else if(PAGE === "admin.html" && session.role !== "admin"){
  location.href = "dashboard.html";
}

/* ---------- category / status vocab ---------- */
const CAT_ICON = {
  "Maintenance":"wrench","Water":"droplet","Electricity":"bolt",
  "Cleanliness":"sparkle","Security":"shield","Other":"circle_x"
};
const CAT_DOT = {
  "Maintenance":"#F5A623","Water":"#3E6BF0","Electricity":"#EAB308",
  "Cleanliness":"#12B76A","Security":"#8B6BF0","Other":"#6B7280"
};
const STATUS_ORDER = ["Pending","In progress","Resolved"];
const STATUS_CLASS = { "Pending":"pending", "In progress":"progress", "Resolved":"resolved" };
const STATUS_LABEL = { "Pending":"PENDING", "In progress":"IN PROGRESS", "Resolved":"RESOLVED" };

const SERVICES = [
  {id:"gardening", ico:"leaf", color:"#4CAF50", name:"Gardening", desc:"Lawn mowing, plant care, potted garden setup and balcony greenery at your address.", ext:"RWA Approved Vendor · Ext. 26", hrs:"Book 1 day ahead", cat:"Maintenance"},
  {id:"plumbing", ico:"wrench", color:"#3E6BF0", name:"Plumbing", desc:"Tap and pipe leaks, blocked drains, flush tank and geyser fitting inside your home.", ext:"RWA Office · Ext. 21", hrs:"Same day, within 4 hrs", cat:"Water"},
  {id:"electricity", ico:"bolt", color:"#EAB308", name:"Electricity", desc:"Switchboards, fans, wiring faults and appliance fittings inside your home.", ext:"RWA Office · Ext. 22", hrs:"Same day, within 4 hrs", cat:"Electricity"},
  {id:"househelp", ico:"sparkle", color:"#8B6BF0", name:"Househelp", desc:"Verified maid, cook or part-time help for daily housework, booked through the RWA.", ext:"RWA Approved Staff · Ext. 27", hrs:"Book 1 day ahead", cat:"Cleanliness"}
];

const SEED = [
  {id:"MG-B-0146",cat:"Water",address:"B-10, Mayfield Gardens",title:"No water supply on 3rd floor since morning",status:"In progress",urgency:"High",days:0,note:"Booster pump valve being replaced."},
  {id:"MG-B-0145",cat:"Maintenance",address:"B-702, Mayfield Gardens",title:"Lift stops between 6th and 7th floor",status:"Pending",urgency:"High",days:1,note:""},
  {id:"MG-B-0144",cat:"Cleanliness",address:"B-108, Mayfield Gardens",title:"Garbage not collected from basement bay",status:"Pending",urgency:"Medium",days:1,note:""},
  {id:"MG-B-0143",cat:"Electricity",address:"B-10, Mayfield Gardens",title:"Corridor lights out on 3rd floor",status:"In progress",urgency:"Medium",days:2,note:"Two fittings replaced, third on order."},
  {id:"MG-B-0142",cat:"Other",address:"B-201, Mayfield Gardens",title:"Visitor car parked in allotted slot 14",status:"Resolved",urgency:"Low",days:3,note:"Vehicle moved, sticker rule shared with owner."},
  {id:"MG-B-0140",cat:"Security",address:"B-609, Mayfield Gardens",title:"Intercom not connecting to guard room",status:"Resolved",urgency:"Medium",days:6,note:"Line re-terminated at the DP box."},
  {id:"MG-B-0139",cat:"Water",address:"B-10, Mayfield Gardens",title:"Leaking tap in the kitchen",status:"Resolved",urgency:"Low",days:8,note:"Washer changed."}
];

/* ---------- storage ---------- */
const store = {
  read(){
    try{
      const raw = localStorage.getItem("ss_tickets");
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return SEED.map(t => ({...t, ts: Date.now() - t.days * 86400000}));
  },
  write(list){ try{ localStorage.setItem("ss_tickets", JSON.stringify(list)); }catch(e){} }
};
const state = { tickets: store.read() };

/* ------------------------------------------------------------
   API — swap for Flask routes when ready:
     list()             -> GET   /api/complaints
     create(payload)    -> POST  /api/complaints
     updateStatus(...)  -> PATCH /api/complaints/<id>
-------------------------------------------------------------*/
const API = {
  list(){ return state.tickets; },
  create(p){
    const highest = state.tickets.reduce((m,t) => {
      const n = parseInt(String(t.id).split("-").pop(), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    const t = {
      id: "MG-B-" + String(highest + 1).padStart(4,"0"),
      cat:p.category, address:p.address, title:p.title, details:p.details || "",
      status:"Pending", urgency:p.urgency || "Medium", ts:Date.now(), note:""
    };
    state.tickets.unshift(t);
    store.write(state.tickets);
    return t;
  },
  updateStatus(id, status){
    const t = state.tickets.find(x => x.id === id);
    if(t) t.status = status;
    store.write(state.tickets);
    return t;
  }
};

/* ---------- helpers ---------- */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function ago(ts){
  const d = Math.floor((Date.now() - ts) / 86400000);
  if(d <= 0) return "today";
  if(d === 1) return "yesterday";
  return d + " days ago";
}
function badge(status){ return `<span class="badge b-${STATUS_CLASS[status]}">${STATUS_LABEL[status]}</span>`; }

function toast(msg){
  let el = $("#toast");
  if(!el){ el = document.createElement("div"); el.id="toast"; el.className="toast"; document.body.appendChild(el); }
  el.textContent = msg; el.hidden = false;
  clearTimeout(el._t); el._t = setTimeout(() => el.hidden = true, 3800);
}

/* ---------- mobile nav drawer ---------- */
if($("#menuBtn")){
  $("#menuBtn").addEventListener("click", () => document.body.classList.add("nav-open"));
  $("#scrim").addEventListener("click", () => document.body.classList.remove("nav-open"));
  $$(".side-nav a").forEach(a => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
}

/* ---------- sidebar identity + nav state ---------- */
$$(".side-nav a").forEach(a => {
  if(a.getAttribute("href") === PAGE) a.classList.add("is-on");
  if(a.getAttribute("href") === "admin.html" && (!session || session.role !== "admin")) a.hidden = true;
});
(function fillIdentity(){
  const me = currentUser();
  if($("#sideName")) $("#sideName").textContent = session ? session.name : "Resident";
  if($("#sideMeta")) $("#sideMeta").textContent = session
    ? (session.role === "admin" ? "RWA Staff · " + (session.staffId || "") : `${me.address} · Resident`)
    : "";
})();
if($("#logoutBtn")) $("#logoutBtn").addEventListener("click", () => { clearSession(); location.href = "login.html"; });

/* ---------- small inline icon lookup (mirrors login.html's icon set) ---------- */
function ICON_HTML(name){
  const MAP = {
    wrench:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.6 5.2L3 17.6V21h3.4l6.1-6.1a4 4 0 0 0 5.2-5.6l-2.6 2.6-2-2 2.6-2.6z"/></svg>',
    droplet:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 7.2 6 11a6 6 0 0 1-12 0c0-3.8 6-11 6-11z"/></svg>',
    bolt:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
    sparkle:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2"/></svg>',
    shield:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 19 6v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6l7-3z"/></svg>',
    circle_x:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>',
    inbox:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h4l2 3h4l2-3h4"/><path d="M5.5 5h13L21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6L5.5 5z"/></svg>',
    plus:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    phone:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.4 1.4a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    clock:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    calendar:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    leaf:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4c0 9-6 15-15 15C5 10 11 4 20 4z"/><path d="M13 11 5 19"/></svg>',
    arrow_right:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    send:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>'
  };
  return MAP[name] || "";
}

/* ============================================================
   DASHBOARD
   ============================================================ */
if($("#statStrip") && $("#recentList")){
  const me = currentUser();
  if($("#welcomeName")) $("#welcomeName").textContent = me.name.split(" ")[0] || "Resident";

  const mine = state.tickets.filter(t => t.address.toLowerCase() === me.address.toLowerCase());
  const pending = mine.filter(t => t.status === "Pending").length;
  const progress = mine.filter(t => t.status === "In progress").length;
  const resolved = mine.filter(t => t.status === "Resolved").length;

  $("#statStrip").innerHTML = `
    <div class="stat st-pending"><b>${pending}</b><span>Pending</span></div>
    <div class="stat st-progress"><b>${progress}</b><span>In progress</span></div>
    <div class="stat st-resolved"><b>${resolved}</b><span>Resolved</span></div>
    <div class="stat st-total"><b>${mine.length}</b><span>Total</span></div>`;

  const recent = mine.slice(0,4);
  $("#recentList").innerHTML = recent.length ? recent.map(t => `
    <div class="ticket-row">
      <div class="t-left">
        <span class="t-ico">${ICON_HTML(CAT_ICON[t.cat])}</span>
        <div>
          <h4>${esc(t.title)}</h4>
          <div class="t-meta">${esc(t.id)} · ${esc(t.cat)} · ${ago(t.ts)}</div>
        </div>
      </div>
      ${badge(t.status)}
    </div>`).join("")
    : `<div class="empty">
        <div class="ic-wrap">${ICON_HTML("inbox")}</div>
        <h3>No complaints yet</h3>
        <p>Spotted an issue in the society? Raise your first complaint.</p>
        <a class="btn btn-lime" href="new-complaint.html">${ICON_HTML("plus")} ADD COMPLAINT</a>
      </div>`;
}

/* ============================================================
   NEW COMPLAINT
   ============================================================ */
if($("#complaintForm")){
  const f = $("#complaintForm");
  const me = currentUser();

  const preset = new URLSearchParams(location.search).get("service");
  if(preset){
    const svc = SERVICES.find(s => s.id === preset);
    if(svc){
      f.title.value = svc.name + " booking";
      f.details.value = svc.desc;
      const r = [...f.category].find(x => x.value === svc.cat);
      if(r) r.checked = true;
      const banner = $("#svcBanner");
      if(banner){ banner.hidden = false; banner.textContent = "Booking service: " + svc.name; }
    }
  }
  if(f.address && !f.address.value && me.address !== "—") f.address.value = me.address;

  f.addEventListener("submit", e => {
    e.preventDefault();
    const address = f.address.value.trim(), title = f.title.value.trim();
    if(!address){ toast("Add your address so the caretaker knows where to go."); f.address.focus(); return; }
    if(!title){ toast("Add a complaint title."); f.title.focus(); return; }
    const t = API.create({
      category: f.category.value, address, title,
      details: f.details.value.trim(), urgency: f.urgency.value
    });
    location.href = "complaints.html?id=" + encodeURIComponent(t.id);
  });
}

/* ============================================================
   YOUR COMPLAINTS
   ============================================================ */
function timeline(t){
  const idx = STATUS_ORDER.indexOf(t.status);
  const rows = [
    {h:"Complaint submitted", p:`Logged by ${t.address} · ${ago(t.ts)}`},
    {h:"Work in progress",    p: t.note || (idx >= 1 ? "Being looked into." : "Not started yet.")},
    {h:"Resolved",            p: t.status === "Resolved" ? "Closed by the RWA desk. Reopen if the issue is still there." : "Pending."}
  ];
  return `<div class="timeline">` + rows.map((c,i) => {
    const cls = i < idx ? "done" : i === idx ? "current" : "";
    return `<div class="tl-item ${cls}"><h5>${esc(c.h)}</h5><p>${esc(c.p)}</p></div>`;
  }).join("") + `</div>`;
}

if($("#complaintsList")){
  let activeFilter = "all";

  function render(){
    const me = currentUser();
    const mine = state.tickets.filter(t => t.address.toLowerCase() === me.address.toLowerCase());
    $("#cnt-all").textContent = mine.length;
    $("#cnt-pending").textContent = mine.filter(t => t.status === "Pending").length;
    $("#cnt-progress").textContent = mine.filter(t => t.status === "In progress").length;
    $("#cnt-resolved").textContent = mine.filter(t => t.status === "Resolved").length;

    const list = activeFilter === "all" ? mine : mine.filter(t => t.status === activeFilter);

    $("#complaintsList").innerHTML = list.length ? list.map(t => `
      <article class="ticket">
        <div class="ticket-top">
          <div>
            <h4>${esc(t.title)}</h4>
            <div class="meta">${esc(t.id)} · ${esc(t.cat)} · ${esc(t.address)} · raised ${ago(t.ts)} · ${esc(t.urgency)} priority</div>
          </div>
          ${badge(t.status)}
        </div>
        ${t.details ? `<p class="muted" style="font-size:.88rem">${esc(t.details)}</p>` : ""}
        ${timeline(t)}
      </article>`).join("")
      : `<div class="empty">
          <div class="ic-wrap">${ICON_HTML("inbox")}</div>
          <h3>No complaints yet</h3>
          <p>Raise a complaint and track it here from pending to resolved.</p>
          <a class="btn btn-lime" href="new-complaint.html">${ICON_HTML("plus")} ADD COMPLAINT</a>
        </div>`;
  }

  $$("#filterPills .pill").forEach(btn => btn.addEventListener("click", () => {
    activeFilter = btn.dataset.filter;
    $$("#filterPills .pill").forEach(b => b.classList.toggle("is-on", b === btn));
    render();
  }));

  const fresh = new URLSearchParams(location.search).get("id");
  if(fresh) toast(`Complaint logged. Your ticket is ${fresh}.`);
  render();
}

/* ============================================================
   SERVICES
   ============================================================ */
if($("#svcGrid")){
  $("#svcGrid").innerHTML = SERVICES.map(s => `
    <article class="svc-card">
      <span class="svc-ico" style="background:${s.color}">${ICON_HTML(s.ico)}</span>
      <h3>${esc(s.name)}</h3>
      <p>${esc(s.desc)}</p>
      <hr class="svc-divider">
      <div class="svc-meta">
        <span>${ICON_HTML("phone")}${esc(s.ext)}</span>
        <span>${ICON_HTML("clock")}${esc(s.hrs)}</span>
      </div>
      <a class="svc-link" href="new-complaint.html?service=${s.id}">Book Service ${ICON_HTML("arrow_right")}</a>
    </article>`).join("");
}

/* ============================================================
   ADMIN
   ============================================================ */
if($("#deskBody")){
  function renderDesk(){
    const all = state.tickets;
    const pending = all.filter(t => t.status === "Pending").length;
    const progress = all.filter(t => t.status === "In progress").length;
    const resolved = all.filter(t => t.status === "Resolved").length;
    $("#deskStrip").innerHTML = `
      <div class="stat st-pending"><b>${pending}</b><span>Pending</span></div>
      <div class="stat st-progress"><b>${progress}</b><span>In progress</span></div>
      <div class="stat st-resolved"><b>${resolved}</b><span>Resolved</span></div>
      <div class="stat st-total"><b>${all.length}</b><span>Total</span></div>`;

    const cats = [...new Set(all.map(t => t.cat))];
    const sel = $("#filterCat"), keep = sel.value;
    sel.innerHTML = `<option value="all">All categories</option>` + cats.map(c => `<option>${esc(c)}</option>`).join("");
    sel.value = [...sel.options].some(o => o.value === keep) ? keep : "all";

    const fs = $("#filterStatus").value, fc = sel.value;
    const rows = all.filter(t => (fs === "all" || t.status === fs) && (fc === "all" || t.cat === fc));

    $("#deskBody").innerHTML = rows.length ? rows.map(t => `
      <tr>
        <td class="idcell"><span class="catdot" style="background:${CAT_DOT[t.cat]}"></span>${esc(t.id)}</td>
        <td>${esc(t.title)}<div class="muted" style="font-size:.8rem">${esc(t.cat)}</div></td>
        <td>${esc(t.address)}</td>
        <td class="muted">${ago(t.ts)}</td>
        <td>
          <select class="statusSel" data-id="${esc(t.id)}">
            ${STATUS_ORDER.map(s => `<option ${s === t.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
      </tr>`).join("")
      : `<tr><td colspan="5"><div class="empty" style="border:0"><h3>Nothing here</h3><p>Clear a filter to see other complaints.</p></div></td></tr>`;

    const counts = {};
    all.forEach(t => counts[t.cat] = (counts[t.cat] || 0) + 1);
    const max = Math.max(1, ...Object.values(counts));
    $("#catBars").innerHTML = Object.entries(counts).sort((a,b) => b[1] - a[1]).map(([c,n]) => `
      <div class="bar-row">
        <span>${esc(c)}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${Math.round(n / max * 100)}%;background:${CAT_DOT[c]}"></span></span>
        <b>${n}</b>
      </div>`).join("");

    const pendingOldest = all.filter(t => t.status !== "Resolved").sort((a,b) => a.ts - b.ts)[0];
    $("#oldest").innerHTML = pendingOldest
      ? `<b style="color:var(--ink)">${esc(pendingOldest.id)}</b> — ${esc(pendingOldest.title)}<br>Open since ${ago(pendingOldest.ts)}, at ${esc(pendingOldest.address)}.`
      : "Nothing pending. The block is clear.";
  }

  $("#filterStatus").addEventListener("change", renderDesk);
  $("#filterCat").addEventListener("change", renderDesk);
  $("#deskBody").addEventListener("change", e => {
    const sel = e.target.closest(".statusSel");
    if(!sel) return;
    const t = API.updateStatus(sel.dataset.id, sel.value);
    toast(`${t.id} marked ${t.status.toLowerCase()}.`);
    renderDesk();
  });
  if($("#resetBtn")) $("#resetBtn").addEventListener("click", () => {
    try{ localStorage.removeItem("ss_tickets"); }catch(e){}
    location.reload();
  });

  renderDesk();
}
