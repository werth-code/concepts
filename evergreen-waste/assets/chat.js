/* Ask Evergreen — scripted demo assistant (no API key, safe on a static page).
   A live demo of the kind of AI Werth Design would build for Evergreen. */
(function () {
  "use strict";
  var root = document.getElementById("eg");
  var log = document.getElementById("eg-log");
  var quick = document.getElementById("eg-quick");
  var form = document.getElementById("eg-form");
  var input = document.getElementById("eg-input");
  if (!root) return;

  var started = false;
  var flow = { active: false, step: null, zip: "", plan: "", name: "" };
  var PHONE = '<a href="tel:+13026357055">302-635-7055</a>';
  var MAIL = '<a href="mailto:cs@evergreenws.com">cs@evergreenws.com</a>';
  var DEFAULT = ["Do you serve my area?", "Start service", "Bin sizes", "Is my trash delayed?"];
  var NCC = ["197", "198"]; // New Castle County DE ZIP prefixes

  function esc(s){return (s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function fmt(t){return t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");}
  function add(who, html){var d=document.createElement("div");d.className="eg-msg "+(who==="user"?"eg-user":"eg-bot");d.innerHTML=html;log.appendChild(d);log.scrollTop=log.scrollHeight;}
  function bot(t){add("bot", fmt(t));}
  function chips(arr){quick.innerHTML="";(arr||[]).forEach(function(c){var b=document.createElement("button");b.className="eg-chip";b.type="button";b.textContent=c;b.addEventListener("click",function(){handle(c);});quick.appendChild(b);});requestAnimationFrame(function(){log.scrollTop=log.scrollHeight;});}

  function isDesktop(){ return window.matchMedia("(min-width:601px)").matches; }
  // Keep the mobile panel fitted to the *visible* viewport so it never drifts under the
  // URL bar or the keyboard.
  function fitPanel(){
    var p = root.querySelector(".eg-panel"); if(!p) return;
    if(window.visualViewport && !isDesktop() && root.classList.contains("open")){
      p.style.height = window.visualViewport.height + "px";
    } else { p.style.height = ""; }
  }
  if(window.visualViewport){ window.visualViewport.addEventListener("resize", fitPanel); window.visualViewport.addEventListener("scroll", fitPanel); }

  window.egOpen = function(){
    root.classList.add("open");
    fitPanel();
    if(input && isDesktop()) input.focus();   // don't auto-pop the keyboard on mobile — wait for a tap
    if(!started){ started=true;
      bot("Hi! I'm Evergreen's assistant 🌲 I can check your area, size a bin, **start new service**, or answer billing and schedule questions — day or night. What do you need?");
      chips(DEFAULT);
    }
  };
  window.egClose = function(){ root.classList.remove("open"); var p=root.querySelector(".eg-panel"); if(p) p.style.height=""; };

  var KB = [
    { k:["area","serve","my street","zip","where do you","coverage","near me","wilmington","newark","bear","middletown"], a:"We serve **New Castle County, Delaware** — Wilmington, Newark, Bear, New Castle, Middletown and nearby. Tell me your ZIP and I'll confirm, or use the checker at the top of the page.", c:["Start service","Bin sizes","Talk to a person"] },
    { k:["bin","cart","size","how big","gallon"], a:"We offer a few **cart sizes** for both trash and recycling (green lid = trash, yellow = recycling), so you get the right fit for your home. Need a commercial dumpster or a roll-off? I can size that too.", c:["Start service","Roll-off dumpster","Commercial"] },
    { k:["price","pricing","cost","how much","rate","plan","monthly","quarterly","yearly","pay ahead","afford"], a:"Residential service comes in **flexible plans — monthly, quarterly, or yearly** (paying ahead saves the most). Your exact rate depends on your area and cart size; I can get you a quick quote. Want to start?", c:["Start service","Do you serve my area?"] },
    { k:["holiday","delay","schedule","this week","pickup day","when is","normal schedule"], a:"Good question — holidays can shift pickup by a day. **Right now we're on our normal schedule this week — no delays.** I always keep this current, so ask me anytime “is my trash delayed?”", c:["Start service","Talk to a person"] },
    { k:["bill","pay","payment","invoice","account","autopay","manage"], a:"You can manage **billing online anytime** and choose monthly, quarterly, or yearly. For anything specific, our billing team is at "+PHONE+" or "+MAIL+".", c:["Start service","Talk to a person"] },
    { k:["commercial","business","store","restaurant","office","front load","front-load"], a:"For businesses we run **front-load dumpster service** sized to your volume — clean, reliable, eco-friendly. Tell me your business type and I'll point you the right way, or start a commercial quote.", c:["Get a quote","Do you serve my area?"] },
    { k:["roll","roll-off","rolloff","dumpster","remodel","construction","project","cleanout"], a:"**Roll-off dumpsters** are perfect for remodels and big cleanouts — several sizes to fit the job and your driveway. What's the project? I'll suggest a size.", c:["Start service","Talk to a person"] },
    { k:["junk","haul","removal","furniture","appliance","get rid"], a:"Our **junk removal** team does the heavy lifting — you point, we haul. Great for cleanouts and single big items. Want a quote?", c:["Book a haul","Bulk & metal"] },
    { k:["shred","paper","document","confidential","proshred"], a:"We offer **secure paper shredding** to safely destroy sensitive documents — one-time purge or a recurring schedule. Which fits?", c:["Start service","Talk to a person"] },
    { k:["bulk","metal","large item","mattress","couch","scrap"], a:"**Bulk & metal** pickup handles large household items and metal — many items at **no extra cost**. Tell me the item and I'll confirm, or check our bulk list.", c:["Start service","Junk removal"] },
    { k:["hour","open","call","phone","contact","email","reach","address"], a:"Reach our office **Mon–Fri 8:30am–4:30pm** at "+PHONE+" or "+MAIL+" — 619 Lambson Ln, New Castle, DE. And I'm here **24/7** for quick answers.", c:["Start service","Do you serve my area?"] },
    { k:["human","person","representative","agent","someone","talk to","speak to"], a:"Happy to connect you — our team is at "+PHONE+" (Mon–Fri 8:30–4:30) or "+MAIL+". Want me to take your info for a callback?", c:["Start service","Do you serve my area?"] },
    { k:["are you real","are you a bot","are you human","are you ai","real person","chatgpt","who are you","is this a bot"], a:"I'm Evergreen's assistant — a **live demo** of the kind of AI **Werth Design** builds. On the real site I'd be connected to Evergreen's system to answer in their voice and **start service 24/7**.", c:["Start service","Do you serve my area?"] }
  ];

  function startFlow(){ flow={active:true,step:"zip",zip:"",plan:"",name:""}; bot("Let's get you started! 🌲 First — what's your **ZIP code**?"); chips([]); }

  function flowStep(text){
    var t=(text||"").trim();
    if(flow.step==="zip"){
      var m=t.match(/\d{5}/);
      if(!m){ bot("Just need a 5-digit ZIP to check your area 🙂"); return; }
      var z=m[0];
      if(NCC.indexOf(z.slice(0,3))>-1){ flow.zip=z; flow.step="plan"; bot("✓ **"+z+" is in our service area!** Which plan works best — **monthly, quarterly, or yearly**?"); chips(["Monthly","Quarterly","Yearly"]); }
      else{ flow.active=false; bot("That ZIP looks outside our current New Castle County area. Give us a call at "+PHONE+" and we'll help or point you somewhere good."); chips(DEFAULT); }
      return;
    }
    if(flow.step==="plan"){ flow.plan=t.toLowerCase(); flow.step="contact"; bot("Great choice — **"+flow.plan+"** it is. Last step: your **name and best phone number**, and we'll confirm and schedule your bins."); chips([]); return; }
    if(flow.step==="contact"){
      flow.name=((t.split(/[,\d]/)[0]||"").trim())||"there"; flow.active=false;
      bot("You're all set, **"+flow.name+"**! ✅ A real Evergreen teammate will confirm your "+flow.plan+" plan for **"+flow.zip+"** and get your carts scheduled — often before your next pickup day. 🌲");
      setTimeout(function(){ bot("(This is a demo of the assistant Werth Design would build — on the live site, this books your start instantly.)"); chips(DEFAULT); }, 650);
      return;
    }
  }

  function handle(text){
    text=(text||"").trim(); if(!text) return;
    add("user", esc(text));
    if(flow.active){ flowStep(text); return; }
    var low=text.toLowerCase();
    if(/\b(start|sign\s?up|new service|get started|switch|become a customer)\b/.test(low)){ startFlow(); return; }
    var hit=null;
    for(var i=0;i<KB.length && !hit;i++){ for(var j=0;j<KB[i].k.length;j++){ if(low.indexOf(KB[i].k[j])>-1){ hit=KB[i]; break; } } }
    if(hit){ bot(hit.a); chips(hit.c||DEFAULT); }
    else{ bot("I can help with service area, bin sizes, starting service, pricing, billing, holiday schedules, roll-offs, junk removal, shredding and bulk pickup. What are you after? You can also reach the office at "+PHONE+"."); chips(DEFAULT); }
  }

  form.addEventListener("submit", function(e){ e.preventDefault(); var v=input.value; input.value=""; handle(v); });
})();
