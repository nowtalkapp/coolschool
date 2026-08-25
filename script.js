const STORAGE = "coolschool-v1";
const contacts = [
  {id:"alex", name:"Alex", initials:"A", color:"blue"},
  {id:"emma", name:"Emma", initials:"E", color:"pink"},
  {id:"jake", name:"Jake", initials:"J", color:"green"},
  {id:"science", name:"Science Class", initials:"SC", color:"purple"},
  {id:"math", name:"Math Homework", initials:"M", color:"orange"},
  {id:"team", name:"CoolSchool Team", initials:"CS", color:"blue"}
];

const demo = {
  alex:{id:"alex",name:"Alex",kind:"direct",members:["alex"],pinned:true,muted:false,unread:false,messages:[
    m("alex","hey are you coming to school tomorrow?",false,"10:21 AM"),
    m("me","yeah probably",true,"10:22 AM"),
    m("alex","nice",false,"10:22 AM"),
    m("alex","dont forget the science thing lol",false,"10:23 AM")
  ]},
  emma:{id:"emma",name:"Emma",kind:"direct",members:["emma"],pinned:false,muted:false,unread:true,messages:[
    m("emma","did you finish the history worksheet?",false,"Yesterday"),
    m("me","almost 😭",true,"Yesterday"),
    m("emma","same lmao",false,"Yesterday")
  ]},
  jake:{id:"jake",name:"Jake",kind:"direct",members:["jake"],pinned:false,muted:false,unread:false,messages:[
    m("jake","basketball after school?",false,"Mon"),
    m("me","yeah im down",true,"Mon")
  ]},
  science:{id:"science",name:"Science Class",kind:"group",members:["alex","emma","jake"],pinned:false,muted:false,unread:true,messages:[
    m("alex","remember the lab report is due friday",false,"9:12 AM"),
    m("emma","i thought it was monday 😭",false,"9:14 AM"),
    m("me","nah friday",true,"9:15 AM")
  ]},
  math:{id:"math",name:"Math Homework",kind:"group",members:["alex","jake"],pinned:false,muted:false,unread:false,messages:[
    m("jake","what did you get for #12?",false,"Sun"),
    m("me","7/3 i think",true,"Sun"),
    m("alex","same",false,"Sun")
  ]},
  team:{id:"team",name:"CoolSchool Team",kind:"group",members:["alex","emma","jake"],pinned:false,muted:false,unread:false,messages:[
    m("alex","welcome to the local demo 👋",false,"Fri"),
    m("me","this looks clean",true,"Fri")
  ]}
};

function m(sender,text,out,time,reaction=null){return {id:crypto.randomUUID(),sender,text,out,time,reaction}}
function cloneDemo(){return structuredClone(demo)}
let state = loadState();
let activeId = Object.keys(state.conversations)[0] || "alex";
let filter = "all";

function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE);
    if(raw){
      const parsed=JSON.parse(raw);
      if(parsed?.conversations) return parsed;
    }
  }catch{}
  const s={conversations:cloneDemo(),settings:{theme:"system",enter:true,receipts:true,typing:true}};
  saveState(s); return s;
}
function saveState(){localStorage.setItem(STORAGE,JSON.stringify(state))}
function contact(id){return contacts.find(c=>c.id===id)}
function avatarHTML(c, extra=""){return `<span class="avatar ${c?.color||"group"} ${extra}">${c?.initials||"?"}</span>`}
function conversationAvatar(c){
  if(c.kind==="group") return `<span class="avatar group">${c.members.slice(0,2).map(id=>contact(id)?.initials||"?").join("")}</span>`;
  return avatarHTML(contact(c.members[0]));
}
function lastMessage(c){return c.messages[c.messages.length-1]}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]))}

const listEl=document.getElementById("conversationList");
const messagesEl=document.getElementById("messages");
const app=document.getElementById("app");
const input=document.getElementById("messageInput");

function renderList(){
  const q=document.getElementById("searchInput").value.trim().toLowerCase();
  let arr=Object.values(state.conversations).filter(c=>{
    if(filter==="unread"&&!c.unread)return false;
    if(filter==="pinned"&&!c.pinned)return false;
    if(!q)return true;
    return c.name.toLowerCase().includes(q)||c.messages.some(x=>x.text.toLowerCase().includes(q));
  }).sort((a,b)=>(b.pinned-a.pinned)||((lastMessage(b)?.id||"").localeCompare(lastMessage(a)?.id||"")));

  listEl.innerHTML=arr.length?arr.map(c=>{
    const last=lastMessage(c);
    return `<button class="conversation ${c.id===activeId?"selected":""}" data-id="${c.id}">
      ${conversationAvatar(c)}
      <span class="conv-copy"><span class="conv-name">${escapeHTML(c.name)}</span><span class="preview">${last?escapeHTML(last.out?"You: ":"")+escapeHTML(last.text):"No messages yet"}</span></span>
      <span class="conv-meta"><span class="time">${escapeHTML(last?.time||"")}</span>${c.unread?'<span class="unread-dot"></span>':""}</span>
    </button>`;
  }).join(""):`<div class="empty-chat" style="padding:35px 15px"><div class="empty-icon">⌕</div><p>No conversations found.</p></div>`;
  listEl.querySelectorAll(".conversation").forEach(b=>b.onclick=()=>openConversation(b.dataset.id));
}

