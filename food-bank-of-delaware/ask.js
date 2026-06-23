/* "Ask the Food Bank" — scripted demo assistant (concept by Werth Design).
   Self-contained: injects its own styles + markup. No API key — safe on a static page.
   Shows how one assistant can route the Food Bank's three audiences (neighbors, donors,
   volunteers) 24/7. window.Ask.open(seed) / .close(). */
(function () {
  "use strict";
  var GREEN_DK = "#123c1f", GOLD = "#f0a81a";

  var css = `
  .ask-launch{position:fixed;right:20px;bottom:20px;z-index:9000;display:inline-flex;align-items:center;gap:.5em;
    background:${GOLD};color:${GREEN_DK};font-family:"Sora",sans-serif;font-weight:700;font-size:.9rem;
    border:none;border-radius:100px;padding:.85em 1.25em;cursor:pointer;box-shadow:0 14px 30px -10px rgba(0,0,0,.45)}
  .ask-launch:hover{transform:translateY(-2px)}
  .ask-launch .dot{width:8px;height:8px;border-radius:50%;background:#2f9e5f;box-shadow:0 0 0 0 rgba(47,158,95,.6);animation:askpulse 2.2s infinite}
  @keyframes askpulse{70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
  .ask-panel{position:fixed;right:20px;bottom:20px;z-index:9001;width:min(380px,calc(100vw - 2rem));max-height:min(560px,78vh);
    display:none;flex-direction:column;background:#f7f5ee;border-radius:16px;overflow:hidden;
    box-shadow:0 40px 80px -28px rgba(0,0,0,.5);font-family:"Plus Jakarta Sans",sans-serif}
  .ask-open .ask-panel{display:flex}.ask-open .ask-launch{display:none}
  .ask-head{display:flex;align-items:center;gap:.7rem;padding:.85rem 1rem;background:${GREEN_DK};color:#fff}
  .ask-av{width:36px;height:36px;border-radius:50%;background:${GOLD};color:${GREEN_DK};display:grid;place-items:center;font-family:"Sora";font-weight:700}
  .ask-id b{font-family:"Sora";font-size:1rem;display:flex;align-items:center;gap:.4em}
  .ask-badge{font-size:.55rem;letter-spacing:.12em;text-transform:uppercase;color:${GOLD};border:1px solid rgba(240,168,26,.5);border-radius:100px;padding:.15em .5em}
  .ask-id span{font-size:.72rem;color:#cfe0c9}
  .ask-x{margin-left:auto;background:none;border:none;color:#cfe0c9;font-size:1.3rem;cursor:pointer;line-height:1}
  .ask-log{flex:1 1 auto;min-height:0;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.6rem}
  .ask-msg{max-width:86%;padding:.6rem .85rem;border-radius:14px;font-size:.93rem;line-height:1.45;animation:askin .25s ease both}
  @keyframes askin{from{opacity:0;transform:translateY(6px)}}
  .ask-bot{align-self:flex-start;background:#fff;border:1px solid rgba(26,42,29,.1);border-bottom-left-radius:4px}
  .ask-bot b{color:${GREEN_DK}} .ask-bot a{color:#2f8a3e;text-decoration:underline}
  .ask-user{align-self:flex-end;background:#2f8a3e;color:#fff;border-bottom-right-radius:4px}
  .ask-typing{display:inline-flex;gap:4px}.ask-typing i{width:7px;height:7px;border-radius:50%;background:#9fb39a;animation:askb 1.1s infinite}.ask-typing i:nth-child(2){animation-delay:.15s}.ask-typing i:nth-child(3){animation-delay:.3s}
  @keyframes askb{30%{transform:translateY(-3px);opacity:.5}}
  .ask-quick{display:flex;flex-wrap:wrap;gap:.4rem;padding:.4rem 1rem}
  .ask-chip{font-family:"Sora";font-size:.74rem;border:1px solid rgba(26,42,29,.16);background:#fff;border-radius:100px;padding:.4em .8em;cursor:pointer}
  .ask-chip:hover{border-color:#2f8a3e;color:#2f8a3e}
  .ask-form{display:flex;gap:.5rem;padding:.6rem .8rem;border-top:1px solid rgba(26,42,29,.1)}
  .ask-form input{flex:1;font-family:inherit;font-size:.92rem;padding:.6em .9em;border:1px solid rgba(26,42,29,.16);border-radius:100px}
  .ask-form input:focus{outline:none;border-color:#2f8a3e}
  .ask-send{width:40px;height:40px;border:none;border-radius:50%;background:#2f8a3e;color:#fff;font-size:1.1rem;cursor:pointer}
  .ask-foot{font-family:"Sora";font-size:.58rem;text-align:center;color:#6c7a66;padding:.1rem 1rem .6rem}`;
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var root = document.getElementById("ask") || document.body;
  root.innerHTML = `
    <button class="ask-launch" id="askLaunch"><span class="dot"></span> Ask the Food Bank</button>
    <section class="ask-panel" role="dialog" aria-label="Ask the Food Bank">
      <header class="ask-head">
        <span class="ask-av">F</span>
        <div class="ask-id"><b>Foodie <span class="ask-badge">AI demo</span></b><span>● The Food Bank's helper</span></div>
        <button class="ask-x" id="askX" aria-label="Close">×</button>
      </header>
      <div class="ask-log" id="askLog"></div>
      <div class="ask-quick" id="askQuick"></div>
      <form class="ask-form" id="askForm" autocomplete="off"><input id="askIn" placeholder="Ask about food, giving, volunteering…" /><button class="ask-send" aria-label="Send">➤</button></form>
      <p class="ask-foot">A concept assistant by Werth Design — a preview of what the Food Bank could offer.</p>
    </section>`;

  var el = {root:document.getElementById("ask")||document.querySelector(".ask-launch").parentNode,
    launch:document.getElementById("askLaunch"),x:document.getElementById("askX"),
    log:document.getElementById("askLog"),quick:document.getElementById("askQuick"),
    form:document.getElementById("askForm"),input:document.getElementById("askIn")};
  // the .ask-open class toggles on a wrapper; use document.body-level wrapper
  var wrap = document.createElement("div"); // not needed; toggle on a known ancestor
  function setOpen(o){ document.documentElement.classList.toggle("ask-open",o); }

  var GREET="Hi! I'm <b>Foodie</b>, the Food Bank's helper. I can help you <b>find food</b>, <b>donate</b>, <b>volunteer</b>, or <b>order catering</b>. What do you need today?";
  var CHIPS=["Find food near me","How do I donate?","I want to volunteer","Order catering"];
  var KB=[
    {k:["find food","get food","need food","hungry","pantry","get help","help","food near"],a:"You're in the right place — and it's free, no appointment needed. Use the <a href='#find-food'>Find Food tool</a> above, or tell me your ZIP and I'll point you to the closest pantry or mobile-pantry stop.",c:["My ZIP is 19801","Do I qualify?","Mobile pantry?"]},
    {k:["19801","19713","19963","zip","19","near"],a:"Great — pop that ZIP into the <a href='#find-food'>Find Food tool</a> and it'll list the nearest pantries with hours. Everything's free and open to all Delawareans. Want help with anything else?",c:["How do I donate?","I want to volunteer"]},
    {k:["qualify","eligible","income","snap","afford"],a:"There's no income test to get food at our pantries — if you need a hand, you're welcome. We can also help you apply for <b>SNAP</b> if you'd like. Want me to connect you?",c:["Find food near me","Yes, SNAP help"]},
    {k:["donate","give","gift","money","contribute","support"],a:"Thank you — that means meals on tables. <b>$1 = 3 meals.</b> Use the <a href='#give'>impact calculator</a> to see your gift in meals, and you can give once or monthly. Even $10 is 30 meals.",c:["Give monthly","Order catering instead"]},
    {k:["monthly","recurring","every month","serving hope"],a:"Monthly giving (our <b>Serving Hope Club</b>) is the steadiest way to help — set it once and feed neighbors all year. The <a href='#give'>calculator</a> has a monthly toggle.",c:["Find food near me","I want to volunteer"]},
    {k:["volunteer","help out","shift","pack","sort","give time"],a:"We'd love the hand! Volunteers pack meals, sort donated food, and staff pantries. Pick a <a href='#volunteer'>shift online</a> and we'll text you a reminder so you never miss it.",c:["How do I donate?","Find food near me"]},
    {k:["catering","cater","platter","lunch","event","office","order food"],a:"Yes! Our <b>culinary-training students</b> cater platters, boxed lunches, salads and more — and <b>every order funds a scholarship</b>. I can start an <a href='#catering'>online order</a> for your next meeting or event.",c:["See the menu","How do I donate?"]},
    {k:["menu","price","cost","how much cater"],a:"A few favorites: deli platter $11.95/person, boxed lunch $13.95/person, FBD chopped salad, fresh fruit, cookies &amp; brownies. Delivery &amp; setup available. Want to <a href='#catering'>start an order</a>?",c:["Order catering","I want to volunteer"]},
    {k:["where","location","address","newark","milford","contact","phone","call"],a:"We're in <b>Newark</b> (222 Lake Drive) and <b>Milford</b> (102 DE Veterans Blvd.). Call (302) 292-1305 or email foodbank@fbd.org. Which one's closer to you?",c:["Find food near me","How do I donate?"]},
    {k:["spanish","español","language"],a:"¡Claro! En la versión real puedo ayudarte en español también — encontrar comida, donar o ser voluntario. (This bilingual support is part of what the full assistant would do.)",c:["Find food near me","Donate"]},
    {k:["who are you","real","demo","bot","ai","how do you work","is this real"],a:"Good question — I'm a <b>concept demo</b> built by Werth Design to show the Food Bank what an 'Ask the Food Bank' helper could do: answer questions and route neighbors, donors, and volunteers <b>24/7, in English and Spanish</b>, so no one falls through the cracks.",c:["Find food near me","How do I donate?"]}
  ];

  function add(who,html){var d=document.createElement("div");d.className="ask-msg ask-"+who;d.innerHTML=html;el.log.appendChild(d);el.log.scrollTop=el.log.scrollHeight;return d}
  function typing(){var d=document.createElement("div");d.className="ask-msg ask-bot ask-typing";d.innerHTML="<i></i><i></i><i></i>";el.log.appendChild(d);el.log.scrollTop=el.log.scrollHeight;return d}
  function chips(list){el.quick.innerHTML="";(list||CHIPS).forEach(function(t){var b=document.createElement("button");b.className="ask-chip";b.textContent=t;b.onclick=function(){handle(t)};el.quick.appendChild(b)})}
  function botSay(html,c){var t=typing();setTimeout(function(){t.remove();add("bot",html);chips(c)},520+Math.min(html.length*5,700))}
  var started=false;
  function start(){if(started)return;started=true;botSay(GREET,CHIPS)}
  function match(t){t=t.toLowerCase();var best=null,bs=0;KB.forEach(function(i){var s=0;i.k.forEach(function(k){if(t.indexOf(k)!==-1)s+=k.length>4?2:1});if(s>bs){bs=s;best=i}});return bs>0?best:null}
  function handle(text){text=(text||"").trim();if(!text)return;add("user",text.replace(/</g,"&lt;"));el.quick.innerHTML="";var m=match(text);if(m)botSay(m.a,m.c||CHIPS);else botSay("I can help with <b>finding food</b>, <b>donating</b>, <b>volunteering</b>, or <b>catering</b> — which of those can I point you to?",CHIPS)}

  function open(seed){setOpen(true);start();setTimeout(function(){el.input.focus()},150);
    if(seed==='giveBtn')setTimeout(function(){handle('How do I donate?')},300);
    if(seed==='cateringBtn')setTimeout(function(){handle('Order catering')},300);
    if(seed==='volBtn')setTimeout(function(){handle('I want to volunteer')},300);}
  function close(){setOpen(false)}
  el.launch.onclick=function(){open()};el.x.onclick=close;
  el.form.onsubmit=function(e){e.preventDefault();var v=el.input.value;el.input.value="";handle(v)};
  document.addEventListener("keydown",function(e){if(e.key==="Escape")close()});
  window.Ask={open:open,close:close};
})();
