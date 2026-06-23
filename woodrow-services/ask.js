/* "Woody" — scripted demo assistant for the Woodrow Services concept (by Werth Design).
   Self-contained, no API key. Shows a 24/7 book-me / after-hours-capture helper. */
(function () {
  "use strict";
  var NAVY = "#0c1838", ORANGE = "#f47b20";

  var css = `
  .ask-launch{position:fixed;right:20px;bottom:20px;z-index:9000;display:inline-flex;align-items:center;gap:.5em;
    background:${ORANGE};color:#fff;font-family:"Archivo",sans-serif;font-weight:700;font-size:.9rem;
    border:none;border-radius:100px;padding:.85em 1.25em;cursor:pointer;box-shadow:0 14px 30px -10px rgba(0,0,0,.45)}
  .ask-launch:hover{transform:translateY(-2px)}
  .ask-launch .dot{width:8px;height:8px;border-radius:50%;background:#7CFC9A;box-shadow:0 0 0 0 rgba(124,252,154,.6);animation:askpulse 2.2s infinite}
  @keyframes askpulse{70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
  .ask-panel{position:fixed;right:20px;bottom:20px;z-index:9001;width:min(380px,calc(100vw - 2rem));max-height:min(560px,78vh);
    padding:0;display:none;flex-direction:column;background:#f5f8fc;border-radius:16px;overflow:hidden;
    box-shadow:0 40px 80px -28px rgba(0,0,0,.5);font-family:"Public Sans",sans-serif}
  .ask-open .ask-panel{display:flex}.ask-open .ask-launch{display:none}
  .ask-head{display:flex;align-items:center;gap:.7rem;padding:.85rem 1rem;background:${NAVY};color:#fff}
  .ask-av{width:36px;height:36px;border-radius:50%;background:${ORANGE};color:#fff;display:grid;place-items:center;font-family:"Archivo";font-weight:800}
  .ask-id b{font-family:"Archivo";font-size:1rem;display:flex;align-items:center;gap:.4em}
  .ask-badge{font-size:.55rem;letter-spacing:.12em;text-transform:uppercase;color:${ORANGE};border:1px solid rgba(244,123,32,.5);border-radius:100px;padding:.15em .5em}
  .ask-id span{font-size:.72rem;color:#aebbd8}
  .ask-x{margin-left:auto;background:none;border:none;color:#aebbd8;font-size:1.3rem;cursor:pointer;line-height:1}
  .ask-log{flex:1 1 auto;min-height:0;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.6rem}
  .ask-msg{max-width:86%;padding:.6rem .85rem;border-radius:14px;font-size:.93rem;line-height:1.45;animation:askin .25s ease both}
  @keyframes askin{from{opacity:0;transform:translateY(6px)}}
  .ask-bot{align-self:flex-start;background:#fff;border:1px solid rgba(23,32,51,.1);border-bottom-left-radius:4px}
  .ask-bot b{color:${NAVY}} .ask-bot a{color:#2a72c0;text-decoration:underline}
  .ask-user{align-self:flex-end;background:#15296e;color:#fff;border-bottom-right-radius:4px}
  .ask-typing{display:inline-flex;gap:4px}.ask-typing i{width:7px;height:7px;border-radius:50%;background:#9fb;background:#9aa6c0;animation:askb 1.1s infinite}.ask-typing i:nth-child(2){animation-delay:.15s}.ask-typing i:nth-child(3){animation-delay:.3s}
  @keyframes askb{30%{transform:translateY(-3px);opacity:.5}}
  .ask-quick{display:flex;flex-wrap:wrap;gap:.4rem;padding:.4rem 1rem}
  .ask-chip{font-family:"Archivo";font-size:.74rem;border:1px solid rgba(23,32,51,.16);background:#fff;border-radius:100px;padding:.4em .8em;cursor:pointer}
  .ask-chip:hover{border-color:${ORANGE};color:${ORANGE}}
  .ask-form{display:flex;gap:.5rem;padding:.6rem .8rem;border-top:1px solid rgba(23,32,51,.1)}
  .ask-form input{flex:1;font-family:inherit;font-size:.92rem;padding:.6em .9em;border:1px solid rgba(23,32,51,.16);border-radius:100px}
  .ask-form input:focus{outline:none;border-color:${ORANGE}}
  .ask-send{width:40px;height:40px;border:none;border-radius:50%;background:${ORANGE};color:#fff;font-size:1.1rem;cursor:pointer}
  .ask-foot{font-family:"Archivo";font-size:.58rem;text-align:center;color:#7a8398;padding:.1rem 1rem .6rem}`;
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var root = document.getElementById("ask") || document.body;
  root.innerHTML = `
    <button class="ask-launch" id="askLaunch"><span class="dot"></span> Book / ask us</button>
    <section class="ask-panel" role="dialog" aria-label="Ask Woodrow Services">
      <header class="ask-head"><span class="ask-av">W</span>
        <div class="ask-id"><b>Woody <span class="ask-badge">AI demo</span></b><span>● Woodrow Services · here 24/7</span></div>
        <button class="ask-x" id="askX" aria-label="Close">×</button></header>
      <div class="ask-log" id="askLog"></div>
      <div class="ask-quick" id="askQuick"></div>
      <form class="ask-form" id="askForm" autocomplete="off"><input id="askIn" placeholder="Book a repair, get an estimate…" /><button class="ask-send" aria-label="Send">➤</button></form>
      <p class="ask-foot">A concept assistant by Werth Design — a preview of what Woodrow could offer.</p>
    </section>`;

  var el = {launch:document.getElementById("askLaunch"),x:document.getElementById("askX"),
    log:document.getElementById("askLog"),quick:document.getElementById("askQuick"),
    form:document.getElementById("askForm"),input:document.getElementById("askIn")};
  function setOpen(o){document.documentElement.classList.toggle("ask-open",o)}

  var GREET="Hi! I'm <b>Woody</b>, the Woodrow Services assistant. I can <b>book a repair</b>, set up a <b>free estimate</b>, or answer a quick question — even after hours. What's going on?";
  var CHIPS=["Book a repair","No heat / no AC","Free estimate","Service area"];
  var KB=[
    {k:["book","schedule","appointment","service","come out","fix","repair","set up"],a:"Happy to get you on the schedule. Use the <a href='#request'>Request Service</a> form above (about 20 seconds), or tell me your name, number, and what's wrong — we'll text you back fast, usually within the hour.",c:["No heat / no AC","Free estimate"]},
    {k:["emergency","no heat","no ac","no air","after hours","tonight","night","urgent","asap","leak","flood","burst","right now"],a:"That's an emergency — and yes, <b>we answer after hours</b>. Start a <a href='#request'>service request</a> now and we'll get right back to you, day or night. Is it heating, cooling, or plumbing?",c:["It's heating","It's the AC","It's plumbing"]},
    {k:["estimate","quote","price","cost","how much","financing","afford","payment"],a:"Estimates are <b>free</b>, and we offer <b>financing</b> on new systems. Tell me what you need (heating, cooling, or plumbing) and we'll get you a number — no obligation.",c:["Heating","Cooling","Plumbing"]},
    {k:["heat","furnace","heat pump","boiler","heating","cold","oil","gas"],a:"We do it all — gas &amp; oil furnaces, heat pumps, boilers, mini-splits, radiant. Repair, install, or replace. Want me to book a visit?",c:["Book a repair","Free estimate"]},
    {k:["ac","cool","cooling","air condition","hot","mini split","mini-split"],a:"AC repair, tune-ups, and full replacements on any make or model — and in a heat wave we run same-day when we can. Want to get on the schedule?",c:["Book a repair","Free estimate"]},
    {k:["plumb","water heater","toilet","drain","faucet","sink","pipe","water"],a:"Leaks, water heaters, fixtures, and high-efficiency upgrades — we handle it. Want to get on the schedule?",c:["Book a repair","Free estimate"]},
    {k:["area","where","serve","wilmington","newark","bear","hockessin","new castle","town","zip","county"],a:"We serve Wilmington and all of <b>New Castle County</b> — Newark, Bear, New Castle, Hockessin and more. What town are you in?",c:["Book a repair","No heat / no AC"]},
    {k:["hours","open","24","when","available","weekend"],a:"We're available <b>24/7</b>, including after hours for emergencies. Send a <a href='#request'>request</a> any time and we'll get right back to you.",c:["No heat / no AC","Book a repair"]},
    {k:["brand","carrier","trane","lennox","bryant","rheem","daikin","mitsubishi","make","model"],a:"We service every major brand — Carrier, Trane, Lennox, Bryant, Rheem, Daikin, Mitsubishi, American Standard and more. What system do you have?",c:["Book a repair","Free estimate"]},
    {k:["who","demo","real","bot","ai","how do you work","is this real","third generation","family"],a:"Fair question — I'm a <b>concept demo</b> by Werth Design, showing what a real 'book me 24/7' helper could do for Woodrow: schedule repairs, capture the after-hours emergencies that usually go to voicemail, and answer questions so no job slips away.",c:["Book a repair","Free estimate"]}
  ];

  function add(w,h){var d=document.createElement("div");d.className="ask-msg ask-"+w;d.innerHTML=h;el.log.appendChild(d);el.log.scrollTop=el.log.scrollHeight;return d}
  function typing(){var d=document.createElement("div");d.className="ask-msg ask-bot ask-typing";d.innerHTML="<i></i><i></i><i></i>";el.log.appendChild(d);el.log.scrollTop=el.log.scrollHeight;return d}
  function chips(l){el.quick.innerHTML="";(l||CHIPS).forEach(function(t){var b=document.createElement("button");b.className="ask-chip";b.textContent=t;b.onclick=function(){handle(t)};el.quick.appendChild(b)})}
  function botSay(h,c){var t=typing();setTimeout(function(){t.remove();add("bot",h);chips(c)},520+Math.min(h.length*5,700))}
  var started=false;function start(){if(started)return;started=true;botSay(GREET,CHIPS)}
  function match(t){t=t.toLowerCase();var b=null,bs=0;KB.forEach(function(i){var s=0;i.k.forEach(function(k){if(t.indexOf(k)!==-1)s+=k.length>4?2:1});if(s>bs){bs=s;b=i}});return bs>0?b:null}
  function handle(t){t=(t||"").trim();if(!t)return;add("user",t.replace(/</g,"&lt;"));el.quick.innerHTML="";var m=match(t);if(m)botSay(m.a,m.c||CHIPS);else botSay("I can help you <b>book a repair</b>, get a <b>free estimate</b>, or handle an <b>after-hours emergency</b> — which one?",CHIPS)}

  function open(seed){setOpen(true);start();setTimeout(function(){el.input.focus()},150);if(seed==='book')setTimeout(function(){handle('Book a repair')},300)}
  function close(){setOpen(false)}
  el.launch.onclick=function(){open()};el.x.onclick=close;
  el.form.onsubmit=function(e){e.preventDefault();var v=el.input.value;el.input.value="";handle(v)};
  document.addEventListener("keydown",function(e){if(e.key==="Escape")close()});
  window.Ask={open:open,close:close};
})();