function openConversation(id){
  if(!state.conversations[id])return;
  activeId=id;
  state.conversations[id].unread=false;
  saveState(); renderList(); renderChat();
  app.classList.add("show-chat");
}
function renderChat(){
  const c=state.conversations[activeId];
  if(!c){
    document.getElementById("headerName").textContent="Select a conversation";
    document.getElementById("headerStatus").textContent="";
    messagesEl.innerHTML='<div class="empty-chat"><div class="empty-icon">💬</div><h2>CoolSchool</h2><p>Pick a conversation to get started.</p></div>';
    return;
  }
  document.getElementById("headerAvatar").outerHTML=conversationAvatar(c).replace('class="avatar ','class="avatar large ');
  document.getElementById("headerName").textContent=c.name;
  document.getElementById("headerStatus").textContent=c.kind==="group"?`${c.members.length+1} participants`:"online";
  messagesEl.innerHTML="";
  let previousDay="";
  c.messages.forEach((msg,i)=>{
    if(msg.day && msg.day!==previousDay){messagesEl.insertAdjacentHTML("beforeend",`<div class="day-divider">${escapeHTML(msg.day)}</div>`);previousDay=msg.day}
    const sender=msg.out?null:contact(msg.sender);
    const showName=c.kind==="group"&&!msg.out&&(i===0||c.messages[i-1]?.sender!==msg.sender);
    const row=document.createElement("div");
    row.className=`message-row ${msg.out?"out":"in"}`;
    row.dataset.id=msg.id;
    row.innerHTML=`${!msg.out?avatarHTML(sender,"message-avatar"):""}
      <div class="message-stack">${showName?`<div class="group-sender">${escapeHTML(sender?.name||"Someone")}</div>`:""}
      <div class="bubble" tabindex="0">${escapeHTML(msg.text)}${msg.reaction?`<div class="reactions"><button class="reaction-btn" data-react="${msg.reaction}">${msg.reaction}</button></div>`:""}</div>
      <div class="msg-time">${escapeHTML(msg.time||"")}${msg.out&&state.settings.receipts?" · Delivered":""}</div></div>`;
    row.addEventListener("contextmenu",e=>{e.preventDefault();contextMenu(e.clientX,e.clientY,msg)});
    let timer;
    row.addEventListener("touchstart",()=>timer=setTimeout(()=>contextMenu(window.innerWidth/2,Math.min(window.innerHeight-220, row.getBoundingClientRect().top),msg),600),{passive:true});
    row.addEventListener("touchend",()=>clearTimeout(timer),{passive:true});
    messagesEl.appendChild(row);
  });
  messagesEl.scrollTop=messagesEl.scrollHeight;
}
function contextMenu(x,y,msg){
  closeFloating();
  const el=document.createElement("div");el.className="context-menu";
  el.style.left=Math.min(x,innerWidth-165)+"px";el.style.top=Math.min(y,innerHeight-220)+"px";
  el.innerHTML=`<button data-a="react">React</button><button data-a="reply">Reply</button><button data-a="copy">Copy</button><button data-a="edit">Edit</button><button data-a="delete">Delete</button>`;
  document.body.appendChild(el);
  el.onclick=async e=>{
    const a=e.target.dataset.a;if(!a)return;
    if(a==="react"){msg.reaction=msg.reaction?"":"❤️";saveState();renderChat()}
    if(a==="copy"){await navigator.clipboard?.writeText(msg.text);toast("Copied")}
    if(a==="reply"){input.value=`Replying to: ${msg.text}\n`;input.focus();updateSend()}
    if(a==="edit"){const n=prompt("Edit message",msg.text);if(n!==null&&n.trim()){msg.text=n.trim();saveState();renderList();renderChat()}}
    if(a==="delete"){state.conversations[activeId].messages=state.conversations[activeId].messages.filter(x=>x.id!==msg.id);saveState();renderList();renderChat()}
    closeFloating();
  };
}
function closeFloating(){document.querySelectorAll(".context-menu,.attachment-pop").forEach(x=>x.remove())}
document.addEventListener("click",e=>{if(!e.target.closest(".context-menu")&&!e.target.closest(".attachment-pop"))closeFloating()});

