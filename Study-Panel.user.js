// ==UserScript==
// @name         Study Panel
// @namespace    personal.study-panel
// @version      1.0.0
// @description  Ask about selected or pasted text, with saved display settings.
// @match        https://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-idle
// @noframes
// ==/UserScript==

(()=>{'use strict';
 const defaults={sites:'deltamath.com',backend:'',token:'',display:'discreet',corner:'right',font:15,opacity:100,mode:'explain'};
 let saved=GM_getValue('study-panel-settings',{});if(!saved||typeof saved!=='object')saved={};
 let cfg={...defaults,...saved},host,root,open=false,lastSelection='',pending=null;
 const allowed=()=>String(cfg.sites).split(/[\s,]+/).filter(Boolean).some(x=>location.hostname===x||location.hostname.endsWith('.'+x));
 function persist(){GM_setValue('study-panel-settings',cfg)}
 function endpoint(){const u=new URL(cfg.backend);if(u.username||u.password||u.search||u.hash)throw Error('Use the backend’s base URL without a password, query, or fragment.');if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw Error('Use an HTTPS backend URL.');return u.origin+'/ask'}
 function el(tag,attrs={},text=''){const x=document.createElement(tag);for(const[k,v]of Object.entries(attrs))x.setAttribute(k,v);x.textContent=text;return x}
 function show(settings=false){if(!host)mount();open=true;root.querySelector('.panel').hidden=false;root.querySelector('.bubble').hidden=true;if(settings)tab('settings');}
 function hide(){if(!root)return;open=false;root.querySelector('.panel').hidden=true;root.querySelector('.bubble').hidden=cfg.display==='hidden'||!allowed();}
 function tab(name){root.querySelector('#chat').hidden=name!=='chat';root.querySelector('#settings').hidden=name!=='settings';root.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-selected',String(x.dataset.tab===name)))}
 function style(){host.style.setProperty('left',cfg.corner==='left'?'16px':'auto','important');host.style.setProperty('right',cfg.corner==='right'?'16px':'auto','important');root.querySelector('.panel').style.opacity=String(Math.min(100,Math.max(45,Number(cfg.opacity)||100))/100);root.querySelector('.panel').style.fontSize=Math.min(22,Math.max(12,Number(cfg.font)||15))+'px';}
 function mount(){
  host=el('div');host.style.cssText='all:initial!important;position:fixed!important;bottom:16px!important;z-index:2147483647!important;';document.documentElement.append(host);root=host.attachShadow({mode:'closed'});
  const css=el('style',{},`:host{color-scheme:dark}*{box-sizing:border-box} [hidden]{display:none!important}.panel{width:min(370px,calc(100vw - 32px));max-height:calc(100dvh - 40px);overflow:auto;background:#171a23;color:#eef2fa;border:1px solid #41495d;border-radius:15px;box-shadow:0 12px 36px #0005;font:15px/1.45 Arial,sans-serif;padding:16px}.header{display:flex;align-items:center;justify-content:space-between;font-weight:bold;margin-bottom:12px}button{cursor:pointer;background:#30374b;border:1px solid #55607b;color:#fff;border-radius:8px;padding:9px 12px;font:inherit}button:disabled{opacity:.5;cursor:wait}button:focus-visible,textarea:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #b4ccff;outline-offset:2px}.tabs{display:flex;gap:8px;margin-bottom:14px}.tabs button[aria-selected=true]{background:#46639a}.bubble{width:36px;height:36px;border-radius:50%;background:#252c3a;box-shadow:0 2px 8px #0005;font:700 16px Arial;color:white}textarea,input,select{width:100%;font:inherit;background:#0e1118;color:#fff;border:1px solid #4a5266;border-radius:7px;padding:9px;margin:6px 0 12px}textarea{resize:vertical;min-height:90px}label{display:block;font-size:14px}small{display:block;color:#b5bfd1;font-size:12px;margin:8px 0}.row{display:flex;gap:8px;flex-wrap:wrap}.answer{white-space:pre-wrap;overflow-wrap:anywhere;max-height:280px;overflow:auto;padding-top:14px;user-select:text}.status{font-size:13px;color:#c5d5f8;margin-top:10px}.primary{background:#42669c}.warning{color:#f2d59c}`);
  root.append(css);const bubble=el('button',{class:'bubble',title:'Open Study Panel (Alt+Shift+A)'},'?');bubble.onclick=()=>show();root.append(bubble);
  const panel=el('section',{class:'panel','aria-label':'Study Panel'});root.append(panel);
  const head=el('div',{class:'header'},'Study Panel');const close=el('button',{'aria-label':'Close panel'},'×');close.onclick=hide;head.append(close);panel.append(head);
  const tabs=el('div',{class:'tabs'});for(const name of ['chat','settings']){const b=el('button',{'data-tab':name},name==='chat'?'Ask':'Settings');b.onclick=()=>tab(name);tabs.append(b)}panel.append(tabs);
  const chat=el('div',{id:'chat'});const question=el('textarea',{placeholder:'Highlight a problem and click Use selection, or type it here.','aria-label':'Your question',maxlength:'8000'});
  const use=el('button',{},'Use selection');use.onclick=()=>{const s=window.getSelection()?.toString().trim()||lastSelection;if(s){question.value=s.slice(0,8000);status.textContent='Review the text, then click Ask.'}else status.textContent='Highlight text on the page first, or paste your question.'};
  chat.append(question,use);const mode=el('select',{'aria-label':'Answer style'});for(const[k,v]of [['hint','Hint'],['explain','Explain + answer'],['check','Check my work']])mode.append(el('option',{value:k},v));mode.value=cfg.mode;mode.onchange=()=>{cfg.mode=mode.value;persist()};chat.append(mode);
  const buttons=el('div',{class:'row'}),ask=el('button',{class:'primary'},'Ask'),cancel=el('button',{},'Cancel'),clear=el('button',{},'Clear');cancel.disabled=true;buttons.append(ask,cancel,clear);chat.append(buttons);
  const status=el('div',{class:'status',role:'status'}),answer=el('div',{class:'answer','aria-live':'polite'});chat.append(status,answer,el('small',{},'Only the text above is sent when you click Ask. Nothing is submitted to the website.'));panel.append(chat);
  ask.onclick=()=>{if(pending)return;let url;try{url=endpoint()}catch(e){status.textContent=e.message;return}if(cfg.token.length<32){status.textContent='Add your panel access token in Settings—not your OpenAI API key.';return}const q=question.value.trim();if(!q){status.textContent='Enter a question first.';return}if(!allowed()){status.textContent='Add this website to your allowed sites in Settings first.';return}ask.disabled=true;cancel.disabled=false;answer.textContent='';status.textContent='Thinking…';let finished=false;const done=()=>{finished=true;pending=null;ask.disabled=false;cancel.disabled=true};
   const handle=GM_xmlhttpRequest({method:'POST',url,headers:{'Content-Type':'application/json',Authorization:'Bearer '+cfg.token},data:JSON.stringify({question:q,mode:cfg.mode}),timeout:65000,anonymous:true,onload:r=>{done();try{const d=JSON.parse(r.responseText);if(r.status!==200)throw Error(d.error||'Server error');answer.textContent=d.answer;status.textContent=d.incomplete?'Answer reached the length limit. Ask a shorter follow-up.':'Done.'}catch(e){status.textContent=e.message}},onerror:()=>{done();status.textContent='Could not connect. Check the backend URL and Tampermonkey connection permission.'},ontimeout:()=>{done();status.textContent='Timed out. The backend may be waking up. Try again.'},onabort:()=>{done();status.textContent='Cancelled.'}});if(!finished)pending=handle;
  };
  cancel.onclick=()=>{pending?.abort()};clear.onclick=()=>{pending?.abort();question.value='';answer.textContent='';status.textContent='';lastSelection=''};
  const settings=el('div',{id:'settings'});const fields={};
  function field(key,title,type,options){const label=el('label',{},title),input=el(options?'select':'input',options?{}:{type});input.id='setting-'+key;if(options)for(const[value,name]of options)input.append(el('option',{value},name));input.value=cfg[key];label.append(input);settings.append(label);fields[key]=input;return input}
  field('backend','Backend URL','url');field('token','Panel access token (not the API key)','password');
  field('display','Display','',[['visible','Visible: open panel'],['discreet','Discreet: small corner button'],['hidden','Hidden: shortcut only']]);
  field('corner','Corner','',[['right','Bottom right'],['left','Bottom left']]);
  const font=field('font','Text size (12–22 px)','number');font.min=12;font.max=22;
  const opacity=field('opacity','Opacity (45–100%)','number');opacity.min=45;opacity.max=100;
  field('sites','Allowed domains (comma-separated)','text');
  settings.append(el('small',{},'Example: deltamath.com, example.org. Subdomains are included. No page content is read automatically.'));
  const save=el('button',{class:'primary'},'Save settings'),savedStatus=el('div',{role:'status',class:'status'});settings.append(save,savedStatus,el('small',{},'Alt+Shift+A toggles the panel; Esc closes it. On Mac use Option+Shift+A. Settings are separate on each device.'));
  save.onclick=()=>{const sites=fields.sites.value.toLowerCase().split(/[\s,]+/).filter(Boolean);if(!sites.length||sites.some(x=>!/^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(x))){savedStatus.textContent='Enter domains only, without https:// or paths.';return}const token=fields.token.value.trim();if(token.startsWith('sk-')){savedStatus.textContent='Do not put your OpenAI key here. Use the separate panel access token.';return}cfg={...cfg,backend:fields.backend.value.trim().replace(/\/+$/,''),token,sites:sites.join(', '),display:fields.display.value,corner:fields.corner.value,font:Math.min(22,Math.max(12,Number(fields.font.value)||15)),opacity:Math.min(100,Math.max(45,Number(fields.opacity.value)||100))};persist();style();savedStatus.textContent='Saved. Close the panel to apply the display mode.'};panel.append(settings);tab('chat');style();
 }
 GM_registerMenuCommand('Study Panel: Settings',()=>show(true));
 document.addEventListener('pointerup',()=>{if(!allowed())return;const s=window.getSelection()?.toString().trim();if(s)lastSelection=s.slice(0,8000)});
 document.addEventListener('keydown',e=>{if(e.altKey&&e.shiftKey&&e.code==='KeyA'){if(!allowed())return;e.preventDefault();open?hide():show()}else if(e.key==='Escape'&&open)hide()});
 if(allowed()){mount();cfg.display==='visible'?show():hide()}
})();
