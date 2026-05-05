import React,{useState,useEffect,useMemo}from"react";

// ONE component, ONE return(). No helper functions returning JSX.
// No React.Fragment. No .map(fn) where fn has its own return.
// This guarantees the artifact renderer's tokenizer won't create return_react2.

const DK={bg:"#1A111A",card:"#2A1E2A",card2:"#362836",card3:"#483848",
  ink:"#F6EDF2",ink2:"#C8A8BE",muted:"#8A6880",
  line:"rgba(246,237,242,0.08)",line2:"rgba(246,237,242,0.18)",
  coral:"#FF8A6A",mauve:"#C46A85",gold:"#F4C46B",
  follicular:"#7ABFAA",luteal:"#9B8FD4"};
const LK={bg:"#F6EDF2",card:"#FFFFFF",card2:"#F0E4EC",card3:"#E4D4DE",
  ink:"#1A111A",ink2:"#6D4C6D",muted:"#A0809A",
  line:"rgba(109,76,109,0.1)",line2:"rgba(109,76,109,0.2)",
  coral:"#FF8A6A",mauve:"#B05070",gold:"#E0A830",
  follicular:"#4A9880",luteal:"#7060B0"};

const MO=["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const WD=["Mo","Di","Mi","Do","Fr","Sa","So"];
const SK="sc-v1";
const F="'Plus Jakarta Sans',-apple-system,sans-serif";

const toD=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
const dif=(a,b)=>Math.round((toD(a)-toD(b))/86400000);
const addD=(d,n)=>{const x=toD(d);x.setDate(x.getDate()+n);return x;};
const iso=d=>{const x=toD(d);const y=x.getFullYear(),m=String(x.getMonth()+1).padStart(2,"0"),dd=String(x.getDate()).padStart(2,"0");return `${y}-${m}-${dd}`;};
const parse=s=>{const[y,m,d]=s.split("-").map(Number);return toD(new Date(y,m-1,d));};
const niceFmt=s=>s?parse(s).toLocaleDateString("de-DE",{day:"2-digit",month:"long",year:"numeric"}):"";

const phOf=(date,start,cl,pl)=>{
  if(!start)return"none";
  const d=((dif(date,start)%cl)+cl)%cl,ov=cl-14;
  if(d<pl)return"period";
  if(d<ov-5)return"follicular";
  if(d<=ov+2)return"ovulation";
  if(d<cl-5)return"luteal";
  return"pms";
};
const isPeak=(date,start,cl)=>!!start&&((dif(date,start)%cl)+cl)%cl===cl-14;
const isFertile=(date,start,cl)=>{if(!start)return false;const d=((dif(date,start)%cl)+cl)%cl,ov=cl-14;return(d>=ov-5&&d<ov)||(d>ov&&d<=ov+2);};
const cycDay=(date,start,cl)=>start?(((dif(date,start)%cl)+cl)%cl)+1:null;
const nextPer=(start,cl,ref)=>{if(!start)return null;const t=ref?toD(ref):toD(new Date());let n=toD(start);while(n<=t)n=addD(n,cl);return n;};
const nextOvu=(start,cl,ref)=>{if(!start)return null;const t=ref?toD(ref):toD(new Date());let b=toD(start);while(addD(b,cl)<=t)b=addD(b,cl);const o=addD(b,cl-14);return o>=t?o:addD(addD(b,cl),cl-14);};
const encShare=(d,m)=>btoa(unescape(encodeURIComponent(JSON.stringify({...d,mode:m}))));
const decShare=h=>{try{return JSON.parse(decodeURIComponent(escape(atob(h))));}catch{return null;}};
const loadLS=()=>{try{const r=localStorage.getItem(SK);return r?JSON.parse(r):null;}catch{return null;}};
const saveLS=s=>{try{localStorage.setItem(SK,JSON.stringify(s));}catch{}};
const pxy=(cx,cy,r,a)=>{const rad=(a-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};};

const PLBL={period:"Periode",follicular:"Follikelphase",ovulation:"Eisprung",luteal:"Lutealphase",pms:"PMS",none:"—"};
const dTxt=v=>v===0?"Heute":v===1?"Morgen":v===-1?"Gestern":v!=null?(v<0?`vor ${-v}d`:`in ${v}d`):"—";

export default function ShareCycle(){
  const[nm,setNm]=useState("");
  const[lp,setLp]=useState("");
  const[cl,setCl]=useState(28);
  const[pl,setPl]=useState(5);
  const[dk,setDk]=useState(true);
  const[sel,setSel]=useState(null);
  const[ni,setNi]=useState("");
  const[dpY,setDpY]=useState(new Date().getFullYear());
  const[dpM,setDpM]=useState(new Date().getMonth());
  const[dpS,setDpS]=useState(null);
  const[spd,setSpd]=useState(true);
  const[sfl,setSfl]=useState(false);
  const[sov,setSov]=useState(true);
  const[slt,setSlt]=useState(false);
  const[spm,setSpm]=useState(true);
  const[sSetup,setSSetup]=useState(false);
  const[sDp,setSDp]=useState(false);
  const[sNm,setSNm]=useState(false);
  const[sSh,setSSh]=useState(false);
  const[sm,setSm]=useState("full");
  const[cp,setCp]=useState(false);
  const[lpConfirm,setLpConfirm]=useState(null); // date string awaiting confirm
  const lpTimer=React.useRef(null);
  const[pv,setPv]=useState(null);

  useEffect(()=>{
    const h=window.location.hash.replace(/^#/,"");
    if(h.startsWith("p=")){const d=decShare(h.slice(2));if(d?.lp){setPv(d);return;}}
    const s=loadLS();
    if(s?.lp){setNm(s.nm||"");setLp(s.lp);setCl(s.cl||28);setPl(s.pl||5);if(s.dk!==undefined)setDk(s.dk);}
    else setSSetup(true);
  },[]);

  useEffect(()=>{if(lp)saveLS({nm,lp,cl,pl,dk});},[nm,lp,cl,pl,dk]);

  const T=dk?DK:LK;
  const today=useMemo(()=>toD(new Date()),[]);
  const ad=pv?{nm:pv.nm||"",lp:pv.lp,cl:pv.cl||28,pl:pv.pl||5,mode:pv.mode||"full"}:{nm,lp,cl,pl,mode:"full"};
  const as=ad.lp?parse(ad.lp):null;
  const fd=sel||today,itd=dif(fd,today)===0;
  const ph=phOf(fd,as,ad.cl,ad.pl);
  const fdc=cycDay(fd,as,ad.cl);
  const np=nextPer(as,ad.cl,fd),du=np?dif(np,fd):null;
  const no=nextOvu(as,ad.cl,fd),dto=no?dif(no,fd):null;
  const showFull=!pv||ad.mode==="full";

  const pCol=c=>c==="period"?T.coral:c==="ovulation"?T.gold:c==="pms"?T.mauve:c==="follicular"?T.follicular:c==="luteal"?T.luteal:T.muted;
  const pc=pCol(ph);
  const plbl=PLBL[ph]||"—";

  const fillDeg=fdc&&ad.cl?fdc/ad.cl*360:0;
  const dotPos=fdc?pxy(80,80,58,fillDeg):null;
  const fp=fillDeg>0?(()=>{const p1=pxy(80,80,58,0),p2=pxy(80,80,58,Math.min(fillDeg,359.9)),lg=fillDeg>180?1:0;return`M${p1.x} ${p1.y}A58 58 0 ${lg} 1 ${p2.x} ${p2.y}`;})():null;

  const calM=useMemo(()=>{
    const r=[];
    for(let o=0;o<12;o++){
      const m=new Date(today.getFullYear(),today.getMonth()+o,1);
      const fw=(m.getDay()+6)%7,dim=new Date(m.getFullYear(),m.getMonth()+1,0).getDate();
      const cells=[];
      for(let j=fw;j>0;j--)cells.push({date:addD(m,-j),in:false});
      for(let d=1;d<=dim;d++)cells.push({date:new Date(m.getFullYear(),m.getMonth(),d),in:true});
      while(cells.length%7)cells.push({date:addD(cells[cells.length-1].date,1),in:false});
      r.push({y:m.getFullYear(),mn:m.getMonth(),cells});
    }
    return r;
  },[today]);

  const slink=useMemo(()=>lp?`${location.origin}${location.pathname}#p=${encShare({nm,lp,cl,pl},sm)}`:"",
    [nm,lp,cl,pl,sm]);

  const dlIcal=()=>{
    if(!as)return;
    const evts=[];let base=toD(as);
    const t=toD(new Date());
    while(addD(base,cl)<addD(t,-cl))base=addD(base,cl);
    for(let i=0;i<6;i++){
      const s=i===0?base:addD(base,i*cl),e=addD(s,pl),n2=nm?`${nm} – Periode`:"Periode";
      evts.push(`BEGIN:VEVENT\r\nSUMMARY:${n2}\r\nDTSTART;VALUE=DATE:${iso(s).replace(/-/g,"")}\r\nDTEND;VALUE=DATE:${iso(e).replace(/-/g,"")}\r\nUID:hcp${i}\r\nEND:VEVENT`);
    }
    for(let i=0;i<4;i++){
      const s=addD(base,i*cl+(cl-14)),n2=nm?`${nm} – Eisprung`:"Eisprung";
      evts.push(`BEGIN:VEVENT\r\nSUMMARY:${n2}\r\nDTSTART;VALUE=DATE:${iso(s).replace(/-/g,"")}\r\nDTEND;VALUE=DATE:${iso(addD(s,1)).replace(/-/g,"")}\r\nUID:hco${i}\r\nEND:VEVENT`);
    }
    const uri="data:text/calendar;charset=utf-8,"+encodeURIComponent(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ShareCycle//DE\r\n${evts.join("\r\n")}\r\nEND:VCALENDAR`);
    const a=document.createElement("a");a.href=uri;a.target="_blank";a.download=`${nm||"share-cycle"}.ics`;document.body.appendChild(a);a.click();document.body.removeChild(a);
  };
  const gCal=()=>{
    if(!np)return;
    const s2=iso(np).replace(/-/g,""),e2=iso(addD(np,pl)).replace(/-/g,"");
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(nm?`${nm} – Periode`:"Periode")}&dates=${s2}/${e2}&sf=true`,"_blank");
  };

  // Overlay style objects (not JSX functions)
  const OV={position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100,backdropFilter:"blur(8px)"};
  const SB={borderRadius:"22px 22px 0 0",width:"100%",maxWidth:430,maxHeight:"92vh",overflowY:"auto",background:T.card,padding:"0 18px 40px"};
  const HDL={width:40,height:5,background:T.card3,borderRadius:999,margin:"10px auto 16px"};
  const SHD={display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:14,borderBottom:`1px solid ${T.line}`,marginBottom:16};
  const GRP={background:T.card2,borderRadius:16,overflow:"hidden"};
  const ROW={display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",minHeight:48,borderBottom:`1px solid ${T.line}`};

  const startLP=(isoStr)=>{
    cancelLP();
    lpTimer.current=setTimeout(()=>{
      setLpConfirm(isoStr);
    },700);
  };
  const cancelLP=()=>{if(lpTimer.current){clearTimeout(lpTimer.current);lpTimer.current=null;}};
  const confirmLP=()=>{if(lpConfirm){setLp(lpConfirm);setSel(null);setLpConfirm(null);}};

  // Build calendar cells array (no JSX in map)
  const calCells=[];
  for(let mi=0;mi<calM.length;mi++){
    const{y,mn,cells}=calM[mi];
    const dayCells=[];
    for(let ci=0;ci<cells.length;ci++){
      const{date,in:inM}=cells[ci];
      const p=as?phOf(date,as,ad.cl,ad.pl):"none";
      const pk=as&&isPeak(date,as,ad.cl);
      const cdNum=as&&inM?cycDay(date,as,ad.cl):null;
      // Solid period: only the actual logged period (first cycle from as)
      const solidPeriod=p==="period"&&as&&dif(date,as)>=0&&dif(date,as)<ad.pl;
      const fertile=as&&isFertile(date,as,ad.cl);
      const isT=dif(date,today)===0,isSel=sel&&dif(date,sel)===0;
      const vis=(p==="period"&&spd)||(p==="follicular"&&sfl)||(p==="ovulation"&&sov)||(p==="luteal"&&slt)||(p==="pms"&&spm);
      const partOk=!pv||ad.mode==="full"||p==="period"||p==="ovulation";
      const show=vis&&partOk;
      const pcol=pCol(p);
      let bg=T.card,border="none",dayCol=T.ink,fw=400;
      if(show){
        if(p==="period"&&solidPeriod)bg=T.coral;
        else if(p==="period")bg=`repeating-linear-gradient(0deg,${T.coral}22 0,${T.coral}22 3px,${T.coral} 3px,${T.coral} 4.5px)`;
        else if(p==="follicular")bg=T.follicular+"22";
        else if(p==="ovulation")bg=`radial-gradient(ellipse at 50% 40%,${T.gold}44 0%,${T.gold}0a 100%)`;
        else if(p==="luteal")bg=T.luteal+"22";
        else if(p==="pms")bg=T.mauve+"55";
        fw=600;
      }
      if(p==="period"&&solidPeriod&&show){dayCol="#fff";fw=700;}
      if(isT)border=`2.5px solid ${T.ink}`;
      if(isSel)border=`2.5px solid ${T.coral}`;
      dayCells.push(
        <button key={ci} data-date={iso(date)} onClick={()=>setSel(isSel?null:date)} onTouchStart={e=>{const d=e.currentTarget.getAttribute("data-date");if(d)startLP(d);}} onTouchEnd={cancelLP} onTouchMove={cancelLP} onContextMenu={e=>{e.preventDefault();const d=e.currentTarget.getAttribute("data-date");if(d){startLP(d);setTimeout(cancelLP,10);}}} style={{aspectRatio:"1/1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:11,background:bg,border,opacity:inM?1:.3,position:"relative",fontFamily:F,cursor:"pointer",boxShadow:isSel?`0 0 0 3px ${T.coral}44`:"none",userSelect:"none",WebkitUserSelect:"none"}}>
          {cdNum&&<span style={{position:"absolute",top:2,right:3,fontSize:12,fontWeight:600,color:dayCol,opacity:.65,lineHeight:1,fontFamily:F}}>{cdNum}</span>}
          <span style={{fontSize:15,fontWeight:fw,color:dayCol,lineHeight:1}}>{date.getDate()}</span>
          {pk&&show&&<span style={{fontSize:12,lineHeight:1,marginTop:1,color:T.gold}}>✿</span>}
          {fertile&&show&&sov&&<span style={{fontSize:10,lineHeight:1,marginTop:1,color:T.gold,opacity:.6}}>✿</span>}
        </button>
      );
    }
    calCells.push(
      <div key={mi} style={{marginBottom:28}}>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:10}}>
          <span style={{fontSize:20,fontWeight:700,color:T.ink,fontFamily:F}}>{MO[mn]}</span>
          <span style={{fontSize:14,color:T.muted,fontFamily:F}}>{y}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
          {dayCells}
        </div>
      </div>
    );
  }

  // Date picker cells
  const dpToday=new Date();
  const dpDim=new Date(dpY,dpM+1,0).getDate();
  const dpFw=(new Date(dpY,dpM,1).getDay()+6)%7;
  const dpCells=[];
  for(let j=dpFw;j>0;j--)dpCells.push(null);
  for(let d=1;d<=dpDim;d++)dpCells.push(d);
  while(dpCells.length%7)dpCells.push(null);

  const dpGrid=dpCells.map((d,i)=>{
    if(!d)return <div key={i}/>;
    const cd=new Date(dpY,dpM,d),s=iso(cd),isSel=dpS===s,isFut=cd>dpToday,isTod=dif(cd,toD(dpToday))===0;
    return <button key={i} onClick={()=>{if(!isFut)setDpS(s);}} style={{aspectRatio:"1/1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:11,border:"none",cursor:isFut?"not-allowed":"pointer",background:isSel?T.coral:isTod?T.card3:T.card2,opacity:isFut?.3:1}}><span style={{fontSize:14,fontWeight:isSel||isTod?700:400,color:isSel?"#fff":isTod?T.coral:T.ink2,fontFamily:F}}>{d}</span></button>;
  });

  return(
    <div style={{height:"100vh",background:T.bg,color:T.ink,fontFamily:F,maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;}html,body{background:${T.bg};overflow-x:hidden;}button{cursor:pointer;border:none;background:none;}input,textarea{user-select:text;-webkit-user-select:text;}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes slideUpBanner{from{transform:translateX(-50%) translateY(20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}`}</style>

      {/* Nav */}
      <nav style={{display:"grid",gridTemplateColumns:"52px 1fr 110px",alignItems:"center",padding:"12px 14px",paddingTop:"calc(12px + env(safe-area-inset-top))",borderBottom:`1px solid ${T.line}`,position:"sticky",top:0,zIndex:50,background:T.bg+"F0",backdropFilter:"blur(16px)"}}>
        <img src="/sharecycle-symbol.png" alt="ShareCycle" width="34" height="34" style={{display:"block",objectFit:"contain"}}/>
        <div style={{textAlign:"center"}}>
          {ad.nm
            ?<button onClick={()=>{setNi(ad.nm);setSNm(true);}} style={{fontSize:16,fontWeight:700,color:T.coral,padding:"4px 12px",borderRadius:999,border:`1px solid ${T.coral}44`,fontFamily:F}}>{ad.nm}</button>
            :<span style={{fontSize:16,fontWeight:700,fontFamily:F}}><span style={{color:T.ink}}>Share</span><span style={{color:T.coral}}>Cycle</span></span>}
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"flex-end",alignItems:"center"}}>
          {pv
            ?<button onClick={()=>{window.location.hash="";window.location.reload();}} style={{color:T.coral,fontSize:12,fontWeight:600,padding:"6px 10px",borderRadius:999,border:`1px solid ${T.coral}44`,fontFamily:F}}>↩</button>
            :<>
              <button onClick={()=>setSSetup(true)} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",background:T.card2,borderRadius:"50%",color:T.ink2}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              </button>
              {lp&&<button onClick={()=>setSSh(true)} style={{background:T.coral,color:"#fff",fontSize:13,fontWeight:700,padding:"7px 12px",borderRadius:999,fontFamily:F}}>Teilen</button>}
            </>}
        </div>
      </nav>

      {/* Phase toggles — always visible, compact pill row */}
      {as&&(
        <div style={{display:"flex",gap:6,padding:"8px 14px 6px",flexShrink:0,overflowX:"auto",borderBottom:`1px solid ${T.line}`,background:T.bg+"F0",backdropFilter:"blur(8px)"}}>
          {[["P",spd,setSpd,T.coral,"Periode"],["F",sfl,setSfl,T.follicular,"Follikel"],["◆",sov,setSov,T.gold,"Eisprung"],["L",slt,setSlt,T.luteal,"Luteal"],["~",spm,setSpm,T.mauve,"PMS"]].map(([icon,on,set,col,tip])=>{
            return <div key={tip} onClick={()=>set(v=>!v)} title={tip} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 9px",borderRadius:999,background:on?col+"30":T.card2,border:`1px solid ${on?col:T.line2}`,cursor:"pointer",flexShrink:0,userSelect:"none"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:on?col:T.muted}}/>
              <span style={{fontSize:11,fontWeight:700,color:on?col:T.muted,fontFamily:F,whiteSpace:"nowrap"}}>{tip}</span>
            </div>;
          })}
        </div>
      )}

      {/* Hero — compact card, no ring */}
      {as&&(
        <div style={{flexShrink:0,background:T.card,margin:"10px 14px 0",borderRadius:16,overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,${pc}18 0%,transparent 60%)`,pointerEvents:"none"}}/>
          <div style={{padding:"12px 16px",position:"relative",zIndex:1}}>
            {/* Row 1: phase name + day label + today button */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                <span style={{fontSize:20,fontWeight:800,color:pc,fontFamily:F,lineHeight:1}}>{plbl}</span>
                <span style={{fontSize:12,color:T.muted,fontFamily:F}}>{ad.nm?"Tag "+fdc+" · "+ad.nm:"Tag "+fdc+" von "+ad.cl}</span>
              </div>
              {!itd&&<button onClick={()=>setSel(null)} style={{fontSize:11,color:T.coral,padding:"3px 10px",border:`1px solid ${T.coral}55`,borderRadius:999,background:"none",fontFamily:F,fontWeight:600}}>← Heute</button>}
            </div>
            {/* Progress bar */}
            <div style={{height:6,borderRadius:3,background:T.card3,marginBottom:10,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.round((fdc/ad.cl)*100)}%`,borderRadius:3,background:pc,transition:"width .3s"}}/>
            </div>
            {/* Row 2: facts */}
            <div style={{display:"flex",gap:0}}>
              <div style={{flex:1,borderRight:`1px solid ${T.line}`}}>
                <div style={{fontSize:15,fontWeight:700,color:T.ink,fontFamily:F,lineHeight:1}}>{dTxt(du)}</div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:T.muted,fontFamily:F,marginTop:2}}>Nächste Periode</div>
              </div>
              {showFull&&dto!=null&&(
                <div style={{flex:1,paddingLeft:14}}>
                  <div style={{fontSize:15,fontWeight:700,color:T.gold,fontFamily:F,lineHeight:1}}>{dTxt(dto)}</div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:T.muted,fontFamily:F,marginTop:2}}>Eisprung</div>
                </div>
              )}
              {!(showFull&&dto!=null)&&(
                <div style={{flex:1,paddingLeft:14}}>
                  <div style={{fontSize:15,fontWeight:700,color:T.ink2,fontFamily:F,lineHeight:1}}>{fdc}/{ad.cl}</div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:T.muted,fontFamily:F,marginTop:2}}>Zyklustag</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!as&&(
        <div style={{padding:"70px 28px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:14,flex:1,overflowY:"auto"}}>
          <img src="/sharecycle-symbol.png" alt="ShareCycle" width="100" height="100" style={{display:"block",objectFit:"contain"}}/>
          <h2 style={{fontSize:28,fontWeight:700,fontFamily:F}}><span style={{color:T.ink}}>Share</span><span style={{color:T.coral}}>Cycle</span></h2>
          <p style={{fontSize:14,color:T.ink2,lineHeight:1.5,maxWidth:240,fontFamily:F}}>Dein privater Zykluskalender. Starte mit dem letzten Periodenbeginn.</p>
          <button onClick={()=>setSSetup(true)} style={{display:"block",width:"100%",maxWidth:280,background:T.coral,color:"#fff",fontSize:16,fontWeight:700,padding:15,borderRadius:16,border:"none",cursor:"pointer",fontFamily:F}}>Einrichten</button>
        </div>
      )}

      {/* Calendar */}
      {as&&(
        <div style={{padding:"0 14px",overflowY:"auto",flex:1,paddingBottom:80}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:10}}>
            {WD.map(w=><div key={w} style={{textAlign:"center",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:T.muted,padding:"3px 0",fontFamily:F}}>{w}</div>)}
          </div>
          {calCells}

        </div>
      )}

      {/* Name sheet */}
      {sNm&&(
        <div style={{...OV,animation:"fadeIn .2s"}} onClick={()=>setSNm(false)}>
          <div style={{...SB,animation:"slideUp .28s cubic-bezier(.22,1,.36,1)"}} onClick={e=>e.stopPropagation()}>
            <div style={HDL}/>
            <div style={SHD}>
              <span style={{fontSize:18,fontWeight:700,color:T.ink,fontFamily:F}}>Name</span>
              <button onClick={()=>{setNm(ni);setSNm(false);}} style={{color:T.coral,fontSize:16,fontWeight:600,fontFamily:F}}>Fertig</button>
            </div>
            <p style={{fontSize:14,color:T.ink2,marginBottom:14,lineHeight:1.5,fontFamily:F}}>Wird in der Topbar angezeigt.</p>
            <div style={{position:"relative"}}>
              <input value={ni} onChange={e=>setNi(e.target.value)} autoFocus maxLength={16} placeholder="z.B. Luna…"
                style={{width:"100%",background:T.card2,border:`1.5px solid ${T.line2}`,borderRadius:14,padding:"14px 42px 14px 16px",fontSize:18,fontWeight:600,color:T.coral,outline:"none",fontFamily:F}}/>
              {ni&&<button onClick={()=>setNi("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:T.muted}}>✕</button>}
            </div>
            <button onClick={()=>{setNm(ni);setSNm(false);}} style={{display:"block",width:"100%",background:T.coral,color:"#fff",fontSize:16,fontWeight:700,padding:15,borderRadius:16,border:"none",cursor:"pointer",marginTop:16,fontFamily:F}}>Speichern</button>
          </div>
        </div>
      )}

      {/* Setup sheet */}
      {sSetup&&(
        <div style={{...OV,animation:"fadeIn .2s"}} onClick={()=>lp&&setSSetup(false)}>
          <div style={{...SB,animation:"slideUp .28s cubic-bezier(.22,1,.36,1)"}} onClick={e=>e.stopPropagation()}>
            <div style={HDL}/>
            <div style={SHD}>
              <span style={{fontSize:18,fontWeight:700,color:T.ink,fontFamily:F}}>Einstellungen</span>
              {lp&&<button onClick={()=>setSSetup(false)} style={{color:T.coral,fontSize:16,fontWeight:600,fontFamily:F}}>Fertig</button>}
            </div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,margin:"18px 2px 6px",fontFamily:F}}>NAME</div>
            <div style={GRP}>
              <div style={{...ROW,borderBottom:"none"}}>
                <span style={{fontSize:16,color:T.ink,fontFamily:F}}>Name</span>
                <input value={nm} onChange={e=>setNm(e.target.value)} placeholder="Optional…" maxLength={16}
                  style={{background:"transparent",border:"none",outline:"none",fontSize:16,color:T.coral,fontWeight:500,textAlign:"right",maxWidth:160,fontFamily:F}}/>
              </div>
            </div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,margin:"18px 2px 6px",fontFamily:F}}>PERIODE</div>
            <div style={GRP}>
              <div style={{...ROW,cursor:"pointer"}} onClick={()=>{const i=lp?parse(lp):new Date();setDpY(i.getFullYear());setDpM(i.getMonth());setDpS(lp||null);setSDp(true);}}>
                <span style={{fontSize:16,color:T.ink,fontFamily:F}}>Beginn</span>
                <span style={{fontSize:15,color:T.coral,fontWeight:500,fontFamily:F}}>{lp?niceFmt(lp):"Tippen →"}</span>
              </div>
              <div style={{...ROW,borderBottom:"none"}}>
                <span style={{fontSize:16,color:T.ink,fontFamily:F}}>Dauer</span>
                <div style={{display:"flex",alignItems:"center",background:T.card3,borderRadius:10,overflow:"hidden"}}>
                  <button onClick={()=>setPl(v=>Math.max(2,v-1))} style={{width:34,height:32,fontSize:20,color:T.coral,fontFamily:F}}>−</button>
                  <span style={{minWidth:50,textAlign:"center",fontSize:14,fontWeight:600,color:T.ink2,fontFamily:F}}>{pl}d</span>
                  <button onClick={()=>setPl(v=>Math.min(10,v+1))} style={{width:34,height:32,fontSize:20,color:T.coral,fontFamily:F}}>+</button>
                </div>
              </div>
            </div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,margin:"18px 2px 6px",fontFamily:F}}>ZYKLUS</div>
            <div style={GRP}>
              <div style={{...ROW,borderBottom:"none"}}>
                <span style={{fontSize:16,color:T.ink,fontFamily:F}}>Länge</span>
                <div style={{display:"flex",alignItems:"center",background:T.card3,borderRadius:10,overflow:"hidden"}}>
                  <button onClick={()=>setCl(v=>Math.max(20,v-1))} style={{width:34,height:32,fontSize:20,color:T.coral,fontFamily:F}}>−</button>
                  <span style={{minWidth:50,textAlign:"center",fontSize:14,fontWeight:600,color:T.ink2,fontFamily:F}}>{cl}d</span>
                  <button onClick={()=>setCl(v=>Math.min(40,v+1))} style={{width:34,height:32,fontSize:20,color:T.coral,fontFamily:F}}>+</button>
                </div>
              </div>
            </div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,margin:"18px 2px 6px",fontFamily:F}}>DARSTELLUNG</div>
            <div style={GRP}>
              <div style={{...ROW,borderBottom:"none"}}>
                <span style={{fontSize:16,color:T.ink,fontFamily:F}}>Dunkles Design</span>
                <div onClick={()=>setDk(d=>!d)} style={{width:50,height:30,borderRadius:15,background:dk?T.coral:T.card3,cursor:"pointer",position:"relative",transition:"background .2s"}}>
                  <div style={{position:"absolute",top:3,left:dk?23:3,width:24,height:24,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
                </div>
              </div>
            </div>
            {lp&&<button onClick={()=>setSSetup(false)} style={{display:"block",width:"100%",background:T.coral,color:"#fff",fontSize:16,fontWeight:700,padding:15,borderRadius:16,border:"none",cursor:"pointer",marginTop:16,fontFamily:F}}>Speichern</button>}
            {lp&&<button onClick={()=>{if(confirm("Alle Daten löschen?")){localStorage.removeItem(SK);setNm("");setLp("");setCl(28);setPl(5);setSSetup(true);}}} style={{display:"block",width:"100%",background:T.mauve+"22",color:"#FF453A",fontSize:15,fontWeight:500,padding:14,borderRadius:14,marginTop:10,cursor:"pointer",border:"none",fontFamily:F}}>Alle Daten löschen</button>}
            <p style={{fontSize:12,color:T.muted,textAlign:"center",marginTop:18,lineHeight:1.5,fontFamily:F}}>Daten bleiben lokal — kein Server.</p>
          </div>
        </div>
      )}

      {/* Date picker */}
      {sDp&&(
        <div style={{...OV,zIndex:200,animation:"fadeIn .2s"}} onClick={()=>setSDp(false)}>
          <div style={{...SB,paddingBottom:28,animation:"slideUp .28s cubic-bezier(.22,1,.36,1)"}} onClick={e=>e.stopPropagation()}>
            <div style={HDL}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:14,borderBottom:`1px solid ${T.line}`,marginBottom:0}}>
              <button onClick={()=>setSDp(false)} style={{fontSize:16,color:T.muted,fontFamily:F}}>Abbrechen</button>
              <span style={{fontSize:16,fontWeight:700,color:T.ink,fontFamily:F}}>Datum wählen</span>
              <button onClick={()=>{if(dpS){setLp(dpS);setSDp(false);}}} style={{fontSize:16,fontWeight:700,color:T.coral,opacity:dpS?1:.3,fontFamily:F}}>Fertig</button>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 8px"}}>
              <button onClick={()=>{if(dpM===0){setDpM(11);setDpY(y=>y-1);}else setDpM(m=>m-1);}} style={{width:36,height:36,borderRadius:"50%",background:T.card2,fontSize:20,color:T.coral,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
              <span style={{fontSize:18,fontWeight:700,color:T.ink,fontFamily:F}}>{MO[dpM]} <span style={{color:T.muted,fontWeight:400,fontSize:14}}>{dpY}</span></span>
              <button onClick={()=>{if(dpM===11){setDpM(0);setDpY(y=>y+1);}else setDpM(m=>m+1);}} style={{width:36,height:36,borderRadius:"50%",background:T.card2,fontSize:20,color:T.coral,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
              {WD.map(w=><div key={w} style={{textAlign:"center",fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.muted,padding:"3px 0",fontFamily:F}}>{w}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {dpGrid}
            </div>
          </div>
        </div>
      )}

      {/* Share sheet */}
      {sSh&&(
        <div style={{...OV,animation:"fadeIn .2s"}} onClick={()=>setSSh(false)}>
          <div style={{...SB,animation:"slideUp .28s cubic-bezier(.22,1,.36,1)"}} onClick={e=>e.stopPropagation()}>
            <div style={HDL}/>
            <div style={SHD}>
              <span style={{fontSize:18,fontWeight:700,color:T.ink,fontFamily:F}}>Teilen & Export</span>
              <button onClick={()=>setSSh(false)} style={{color:T.coral,fontSize:16,fontWeight:600,fontFamily:F}}>Fertig</button>
            </div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,margin:"0 2px 6px",fontFamily:F}}>PARTNER-LINK</div>
            <p style={{fontSize:13,color:T.ink2,marginBottom:12,lineHeight:1.5,fontFamily:F}}>Kein Server, kein Konto. Link kopieren, fertig.</p>
            <div style={{display:"flex",background:T.card2,borderRadius:12,padding:3,marginBottom:8}}>
              <button onClick={()=>setSm("full")} style={{flex:1,padding:"8px 10px",fontSize:13,fontWeight:sm==="full"?700:500,color:sm==="full"?T.ink:T.ink2,borderRadius:9,background:sm==="full"?T.card3:"transparent",fontFamily:F}}>Vollständig</button>
              <button onClick={()=>setSm("minimal")} style={{flex:1,padding:"8px 10px",fontSize:13,fontWeight:sm==="minimal"?700:500,color:sm==="minimal"?T.ink:T.ink2,borderRadius:9,background:sm==="minimal"?T.card3:"transparent",fontFamily:F}}>Minimal</button>
            </div>
            <p style={{fontSize:12,color:T.muted,textAlign:"center",marginBottom:10,fontFamily:F}}>{sm==="full"?"Alle Phasen & Daten":"Nur Periode & Eisprung"}</p>
            <div style={{background:T.card2,borderRadius:12,marginBottom:4}}>
              <input readOnly value={slink} onClick={e=>e.target.select()} style={{width:"100%",background:"transparent",border:"none",outline:"none",padding:"12px 14px",fontSize:11,color:T.coral,display:"block",fontFamily:"ui-monospace,monospace"}}/>
            </div>
            <button onClick={async()=>{try{await navigator.clipboard.writeText(slink);setCp(true);setTimeout(()=>setCp(false),2000);}catch{}}} style={{display:"block",width:"100%",background:T.coral,color:"#fff",fontSize:16,fontWeight:700,padding:15,borderRadius:16,border:"none",cursor:"pointer",marginTop:8,fontFamily:F}}>{cp?"✓ Kopiert!":"Link kopieren"}</button>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,margin:"18px 2px 6px",fontFamily:F}}>KALENDER EXPORT</div>
            <div style={{background:T.card2,borderRadius:16,overflow:"hidden"}}>
              <button onClick={dlIcal} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"13px 16px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:F}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:22}}>📅</span>
                  <div><div style={{fontSize:15,color:T.ink,fontWeight:500,fontFamily:F}}>Apple / iCal</div><div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:F}}>.ics · Periode & Eisprung</div></div>
                </div>
                <span style={{fontSize:16,color:T.coral,fontWeight:600}}>↓</span>
              </button>
              <div style={{height:1,background:T.line}}/>
              <button onClick={gCal} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"13px 16px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:F}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:22}}>🗓</span>
                  <div><div style={{fontSize:15,color:T.ink,fontWeight:500,fontFamily:F}}>Google Kalender</div><div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:F}}>Nächste Periode eintragen</div></div>
                </div>
                <span style={{fontSize:16,color:T.coral,fontWeight:600}}>↗</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Long-press confirm banner */}
      {lpConfirm&&(
        <div style={{position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",zIndex:300,
          background:T.coral,borderRadius:18,padding:"14px 20px",boxShadow:"0 4px 24px rgba(0,0,0,.4)",
          display:"flex",flexDirection:"column",alignItems:"center",gap:10,minWidth:280,maxWidth:360,
          animation:"slideUpBanner .22s cubic-bezier(.22,1,.36,1)"}}>
          <span style={{fontSize:14,fontWeight:600,color:"#fff",fontFamily:F,textAlign:"center"}}>
            Periodenbeginn setzen auf{" "}
            <span style={{fontWeight:800}}>{parse(lpConfirm).toLocaleDateString("de-DE",{day:"2-digit",month:"long"})}</span>?
          </span>
          <div style={{display:"flex",gap:10,width:"100%"}}>
            <button onClick={()=>setLpConfirm(null)} style={{flex:1,padding:"9px 0",borderRadius:12,background:"rgba(255,255,255,.25)",color:"#fff",fontSize:14,fontWeight:600,fontFamily:F}}>Abbrechen</button>
            <button onClick={confirmLP} style={{flex:1,padding:"9px 0",borderRadius:12,background:"#fff",color:T.coral,fontSize:14,fontWeight:700,fontFamily:F}}>Setzen</button>
          </div>
        </div>
      )}
    </div>
  );
}