function renderNewMessage(){
  let selected=[];
  showModal("New Message",`
    <div class="modal-form">
      <label>Choose contacts</label>
      <div class="contact-grid">${contacts.map(c=>`<button class="contact-choice" data-contact="${c.id}">${avatarHTML(c)}<span class="choice-copy"><strong>${escapeHTML(c.name)}</strong><small>Local contact</small></span></button>`).join("")}</div>
      <label for="groupName">Conversation name <span style="font-weight:400">(optional)</span></label>
      <input id="groupName" placeholder="e.g. Study Group">
      <button class="primary" id="createConversation">Create conversation</button>
    </div>`);
  document.querySelectorAll("[data-contact]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.contact;
    selected=selected.includes(id)?selected.filter(x=>x!==id):[...selected,id];
    b.classList.toggle("selected",selected.includes(id));
  });
  document.getElementById("createConversation").onclick=()=>{
    if(!selected.length)return toast("Choose at least one contact");
    const group=selected.length>1;
    let name=document.getElementById("groupName").value.trim();
    if(!name) name=group?selected.map(id=>contact(id).name).join(", "):contact(selected[0]).name;
    const id="local-"+Date.now();
    state.conversations[id]={id,name,kind:group?"group":"direct",members:selected,pinned:false,muted:false,unread:false,messages:[]};
    saveState();closeModal();openConversation(id);toast("Conversation created");
  };
}

function renderSettings(){
  showModal("Settings",`
    <div class="settings">
      <div class="setting-section"><div class="setting-title">Appearance</div>
        <div class="setting-row"><span>Theme</span><select id="themeSelect"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div>
      </div>
      <div class="setting-section"><div class="setting-title">Messaging</div>
        <label class="setting-row"><span>Enter to send<small>Press Enter to send messages</small></span><input id="enterToggle" type="checkbox"></label>
        <label class="setting-row"><span>Read receipts</span><input id="receiptToggle" type="checkbox"></label>
        <label class="setting-row"><span>Typing indicators</span><input id="typingToggle" type="checkbox"></label>
      </div>
      <div class="setting-section"><div class="setting-title">Storage</div>
        <button class="setting-row danger" id="clearChats"><span>Clear local conversations</span><span>›</span></button>
        <button class="setting-row danger" id="resetApp"><span>Reset CoolSchool</span><span>›</span></button>
      </div>
      <div class="setting-section"><div class="setting-title">About</div>
        <div class="setting-row"><span>CoolSchool<small>Version 1.0 · GitHub Pages static app</small></span><span>ⓘ</span></div>
      </div>
    </div>`);
  const ts=document.getElementById("themeSelect");ts.value=state.settings.theme;
  ts.onchange=()=>{state.settings.theme=ts.value;saveState();applyTheme();};
  const et=document.getElementById("enterToggle");et.checked=state.settings.enter;et.onchange=()=>{state.settings.enter=et.checked;saveState()};
  const rt=document.getElementById("receiptToggle");rt.checked=state.settings.receipts;rt.onchange=()=>{state.settings.receipts=rt.checked;saveState();renderChat()};
  const tt=document.getElementById("typingToggle");tt.checked=state.settings.typing;tt.onchange=()=>{state.settings.typing=tt.checked;saveState()};
  document.getElementById("clearChats").onclick=()=>{if(confirm("Delete all local conversations?")){state.conversations={};saveState();closeModal();activeId=null;renderList();renderChat();app.classList.remove("show-chat");toast("Local conversations cleared")}};
  document.getElementById("resetApp").onclick=()=>{if(confirm("Reset CoolSchool to its demo state?")){localStorage.removeItem(STORAGE);state=loadState();activeId=Object.keys(state.conversations)[0];closeModal();renderList();openConversation(activeId);toast("CoolSchool reset")}};
}

