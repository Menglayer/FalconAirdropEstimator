
// Falcon Calculator – buy amount -> auto YT qty -> points (SUSDF 9/25 maturity)
(function(){
  'use strict';
  const $ = (s)=>document.querySelector(s);
  const $$ = (s)=>Array.from(document.querySelectorAll(s));
  const fmt = (n,d=2)=> (n==null||!isFinite(n)) ? '—' : new Intl.NumberFormat('en-US',{maximumFractionDigits:d}).format(n);
  const parseNum = (v, def=0)=>{ const n=parseFloat(String(v||'').replace(/,/g,'')); return isFinite(n)?n:def; };
  const daysBetween = (a,b)=>{ const d1=new Date(a.getFullYear(),a.getMonth(),a.getDate()); const d2=new Date(b.getFullYear(),b.getMonth(),b.getDate()); return Math.max(0, Math.round((d2-d1)/86400000)); };
  const setText = (el, v)=>{ if (el) el.textContent = v; };

  const el = {
    top100Sum: $('#top100Sum'), top100Status: $('#top100Status'), totalNow: $('#totalNow'),
    shareLabel: $('#shareLabel'),
    topShare: $('#topShare'), growthPct: $('#growthPct'), fdv: $('#fdv'), airdropPct: $('#airdropPct'),
    netDailyMilesNow: $('#netDailyMilesNow'),
    currentMiles: $('#currentMiles'), myDailyMiles: $('#myDailyMiles'),
    tgeDate: $('#tgeDate'), daysToTgeNum: $('#daysToTgeNum'),
    myMilesAtTGE: $('#myMilesAtTGE'), T_pred: $('#T_pred'), myAirdropValue: $('#myAirdropValue'),
    oneMMilesValue: $('#oneMMilesValue'),
    followBtn: $('#followBtn'), gateArea: $('#gateArea'), sharePct: $('#sharePct'),
    ytType: $('#ytType'), ytPriceUsd: $('#ytPriceUsd'), ytBuyUsd: $('#ytBuyUsd'), ytQty: $('#ytQty'),
    ytMeta: $('#ytMeta'), ytMilesAtTGE: $('#ytMilesAtTGE'), ytMilesLine: $('#ytMilesLine'),
    ytAirdropValue: $('#ytAirdropValue'), ytROI: $('#ytROI'),
    refreshBtn: $('#refreshBtn'), exportCsvBtn: $('#exportCsvBtn')
  };
  // ---------- i18n ----------
  const i18n = {
    zh: {
      title: '预估你的 <span style="color:#2b66cc">$Falcon</span> 空投价值',
      myParams: '我的参数',
      ytParams: 'YT 参数（Pendle）',
      ytType: 'YT 种类',
      ytPrice: 'YT 单价（USD）',
      ytBuyUsd: '买入价值（YT / USD）',
      ytQty: 'YT 数量',
      currentMiles: '当前 Miles',
      myDailyMiles: '当前 每日 Miles',
      netAssumptions: '全网与假设',
      topShare: 'Top100 占比（%）',
      growthPct: '每日增速（%）',
      fdv: 'TGE 时 FDV',
      airdropPct: 'TGE 时空投比例（%）',
      netDaily: '（可选）全网当前每日新增 Miles',
      timeData: '时间与数据',
      tgeDate: 'TGE 日期',
      daysTo: '距离今天：',
      susdfNote: 'SUSDF 的 YT 默认按每年 9/25 到期；若 TGE 晚于该日，则 YT 积分只累计至到期。',
      helpNote: '说明：YT 积分=YT数量 × 持有小时 × (每日积分/24) × 倍数；到期=min(接口到期, SUSDF固定9/25, TGE)。',
      kpi1: '1M MILES 的预测价值',
      kpi2: 'TGE 我的累计 Miles',
      kpi3: '预测全网累计（TGE）',
      kpi4: '空投价值 / 我的占比',
      kpi5: 'YT 至 TGE 可获 Miles',
      kpi6: 'YT 预估空投价值 & ROI',
      btnRefresh: '刷新 Top100',
      btnExport: '导出 CSV',
      follow: '关注我 X',
      statusFetching: '请求中...',
      statusUpdated: '已更新',
      ytContribution: 'YT 至 TGE 贡献：'
    },
    en: {
      title: 'Estimate your <span style="color:#2b66cc">$Falcon</span> Airdrop Value',
      myParams: 'My Parameters',
      ytParams: 'YT (Pendle)',
      ytType: 'YT Type',
      ytPrice: 'YT Price (USD)',
      ytBuyUsd: 'Buy Amount (USD)',
      ytQty: 'YT Quantity',
      currentMiles: 'Current Miles',
      myDailyMiles: 'Current Daily Miles',
      netAssumptions: 'Network & Assumptions',
      topShare: 'Top100 Share (%)',
      growthPct: 'Daily Growth (%)',
      fdv: 'FDV at TGE',
      airdropPct: 'Airdrop % at TGE',
      netDaily: '(Optional) Network Daily New Miles Now',
      timeData: 'Time & Data',
      tgeDate: 'TGE Date',
      daysTo: 'Days from Today: ',
      susdfNote: 'SUSDF YT matures on 9/25 each year; if TGE is later, YT points accrue only until maturity.',
      helpNote: 'Note: YT points = qty × holding hours × (daily points/24) × multiplier; maturity = min(API expiry, SUSDF 9/25, TGE).',
      kpi1: 'Value of 1M MILES',
      kpi2: 'My Miles at TGE',
      kpi3: 'Predicted Network Total (TGE)',
      kpi4: 'Airdrop Value / My Share',
      kpi5: 'YT Miles until TGE',
      kpi6: 'YT Estimated Airdrop & ROI',
      btnRefresh: 'Refresh Top100',
      btnExport: 'Export CSV',
      follow: 'Follow me on X',
      statusFetching: 'Fetching...',
      statusUpdated: 'Updated',
      ytContribution: 'YT contribution till TGE: '
    }
  };
  let LANG = (localStorage.getItem('falcon_lang') || 'zh');
  function setLang(l){ LANG=l; try{localStorage.setItem('falcon_lang', l);}catch(e){} applyLang(); }
  function t(key){ return (i18n[LANG] && i18n[LANG][key]) || (i18n.zh[key]||key); }
  function labelForInput(id){ const inp=document.getElementById(id); return inp?inp.parentElement:null; }
  function applyLang(){
    // Title
    const h1=document.getElementById('titleH1'); if(h1) h1.innerHTML=t('title');
    // Buttons
    if(el.refreshBtn) el.refreshBtn.textContent = t('btnRefresh');
    if(el.exportCsvBtn) el.exportCsvBtn.textContent = t('btnExport');
    if(el.followBtn) el.followBtn.textContent = t('follow');
    // KPI titles (grid cards, fixed order)
    const gridTitles = Array.from(document.querySelectorAll('.grid4 .card .kpi-title'));
    if(gridTitles[0]) gridTitles[0].textContent = t('kpi1');
    if(gridTitles[1]) gridTitles[1].textContent = t('kpi2');
    if(gridTitles[2]) gridTitles[2].textContent = t('kpi3');
    if(gridTitles[3]) gridTitles[3].textContent = t('kpi4');
    if(gridTitles[4]) gridTitles[4].textContent = t('kpi5');
    if(gridTitles[5]) gridTitles[5].textContent = t('kpi6');
    // Left column card titles
    const leftTitles = Array.from(document.querySelectorAll('.row > .card .kpi-title'));
    if(leftTitles[0]) leftTitles[0].textContent = t('myParams');
    if(leftTitles[1]) leftTitles[1].textContent = t('netAssumptions');
    if(leftTitles[2]) leftTitles[2].textContent = t('timeData');
    // Labels next to inputs
    const lbCM = labelForInput('currentMiles'); if(lbCM){ lbCM.childNodes[0].textContent = t('currentMiles')+' '; }
    const lbDM = labelForInput('myDailyMiles'); if(lbDM){ lbDM.childNodes[0].textContent = t('myDailyMiles')+' '; }
    const lbYtType = labelForInput('ytType'); if(lbYtType){ lbYtType.childNodes[0].textContent = t('ytType')+' '; }
    const lbYtPrice = labelForInput('ytPriceUsd'); if(lbYtPrice){ lbYtPrice.childNodes[0].textContent = t('ytPrice')+' '; }
    const lbYtBuy = labelForInput('ytBuyUsd'); if(lbYtBuy){ lbYtBuy.childNodes[0].textContent = t('ytBuyUsd')+' '; }
    const lbYtQty = labelForInput('ytQty'); if(lbYtQty){ lbYtQty.childNodes[0].textContent = t('ytQty')+' '; }
    const lbTopShare = labelForInput('topShare'); if(lbTopShare){ lbTopShare.childNodes[0].textContent = t('topShare')+' '; }
    const lbGrowth = labelForInput('growthPct'); if(lbGrowth){ lbGrowth.childNodes[0].textContent = t('growthPct')+' '; }
    const lbFdv = labelForInput('fdv'); if(lbFdv){ lbFdv.childNodes[0].textContent = t('fdv')+' '; }
    const lbAP = labelForInput('airdropPct'); if(lbAP){ lbAP.childNodes[0].textContent = t('airdropPct')+' '; }
    const lbND = labelForInput('netDailyMilesNow'); if(lbND){ lbND.childNodes[0].textContent = t('netDaily')+' '; }
    const lbTGE = labelForInput('tgeDate'); if(lbTGE){ lbTGE.parentElement.querySelector('.label').childNodes[0].textContent = t('tgeDate')+' '; }
    // Notes
    const sus = document.getElementById('susdfNote'); if(sus) sus.textContent = t('susdfNote');
    const dayWrap = document.getElementById('daysToTgeNum'); if(dayWrap){ const parent = dayWrap.parentElement; if(parent) parent.childNodes[0].textContent = t('daysTo'); }
  }


  // Top100
  function httpGetJson(url, ok, err){ try{ const x=new XMLHttpRequest(); x.open('GET',url,true); x.setRequestHeader('Cache-Control','no-cache');
    x.onreadystatechange=()=>{ if(x.readyState===4){ if(x.status>=200&&x.status<300){ try{ ok(JSON.parse(x.responseText)); }catch(e){ err(e);} } else err(new Error('HTTP '+x.status)); }};
    x.send(); }catch(e){ err(e);} }
  function fetchTop100(){
    setText(el.top100Status, t('statusFetching')); setText(el.top100Sum, '—');
    httpGetJson('https://api.falcon.finance/api/v1/points/leaderboard?ts='+Date.now(), (data)=>{
      const list=(data && data.leaderboard && data.leaderboard.splice?data.leaderboard:[]);
      let sum=0; for(let i=0;i<Math.min(100,list.length);i++){ const v=parseFloat(list[i]?.points||'0'); if(isFinite(v)) sum+=v; }
      el.top100Sum.setAttribute('data-raw', String(sum));
      setText(el.top100Sum, fmt(sum,0)); setText(el.top100Status, t('statusUpdated')); scheduleCompute(); applyLang();
    }, ()=> setText(el.top100Status, 'Error'));
  }

  // Pendle helpers
  const NETWORK_IDS={arbitrum:'42161',ethereum:'1',mantle:'5000',berachain:'80094',base:'8453',hyperevm:'999'};
  const NETWORK_PATH={arbitrum:'/42161',ethereum:'/1',mantle:'/5000',berachain:'/80094',base:'/8453',hyperevm:'/999'};
  function fetchWithTimeout(url, params={}, timeoutMs=12000){
    const u=new URL(url); Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(), timeoutMs);
    return fetch(u.toString(),{signal:ctrl.signal,mode:'cors',referrerPolicy:'no-referrer'}).finally(()=>clearTimeout(t));
  }
  async function fetchJSON(url, params={}){ const r=await fetchWithTimeout(url, params); if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }
  // ---- 2分钟轻量缓存（sessionStorage + 内存） ----
  const _memCache = new Map();
  const _now = ()=>Date.now();
  const _key = (kind, ident)=> kind+':'+ident;
  function cacheGet(kind, ident, ttlMs){
    const k=_key(kind, ident);
    try{
      const raw=sessionStorage.getItem(k);
      if(raw){
        const obj=JSON.parse(raw);
        if(obj && obj.ts && (_now()-obj.ts)<ttlMs) return obj.data;
      }
    }catch(e){}
    if(_memCache.has(k)){
      const {ts,data}=_memCache.get(k);
      if((_now()-ts)<ttlMs) return data;
    }
    return null;
  }
  function cacheSet(kind, ident, data){
    const k=_key(kind, ident); const v={ts:_now(), data};
    _memCache.set(k, v);
    try{ sessionStorage.setItem(k, JSON.stringify(v)); }catch(e){}
    return data;
  }

  async function getAssetsAll(networkName){ const path=NETWORK_PATH[networkName.toLowerCase()]; const key=networkName.toLowerCase(); const c=cacheGet('assetsAll', key, 120000); if(c) return c; const d=await fetchJSON('https://api-v2.pendle.finance/core/v3'+path+'/assets/all'); return cacheSet('assetsAll', key, d); }
  async function getMarketData(networkName, marketAddr){
    const id=NETWORK_IDS[networkName.toLowerCase()];
    const cacheK=(networkName+':'+marketAddr).toLowerCase();
    const c=cacheGet('marketData', cacheK, 120000);
    if(c) return c;
    const tries=[
      `https://api-v2.pendle.finance/core/v4/${id}/markets/${marketAddr}/data`,
      `https://api-v2.pendle.finance/core/v3/${id}/markets/${marketAddr}/data`,
      `https://api-v2.pendle.finance/core/v2/${id}/markets/${marketAddr}/data`
    ];
    for (const u of tries){
      try{ const j=await fetchJSON(u); if (j) return cacheSet('marketData', cacheK, j); }catch(e){} }
    return null;
  }

  async function getTransactionsAll(networkName, marketAddr){
    const id=NETWORK_IDS[networkName.toLowerCase()];
    const base=`https://api-v2.pendle.finance/core/v4/${id}/transactions`;
    let resumeToken=null, out=[], guard=0;
    while(guard++<3){
      const params={ market:marketAddr, action:'SWAP_PT,SWAP_PY,SWAP_YT', origin:'PENDLE_MARKET,YT', limit:'200' };
      if(resumeToken) params.resumeToken = resumeToken;
      try{
        const j = await fetchJSON(base, params);
        const arr = Array.isArray(j?.transactions) ? j.transactions : [];
        out = out.concat(arr);
        resumeToken = j?.paging?.resumeToken || null;
        if(!resumeToken) break;
      }catch(e){ break; }
    }
    return cacheSet('txAgg', (networkName+':'+marketAddr).toLowerCase(), out);
  }
  function parseExpiry(raw){
    if (raw == null) return new Date(NaN);
    if (typeof raw === 'number') return new Date(raw > 1e12 ? raw : raw*1000);
    const s=String(raw).trim();
    if (/^\d+$/.test(s)){ const n=Number(s); return new Date(n>1e12?n:n*1000); }
    const iso=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s) ? s.replace(' ','T') : s;
    return new Date(iso);
  }

  const PRESETS={
    susdf:{label:'SUSDF',multiplier:36,market:'0x45f163e583d34b8e276445dd3da9ae077d137d72',yt:'0xff1e55f96fa77bcfb5d40f6641e0acabd47ac34f',
           maturity:(tge)=> new Date((tge instanceof Date&&!isNaN(tge))?tge.getFullYear():new Date().getFullYear(),8,25)},
    gho_usdf:{label:'GHO-USDF',multiplier:60,market:'0x51026ab8b54767e67f7f5543c86bf718cf00cb4c',yt:'0x422e5d91f65dad31b6839281bd986e226ba4a9e7',maturity:null},
    usdf:{label:'USDF',multiplier:60,market:'0xc65b7a0f8fc97e1d548860d866f4304e039ef016',yt:'0x7d00afaf9c7847602264497a810a1e587f54338c',maturity:null}
  };
  const TRY_NETWORKS=['ethereum','arbitrum','base','mantle','berachain','hyperevm'];
  let state={ ytExpiry:null, ytNetwork:'ethereum', impliedApy:NaN, syPriceUsd:1 };

  
