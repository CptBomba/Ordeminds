async function me(){ try{const r=await fetch("/api/me"); return await r.json();}catch{return {user:null}} }
function qs(s){return document.querySelector(s)}
function ce(tag,cls){const e=document.createElement(tag); if(cls) e.className=cls; return e}
document.addEventListener("click",e=>{ if(e.target.closest(".dropdown .pill")){ e.preventDefault(); e.target.closest(".dropdown").classList.toggle("open"); } else { document.querySelectorAll(".dropdown.open").forEach(d=>d.classList.remove("open")); } });

async function renderNav(){
  const {user}=await me();
  const loginBtns = document.querySelectorAll("[data-role='loginBtn']");
  const acc = document.getElementById("account");
  if(user){
    loginBtns.forEach(b=>b.remove());
    acc.innerHTML = `<div class="dropdown"><a href="#" class="pill"><img class="avatar" id="navAvatar" src="/api/user/avatar?ts=${Date.now()}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22><circle cx=%2216%22 cy=%2216%22 r=%2216%22 fill=%22%231AC6B2%22/></svg>'"/><span>${user.name||user.email}</span></a>
    <div class="menu">
      <a href="/app">Painel</a>
      <a href="/agenda">Agenda</a>
      <a href="/tasks">Tarefas</a>
      <a href="/shopping">Compras</a>
      <a href="/bills">Contas</a>
      <a href="/reports">Relatórios</a>
      <a href="/profile">Perfil</a>
      <form method="POST" action="/logout"><button>Sair</button></form>
    </div></div>`;
  }
}
document.addEventListener("DOMContentLoaded",renderNav);

async function drawMonthCalendar(rootId, year, month){
  const root=document.getElementById(rootId); if(!root) return;
  root.innerHTML=""; const header=ce("div","row"); const title=ce("h3"); header.appendChild(title);
  const prev=ce("button","btn"); prev.textContent=""; prev.style.marginLeft="auto";
  const next=ce("button","btn"); next.textContent="";
  header.appendChild(prev); header.appendChild(next); root.appendChild(header);
  const grid=ce("div","calendar"); root.appendChild(grid);
  async function render(y,m){
    grid.innerHTML=""; const dFirst=new Date(y,m,1); const dLast=new Date(y,m+1,0);
    const pt=["D","S","T","Q","Q","S","S"]; pt.forEach(d=>{const h=ce("div","hd"); h.textContent=d; grid.appendChild(h);});
    const pad=dFirst.getDay(); for(let i=0;i<pad;i++){const c=ce("div","cell"); c.style.opacity=.25; grid.appendChild(c);}
    const from=new Date(y,m,1).toISOString(); const to=new Date(y,m+1,0,23,59,59,999).toISOString();
    let events=[]; try{const r=await fetch(`/api/events?from=${from}&to=${to}`); if(r.ok) events=await r.json();}catch{}
    title.textContent = new Date(y,m,1).toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
    for(let day=1; day<=dLast.getDate(); day++){ const c=ce("div","cell"); c.textContent=day;
      const has = events.some(e => new Date(e.start_at).getDate()===day);
      if(has){ const dot=ce("span","dot"); c.appendChild(dot); c.title="Há eventos"; }
      grid.appendChild(c);
    }
  }
  await render(year, month);
  prev.onclick=()=>{ const d=new Date(year,month-1,1); year=d.getFullYear(); month=d.getMonth(); render(year,month); };
  next.onclick=()=>{ const d=new Date(year,month+1,1); year=d.getFullYear(); month=d.getMonth(); render(year,month); };
}