function showModal(title,body){
  document.getElementById("modalTitle").textContent=title;
  document.getElementById("modalBody").innerHTML=body;
  document.getElementById("modalBackdrop").hidden=false;
  document.getElementById("closeModal").focus();
}
function closeModal(){document.getElementById("modalBackdrop").hidden=true}
function toast(text){const t=document.getElementById("toast");t.textContent=text;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),1800)}
function updateSend(){document.getElementById("sendBtn").disabled=!input.value.trim()}
function applyTheme(){
  const theme=state.settings.theme;
  const dark=theme==="dark"||(theme==="system"&&matchMedia("(prefers-color-scheme:dark)").matches);
  document.documentElement.style.colorScheme=dark?"dark":"light";
  if(dark){
    document.documentElement.style.setProperty("--bg","#17171a");document.documentElement.style.setProperty("--panel","#1c1c1f");
    document.documentElement.style.setProperty("--sidebar","#19191c");document.documentElement.style.setProperty("--text","#f3f3f5");
    document.documentElement.style.setProperty("--muted","#9a9aa2");document.documentElement.style.setProperty("--line","#343438");
    document.documentElement.style.setProperty("--incoming","#343438");document.documentElement.style.setProperty("--hover","#2b2b2f");
  }else{
    document.documentElement.style.setProperty("--bg","#f5f5f7");document.documentElement.style.setProperty("--panel","#fff");
    document.documentElement.style.setProperty("--sidebar","#f7f7f9");document.documentElement.style.setProperty("--text","#17171a");
    document.documentElement.style.setProperty("--muted","#777983");document.documentElement.style.setProperty("--line","#dedee3");
    document.documentElement.style.setProperty("--incoming","#e9e9ed");document.documentElement.style.setProperty("--hover","#e9e9ee");
  }
}

document.getElementById("newConversationBtn").onclick=renderNewMessage;
document.getElementById("settingsBtn").onclick=renderSettings;
document.getElementById("closeModal").onclick=closeModal;
document.getElementById("modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal()});
document.getElementById("backBtn").onclick=()=>app.classList.remove("show-chat");
document.getElementById("searchInput").addEventListener("input",e=>{document.getElementById("clearSearch").style.display=e.target.value?"block":"none";renderList()});
document.getElementById("clearSearch").onclick=()=>{document.getElementById("searchInput").value="";document.getElementById("clearSearch").style.display="none";renderList()};
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderList()});
input.addEventListener("input",updateSend);
input.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey&&state.settings.enter){e.preventDefault();document.getElementById("composer").requestSubmit()}
});
document.getElementById("composer").onsubmit=e=>{
  e.preventDefault();
  const text=input.value.trim(),c=state.conversations[activeId];
  if(!text||!c)return;
  c.messages.push(m("me",text,true,new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})));
  input.value="";updateSend();saveState();renderList();renderChat();
};
document.getElementById("emojiBtn").onclick=()=>{
  input.value+=(input.value?" ":"")+"🙂";input.focus();updateSend();
};
document.getElementById("attachBtn").onclick=e=>{
  closeFloating();const p=document.createElement("div");p.className="attachment-pop";p.style.left="15px";p.style.bottom="67px";
  p.innerHTML="<button>📷 Photo (local demo)</button><button>📎 File (local demo)</button>";
  document.body.appendChild(p);p.querySelectorAll("button").forEach(b=>b.onclick=()=>{toast("Attachments are demo-only");closeFloating()});
};
document.getElementById("contactInfoBtn").onclick=()=>{
  const c=state.conversations[activeId];if(!c)return;
  showModal(c.name,`<div class="settings">
    <div class="setting-row"><span>Members<small>${c.kind==="group"?c.members.map(id=>contact(id)?.name).join(", "):contact(c.members[0])?.name}</small></span></div>
    <button class="setting-row" id="pinConv"><span>${c.pinned?"Unpin":"Pin"} conversation</span><span>📌</span></button>
    <button class="setting-row" id="muteConv"><span>${c.muted?"Unmute":"Mute"} notifications</span><span>🔕</span></button>
    <button class="setting-row" id="renameConv"><span>Rename conversation</span><span>✎</span></button>
    <button class="setting-row danger" id="deleteConv"><span>Delete conversation</span><span>⌫</span></button>
  </div>`);
  document.getElementById("pinConv").onclick=()=>{c.pinned=!c.pinned;saveState();closeModal();renderList();toast(c.pinned?"Pinned":"Unpinned")};
  document.getElementById("muteConv").onclick=()=>{c.muted=!c.muted;saveState();closeModal();toast(c.muted?"Muted":"Unmuted")};
  document.getElementById("renameConv").onclick=()=>{const n=prompt("Conversation name",c.name);if(n?.trim()){c.name=n.trim();saveState();closeModal();renderList();renderChat()}};
  document.getElementById("deleteConv").onclick=()=>{if(confirm("Delete this local conversation?")){delete state.conversations[c.id];saveState();closeModal();activeId=Object.keys(state.conversations)[0]||null;renderList();renderChat();app.classList.remove("show-chat")}};
};
document.getElementById("headerMoreBtn").onclick=()=>document.getElementById("contactInfoBtn").click();

matchMedia("(prefers-color-scheme:dark)").addEventListener?.("change",()=>{if(state.settings.theme==="system")applyTheme()});
applyTheme();renderList();if(activeId)renderChat();