async function resolveNetworkAndExpiry(ytAddr, tge){
    ytAddr=(ytAddr||'').toLowerCase();
    if (ytAddr === PRESETS.susdf.yt.toLowerCase()){
      state.ytNetwork='ethereum'; 
      state.ytExpiry = PRESETS.susdf.maturity(tge); 
      return;
    }
    for(const net of TRY_NETWORKS){
      try{
        const assets = await getAssetsAll(net);
        const arr = Array.isArray(assets) ? assets : (assets && assets.assets) ? assets.assets : [];
        const hit = arr.find(a => a && String(a.address).toLowerCase()===ytAddr && Array.isArray(a.tags) && a.tags.includes('YT'));
        if (hit && hit.expiry){ 
          state.ytNetwork=net; 
          state.ytExpiry=parseExpiry(hit.expiry); 
          return; 
        }
      }catch(e){ /* continue */ }
    }
    state.ytNetwork='ethereum'; 
    state.ytExpiry=new Date(NaN);
  }

  async function updateYtPriceAndQty(){
    const key = el.ytType.value||'susdf'; const p=PRESETS[key];
    const tge=new Date(el.tgeDate.value||'2025-10-15');
    await resolveNetworkAndExpiry(p.yt, tge);

    let implied=NaN, syUsd=1;
    try{
      const md = await getMarketData(state.ytNetwork, p.market);
      const dig=(o,ks)=>ks.reduce((x,k)=> (x&&x[k]!=null)?x[k]:null, md||{});
      implied = Number(md?.impliedApy ?? md?.market?.impliedApy ?? dig(md,['result','impliedApy']));
      syUsd   = Number(md?.syPriceUsd ?? md?.market?.syPriceUsd ?? md?.underlyingPriceUsd ?? dig(md,['result','syPriceUsd'])) || 1;
    }catch(e){}
    if (!(implied>0)) { try{ const txs=await getTransactionsAll(state.ytNetwork, p.market); const arr=txs.map(t=>Number(t?.impliedApy)).filter(x=>Number.isFinite(x)&&x>-0.99); if(arr.length) implied=arr.reduce((a,b)=>a+b,0)/arr.length; }catch(e){} }
    if (!(implied>0)) implied = 0.05;
    state.impliedApy=implied; state.syPriceUsd=syUsd;

    const now=new Date(); const mat = p.maturity? p.maturity(tge) : (state.ytExpiry instanceof Date && !isNaN(state.ytExpiry) ? state.ytExpiry : tge);
    const yearsToMat = Math.max(0, (mat - now) / (365*24*3600*1000));
    const ptAsset = (yearsToMat>0) ? 1/Math.pow(1+implied, yearsToMat) : 1;
    let ytAsset = Math.max(0, 1 - ptAsset); if (ytAsset < 1e-9) ytAsset = 1e-9;
    const priceUsd = ytAsset * syUsd;
    el.ytPriceUsd.value = isFinite(priceUsd) ? (Math.round(priceUsd*1e6)/1e6) : '';

    const buy = parseNum(el.ytBuyUsd?.value||'0', 0);
    const qty = (buy>0 && isFinite(priceUsd) && priceUsd>0) ? (buy/priceUsd) : 0;
    el.ytQty.value = (Math.round(qty*10000)/10000).toString();

    scheduleCompute(); applyLang();
  }

  window._resultUnlocked = (localStorage.getItem('falcon_unlock')==='1');
  function unlockNow(){ window._resultUnlocked=true; try{localStorage.setItem('falcon_unlock','1');}catch(e){} scheduleCompute(); applyLang(); }
  if (el.followBtn){
    let t=0; el.followBtn.addEventListener('click',()=>t=Date.now());
    document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible' && !window._resultUnlocked && t && (Date.now()-t)<60000) unlockNow(); });
    window.addEventListener('focus',()=>{ if (!window._resultUnlocked && t && (Date.now()-t)<60000) unlockNow(); });
  }

  let _cmpTimer=null; function scheduleCompute(){ if(_cmpTimer) clearTimeout(_cmpTimer); _cmpTimer=setTimeout(compute,80);} 
  function compute(){
    const tge=new Date(el.tgeDate.value||'2025-09-29');
    const days=daysBetween(new Date(),tge); setText(el.daysToTgeNum, days);

    const g=Math.max(0, parseNum(el.growthPct.value,1.3)/100);
    const M0=parseNum(el.currentMiles.value,0);
    const d0=parseNum(el.myDailyMiles.value,0);
    let myAdded = d0 * days;
    let myMilesAtTGE = M0 + myAdded;

    // YT 积分
    const key = el.ytType.value||'susdf'; const p=PRESETS[key];
    const qty = Math.max(0, parseNum(el.ytQty.value,0));
    let endDate = tge;
    if (p.maturity){ const m = p.maturity(tge); if (m < endDate) endDate = m; } else if (state.ytExpiry instanceof Date && !isNaN(state.ytExpiry)){ if (state.ytExpiry < endDate) endDate = state.ytExpiry; }
    const hrsHold = Math.max(0, Math.round((endDate - new Date())/3600000));
    const ytPoints = qty * (1/24) * hrsHold * p.multiplier;
    setText(el.ytMilesAtTGE, fmt(ytPoints,2));
    el.ytMilesLine.textContent = t('ytContribution')+fmt(ytPoints,2);
    myMilesAtTGE += ytPoints;
    setText(el.myMilesAtTGE, fmt(myMilesAtTGE,2));

    // 全网推演
    const topRaw=el.top100Sum.getAttribute('data-raw')||el.top100Sum.textContent||'';
    const topSum=parseNum(topRaw,NaN);
    const shareNow=Math.max(1e-9, parseNum(el.topShare&&el.topShare.value,70)/100);
    if(el.shareLabel) el.shareLabel.textContent=(parseNum(el.topShare.value,70)||70);
    let T0=isFinite(topSum)?(topSum/shareNow):null; if(isFinite(topSum)) setText(el.totalNow, fmt(T0,0));

    const D0=parseNum(el.netDailyMilesNow.value,0);
    let T_pred=null;
    if(T0!=null){ T_pred = D0>0 ? (T0 + D0 * days) : (T0 + (T0 * g) * days); }
    setText(el.T_pred, (T_pred!=null)?fmt(T_pred,0):'—');

    const fdv=parseNum(el.fdv.value,1000000000); const ap=Math.max(0, parseNum(el.airdropPct.value,8)/100); const pool=fdv*ap;
    const sharePct=T_pred?(myMilesAtTGE/T_pred):null; const myVal=(sharePct!=null)?(pool*sharePct):null;
    el.myAirdropValue.setAttribute('data-value', (myVal!=null)?('≈ $'+fmt(myVal,2)):'—');
    const shareText=(sharePct!=null)?((sharePct*100).toFixed(6)+'%'):'—';
    el.sharePct.setAttribute('data-value', shareText);

    if(window._resultUnlocked){
      setText(el.myAirdropValue, el.myAirdropValue.getAttribute('data-value'));
      setText(el.sharePct, el.sharePct.getAttribute('data-value'));
      if (el.gateArea) el.gateArea.style.display = 'none';
      el.sharePct.classList.remove('notice');
    } else {
      if (el.gateArea) el.gateArea.style.display = 'flex';
      el.sharePct.classList.add('notice');
    }

    const oneM=(T_pred!=null)?(pool*(1000000/T_pred)):null; setText(el.oneMMilesValue, (oneM!=null)?('≈ $'+fmt(oneM,2)):'—');

    // YT 预估空投价值 & ROI
    const ytValue = (T_pred!=null) ? (pool * (ytPoints / T_pred)) : null;
    setText(el.ytAirdropValue, (ytValue!=null)?('≈ $'+fmt(ytValue,2)):'—');
    const buyUsd = parseNum(el.ytBuyUsd.value,0);
    const roi = (ytValue!=null && buyUsd>0) ? ((ytValue - buyUsd)/buyUsd*100) : null;
    setText(el.ytROI, (roi!=null)?('ROI '+roi.toFixed(2)+'%'):'ROI —');
  }

  function exportCSV(){
    const lines=[];
    const add=(k,v)=>lines.push(k+','+('"'+String(v).replace(/"/g,'""')+'"'));
    add('Top100', el.top100Sum.textContent||'');
    add('TotalNow', $('#totalNow').textContent||'');
    add('MyMilesAtTGE', el.myMilesAtTGE.textContent||'');
    add('YT_Miles', $('#ytMilesAtTGE').textContent||'');
    add('TGE_Pred', el.T_pred.textContent||'');
    add('MyShare', window._resultUnlocked?($('#sharePct').getAttribute('data-value')||''):'(locked)');
    add('AirdropValue', window._resultUnlocked?(el.myAirdropValue.getAttribute('data-value')||''):'(locked)');
    add('YT_AirdropValue', $('#ytAirdropValue').textContent||'');
    add('OneMValue', el.oneMMilesValue.textContent||'');
    const csv='\ufeff'+lines.join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='falcon_estimate.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1200);
  }

  
  // Lang toggle buttons
  const langZHBtn = document.getElementById('langZH');
  const langENBtn = document.getElementById('langEN');
  if (langZHBtn) langZHBtn.addEventListener('click', ()=>setLang('zh'));
  if (langENBtn) langENBtn.addEventListener('click', ()=>setLang('en'));
document.addEventListener('input', ()=>scheduleCompute());
  if(el.refreshBtn) el.refreshBtn.addEventListener('click', fetchTop100);
  if(el.exportCsvBtn) el.exportCsvBtn.addEventListener('click', exportCSV);

  // init
  $('#tgeDate').value='2025-09-29';
  fetchTop100();
  updateYtPriceAndQty();
  scheduleCompute(); applyLang();

  if (el.ytType) el.ytType.addEventListener('change', updateYtPriceAndQty);
  if (el.tgeDate) el.tgeDate.addEventListener('change', updateYtPriceAndQty);
  if (el.ytBuyUsd) el.ytBuyUsd.addEventListener('input', updateYtPriceAndQty);
})();
