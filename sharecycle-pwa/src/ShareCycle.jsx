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

const MO={de:["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],
  en:["January","February","March","April","May","June","July","August","September","October","November","December"]};
const WD={de:["Mo","Di","Mi","Do","Fr","Sa","So"],en:["Mo","Tu","We","Th","Fr","Sa","Su"]};
const SK="sc-v1";
const PK="sc-pv1";
const F="'Plus Jakarta Sans',-apple-system,sans-serif";

const toD=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
const dif=(a,b)=>Math.round((toD(a)-toD(b))/86400000);
const addD=(d,n)=>{const x=toD(d);x.setDate(x.getDate()+n);return x;};
const iso=d=>{const x=toD(d);const y=x.getFullYear(),m=String(x.getMonth()+1).padStart(2,"0"),dd=String(x.getDate()).padStart(2,"0");return `${y}-${m}-${dd}`;};
const parse=s=>{const[y,m,d]=s.split("-").map(Number);return toD(new Date(y,m-1,d));};
const niceFmt=(s,lang)=>s?parse(s).toLocaleDateString(lang==="en"?"en-US":"de-DE",{day:"2-digit",month:"long",year:"numeric"}):"";

// Minimum distance between two logged period starts. Anything closer is treated as a
// correction of the existing entry, not as an additional cycle.
const MINGAP=10;
// Merge a newly logged start into the sorted list of starts, replacing any entry that is
// close enough to be a correction of the same period.
const putStart=(list,isoStr)=>{
  const t=parse(isoStr);
  const out=(list||[]).filter(x=>x!==isoStr&&Math.abs(dif(parse(x),t))>=MINGAP);
  out.push(isoStr);out.sort();return out;
};
const delStart=(list,isoStr)=>(list||[]).filter(x=>x!==isoStr);

// The cycle segment a date belongs to: the period start it follows, how long that cycle
// actually lasted, and whether its start was logged (vs. extrapolated).
// Cycles between two logged starts are measured from the real gap, so logging a new start
// never shifts earlier months — only the open cycle and unlogged ones use the default `cl`.
const segOf=(date,starts,cl)=>{
  if(!starts||!starts.length)return null;
  const d=toD(date);
  let i=-1;
  for(let k=0;k<starts.length;k++){if(dif(d,starts[k])>=0)i=k;else break;}
  if(i<0){const back=Math.ceil(dif(starts[0],d)/cl);return{s:addD(starts[0],-back*cl),len:cl,logged:false};}
  if(i<starts.length-1)return{s:starts[i],len:Math.max(dif(starts[i+1],starts[i]),2),logged:true};
  const off=dif(d,starts[i]);
  if(off<cl)return{s:starts[i],len:cl,logged:true};
  return{s:addD(starts[i],Math.floor(off/cl)*cl),len:cl,logged:false};
};
const phOf=(date,seg,pl,pmsOffset)=>{
  if(!seg)return"none";
  const cl=seg.len,d=dif(date,seg.s),ov=cl-14;
  const ps=pmsOffset!=null&&pmsOffset>0&&pmsOffset<cl?pmsOffset:cl-5;
  if(d<Math.min(pl,cl))return"period";
  if(d<ov-5)return"follicular";
  if(d<=ov+2)return"ovulation";
  if(d<ps)return"luteal";
  return"pms";
};
// The luteal→PMS boundary for a segment: a PMS start logged inside that cycle wins; cycles
// after the newest logged one inherit its offset as a refined estimate; older cycles without
// a log keep the default (len-5). Logging a PMS start therefore never repaints past months.
const pmsFor=(seg,pmsStarts,lastOff)=>{
  if(!seg)return null;
  for(let k=(pmsStarts||[]).length-1;k>=0;k--){
    const o=dif(pmsStarts[k],seg.s);
    if(o>=0&&o<seg.len)return{off:o,logged:true};
  }
  const last=pmsStarts&&pmsStarts.length?pmsStarts[pmsStarts.length-1]:null;
  if(last&&lastOff!=null&&lastOff<seg.len&&dif(seg.s,last)>0)return{off:lastOff,logged:false};
  return null;
};
const isPeak=(date,seg)=>!!seg&&dif(date,seg.s)===seg.len-14;
const isFertile=(date,seg)=>{if(!seg)return false;const d=dif(date,seg.s),ov=seg.len-14;return(d>=ov-5&&d<ov)||(d>ov&&d<=ov+2);};
const cycDay=(date,seg)=>seg?dif(date,seg.s)+1:null;
const nextPer=(ref,starts,cl)=>{const a=segOf(ref,starts,cl);return a?addD(a.s,a.len):null;};
const nextOvu=(ref,starts,cl)=>{
  const a=segOf(ref,starts,cl);if(!a)return null;
  const o=addD(a.s,a.len-14);if(dif(o,ref)>=0)return o;
  const b=segOf(addD(a.s,a.len),starts,cl);return b?addD(b.s,b.len-14):null;
};
const encShare=(d,sp,sxt)=>btoa(unescape(encodeURIComponent(JSON.stringify({...d,sp,sxt}))));
const decShare=h=>{try{return JSON.parse(decodeURIComponent(escape(atob(h))));}catch{return null;}};
const loadLS=()=>{try{const r=localStorage.getItem(SK);return r?JSON.parse(r):null;}catch{return null;}};
const saveLS=s=>{try{localStorage.setItem(SK,JSON.stringify(s));}catch{}};
// Partner view: the last opened share payload plus that viewer's own appearance prefs.
// Kept separately from `sc-v1` so a partner never owns cycle data — and so a share link
// added to the home screen still works when the launcher drops the `#p=` fragment.
const loadPV=()=>{try{const r=localStorage.getItem(PK);return r?JSON.parse(r):null;}catch{return null;}};
const savePV=s=>{try{localStorage.setItem(PK,JSON.stringify(s));}catch{}};
const pxy=(cx,cy,r,a)=>{const rad=(a-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};};

const PLBL={de:{period:"Periode",follicular:"Follikelphase",ovulation:"Eisprung",luteal:"Lutealphase",pms:"PMS",none:"—"},
  en:{period:"Period",follicular:"Follicular phase",ovulation:"Ovulation",luteal:"Luteal phase",pms:"PMS",none:"—"}};
const PTXT={
  de:{
    period:"Sie hat ihre Periode. Ein bisschen Rücksicht tut jetzt gut.",
    follicular:"Energie und Laune steigen — gute Zeit für gemeinsame Pläne.",
    ovulation:"Energie-Hoch — ein schöner Moment für Nähe.",
    luteal:"Die Energie lässt langsam nach — etwas mehr Ruhe tut gut.",
    pms:"PMS-Phase: Stimmungsschwankungen sind normal. Geduld hilft am meisten."
  },
  en:{
    period:"She's on her period. A little consideration goes a long way now.",
    follicular:"Energy and mood are rising — a good time for shared plans.",
    ovulation:"Peak energy — a lovely moment for closeness.",
    luteal:"Energy is slowly winding down — a bit more calm helps.",
    pms:"PMS phase: mood swings are normal. Patience helps most."
  }
};
const dTxt=(v,lang)=>{const e=lang==="en";return v===0?(e?"Today":"Heute"):v===1?(e?"Tomorrow":"Morgen"):v===-1?(e?"Yesterday":"Gestern"):v!=null?(v<0?(e?`${-v}d ago`:`vor ${-v}d`):`in ${v}d`):"—";};
const detectLang=()=>{try{return(navigator.language||"").toLowerCase().startsWith("de")?"de":"en";}catch{return"de";}};
const STR={
  de:{share:"Teilen",pPeriod:"Periode",pFollicular:"Follikel",pOvulation:"Eisprung",pLuteal:"Luteal",pPms:"PMS",
    day:"Tag",of:"von",today:"Heute",nextPeriod:"Nächste Periode",cycleDay:"Zyklustag",
    tagline:"Dein privater Zykluskalender. Starte mit dem letzten Periodenbeginn.",setup:"Einrichten",
    name:"Name",done:"Fertig",nameHint:"Wird in der Topbar angezeigt.",namePlaceholder:"z.B. Luna…",save:"Speichern",
    settings:"Einstellungen",secName:"NAME",optional:"Optional…",secPeriod:"PERIODE",start:"Beginn",tap:"Tippen →",
    duration:"Dauer",secCycle:"ZYKLUS",length:"Länge",secAppearance:"DARSTELLUNG",darkTheme:"Dunkles Design",language:"Sprache",
    deleteAll:"Alle Daten löschen",confirmDelete:"Alle Daten löschen?",localNote:"Daten bleiben lokal — kein Server.",
    cancel:"Abbrechen",chooseDate:"Datum wählen",
    shareExport:"Teilen & Export",partnerLink:"PARTNER-LINK",shareChoose:"Wähle, was dein Partner sehen soll.",
    partnerInfo:"Partner-Infos",partnerInfoSub:"Kurzer Hinweis, wie er unterstützen kann",
    copied:"✓ Kopiert!",copyLink:"Link kopieren",calExport:"KALENDER EXPORT",icalSub:".ics · Periode & Eisprung",
    googleCal:"Google Kalender",addNextPeriod:"Nächste Periode eintragen",
    setPeriodStart:"Periodenbeginn setzen",setPeriodStartSub:"Starttag der Periode eintragen",
    setPmsStart:"PMS-Beginn setzen",setPmsStartSub:"Tatsächlichen PMS-Start eintragen",
    delPeriodStart:"Periodenbeginn entfernen",delPeriodStartSub:"Diesen eingetragenen Start wieder löschen",
    delPmsStart:"PMS-Beginn entfernen",delPmsStartSub:"Diesen eingetragenen PMS-Start wieder löschen",
    periodEvent:"Periode",ovulationEvent:"Eisprung"},
  en:{share:"Share",pPeriod:"Period",pFollicular:"Follicular",pOvulation:"Ovulation",pLuteal:"Luteal",pPms:"PMS",
    day:"Day",of:"of",today:"Today",nextPeriod:"Next period",cycleDay:"Cycle day",
    tagline:"Your private cycle calendar. Start with your last period.",setup:"Set up",
    name:"Name",done:"Done",nameHint:"Shown in the top bar.",namePlaceholder:"e.g. Luna…",save:"Save",
    settings:"Settings",secName:"NAME",optional:"Optional…",secPeriod:"PERIOD",start:"Start",tap:"Tap →",
    duration:"Duration",secCycle:"CYCLE",length:"Length",secAppearance:"APPEARANCE",darkTheme:"Dark theme",language:"Language",
    deleteAll:"Delete all data",confirmDelete:"Delete all data?",localNote:"Data stays on your device — no server.",
    cancel:"Cancel",chooseDate:"Choose date",
    shareExport:"Share & export",partnerLink:"PARTNER LINK",shareChoose:"Choose what your partner sees.",
    partnerInfo:"Partner tips",partnerInfoSub:"A short note on how to support them",
    copied:"✓ Copied!",copyLink:"Copy link",calExport:"CALENDAR EXPORT",icalSub:".ics · Period & ovulation",
    googleCal:"Google Calendar",addNextPeriod:"Add next period",
    setPeriodStart:"Set period start",setPeriodStartSub:"Log the first day of the period",
    setPmsStart:"Set PMS start",setPmsStartSub:"Log the actual PMS start",
    delPeriodStart:"Remove period start",delPeriodStartSub:"Delete this logged start again",
    delPmsStart:"Remove PMS start",delPmsStartSub:"Delete this logged PMS start again",
    periodEvent:"Period",ovulationEvent:"Ovulation"}
};

export default function ShareCycle(){
  const[nm,setNm]=useState("");
  const[ps,setPs]=useState([]);
  const[cl,setCl]=useState(28);
  const[pl,setPl]=useState(5);
  const[dk,setDk]=useState(true);
  const[lg,setLg]=useState(detectLang());
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
  const[sp,setSp]=useState({period:true,follicular:false,ovulation:true,luteal:false,pms:true});
  const[sxt,setSxt]=useState(true);
  const[cp,setCp]=useState(false);
  const[lpChoice,setLpChoice]=useState(null);
  const lpTimer=React.useRef(null);
  const calScrolled=React.useRef(false);
  const curMonthRef=React.useRef(null);
  const[pss,setPss]=useState([]);
  const[pv,setPv]=useState(null);
  const[pvRaw,setPvRaw]=useState("");
  const[own,setOwn]=useState(false);

  useEffect(()=>{
    const h=window.location.hash.replace(/^#/,"");
    const s=loadLS();
    setOwn(!!s?.lp);
    // Own data always wins without a hash; a stored share payload only steps in for a
    // device that has none (partner who installed the link to the home screen).
    const pvs=loadPV();
    const raw=h.startsWith("p=")?h.slice(2):(!s?.lp&&pvs?.p?pvs.p:"");
    if(raw){
      const d=decShare(raw);
      if(d?.lp){
        setPv(d);setPvRaw(raw);
        const pref=pvs||s;
        if(pref?.dk!==undefined)setDk(pref.dk);
        if(pref?.lg!==undefined)setLg(pref.lg);
        return;
      }
    }
    // `ps` (period-start history) was added later — older entries only carry `lp`.
    if(s?.lp){setNm(s.nm||"");setPs(s.ps&&s.ps.length?s.ps.slice().sort():[s.lp]);setCl(s.cl||28);setPl(s.pl||5);if(s.dk!==undefined)setDk(s.dk);setPss(s.pss&&s.pss.length?s.pss.slice().sort():(s.lps?[s.lps]:[]));setLg(s.lg!==undefined?s.lg:"de");}
    else setSSetup(true);
  },[]);

  const lp=ps.length?ps[ps.length-1]:"";
  const lps=pss.length?pss[pss.length-1]:"";
  useEffect(()=>{if(lp)saveLS({nm,lp,ps,cl,pl,dk,lps,pss,lg});},[nm,lp,ps,cl,pl,dk,lps,pss,lg]);
  useEffect(()=>{try{document.documentElement.lang=lg;}catch{}},[lg]);
  useEffect(()=>{if(pvRaw)savePV({p:pvRaw,dk,lg});},[pvRaw,dk,lg]);
  // "Add to Home Screen" would follow the manifest's start_url ("/") and drop the `#p=`
  // payload, so the partner view drops the manifest and puts its own URL back in place.
  useEffect(()=>{
    if(!pvRaw)return;
    try{
      document.querySelectorAll('link[rel="manifest"]').forEach(el=>el.remove());
      if(!window.location.hash)history.replaceState(null,"","#p="+pvRaw);
    }catch{}
  },[pvRaw]);

  const T=dk?DK:LK;
  const L=lg,S=STR[L];
  const today=useMemo(()=>toD(new Date()),[]);
  const ad=pv?{nm:pv.nm||"",lp:pv.lp,ps:pv.ps&&pv.ps.length?pv.ps:[pv.lp],cl:pv.cl||28,pl:pv.pl||5,pss:[],sp:pv.sp||{period:true,follicular:true,ovulation:true,luteal:true,pms:true},sxt:pv.sxt!==false}:{nm,lp,ps,cl,pl,pss,sp:{period:true,follicular:true,ovulation:true,luteal:true,pms:true},sxt:true};
  const as=ad.lp?parse(ad.lp):null;
  const starts=ad.ps.filter(Boolean).map(parse);
  const pmsStarts=ad.pss.filter(Boolean).map(parse);
  const lastPms=pmsStarts.length?pmsStarts[pmsStarts.length-1]:null;
  const lastPmsSeg=lastPms?segOf(lastPms,starts,ad.cl):null;
  const lastPmsOff=lastPmsSeg?dif(lastPms,lastPmsSeg.s):null;
  const fd=sel||today,itd=dif(fd,today)===0;
  const fdSeg=segOf(fd,starts,ad.cl);
  const fdLen=fdSeg?fdSeg.len:ad.cl;
  const fdPms=pmsFor(fdSeg,pmsStarts,lastPmsOff);
  const ph=phOf(fd,fdSeg,ad.pl,fdPms?fdPms.off:null);
  const fdc=cycDay(fd,fdSeg);
  const np=nextPer(fd,starts,ad.cl),du=np?dif(np,fd):null;
  const no=nextOvu(fd,starts,ad.cl),dto=no?dif(no,fd):null;

  const pCol=c=>c==="period"?T.coral:c==="ovulation"?T.gold:c==="pms"?T.mauve:c==="follicular"?T.follicular:c==="luteal"?T.luteal:T.muted;
  const pc=pCol(ph);
  const plbl=PLBL[L][ph]||"—";

  const fillDeg=fdc&&fdLen?fdc/fdLen*360:0;
  const dotPos=fdc?pxy(80,80,58,fillDeg):null;
  const fp=fillDeg>0?(()=>{const p1=pxy(80,80,58,0),p2=pxy(80,80,58,Math.min(fillDeg,359.9)),lg=fillDeg>180?1:0;return`M${p1.x} ${p1.y}A58 58 0 ${lg} 1 ${p2.x} ${p2.y}`;})():null;

  const calM=useMemo(()=>{
    const r=[];
    for(let o=-12;o<12;o++){
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

  // Auto-scroll the calendar to the current month once. Wait for the web font to load so the
  // layout height above the current month is final before scrolling (otherwise it under-scrolls).
  useEffect(()=>{
    if(!ad.lp||calScrolled.current)return;
    let raf=0;
    const attempt=tries=>{
      if(calScrolled.current)return;
      const el=curMonthRef.current;
      if(el){el.scrollIntoView({block:"start"});calScrolled.current=true;return;}
      if(tries<60)raf=requestAnimationFrame(()=>attempt(tries+1));
    };
    const kick=()=>{raf=requestAnimationFrame(()=>attempt(0));};
    let t=0;
    if(document.fonts&&document.fonts.ready&&document.fonts.ready.then){document.fonts.ready.then(kick);t=setTimeout(kick,1500);}
    else t=setTimeout(kick,300);
    return()=>{cancelAnimationFrame(raf);clearTimeout(t);};
  },[ad.lp]);

  const slink=useMemo(()=>lp?`${location.origin}${location.pathname}#p=${encShare({nm,lp,ps,cl,pl},sp,sxt)}`:"",
    [nm,lp,ps,cl,pl,sp,sxt]);

  const dlIcal=()=>{
    if(!as)return;
    const evts=[];let base=toD(as);
    const t=toD(new Date());
    while(addD(base,cl)<addD(t,-cl))base=addD(base,cl);
    for(let i=0;i<6;i++){
      const s=i===0?base:addD(base,i*cl),e=addD(s,pl),n2=nm?`${nm} – ${S.periodEvent}`:S.periodEvent;
      evts.push(`BEGIN:VEVENT\r\nSUMMARY:${n2}\r\nDTSTART;VALUE=DATE:${iso(s).replace(/-/g,"")}\r\nDTEND;VALUE=DATE:${iso(e).replace(/-/g,"")}\r\nUID:hcp${i}\r\nEND:VEVENT`);
    }
    for(let i=0;i<4;i++){
      const s=addD(base,i*cl+(cl-14)),n2=nm?`${nm} – ${S.ovulationEvent}`:S.ovulationEvent;
      evts.push(`BEGIN:VEVENT\r\nSUMMARY:${n2}\r\nDTSTART;VALUE=DATE:${iso(s).replace(/-/g,"")}\r\nDTEND;VALUE=DATE:${iso(addD(s,1)).replace(/-/g,"")}\r\nUID:hco${i}\r\nEND:VEVENT`);
    }
    const uri="data:text/calendar;charset=utf-8,"+encodeURIComponent(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ShareCycle//${L.toUpperCase()}\r\n${evts.join("\r\n")}\r\nEND:VCALENDAR`);
    const a=document.createElement("a");a.href=uri;a.target="_blank";a.download=`${nm||"share-cycle"}.ics`;document.body.appendChild(a);a.click();document.body.removeChild(a);
  };
  const gCal=()=>{
    if(!np)return;
    const s2=iso(np).replace(/-/g,""),e2=iso(addD(np,pl)).replace(/-/g,"");
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(nm?`${nm} – ${S.periodEvent}`:S.periodEvent)}&dates=${s2}/${e2}&sf=true`,"_blank");
  };

  // Overlay style objects (not JSX functions)
  const OV={position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100,backdropFilter:"blur(8px)"};
  const SB={borderRadius:"22px 22px 0 0",width:"100%",maxWidth:430,maxHeight:"92vh",overflowY:"auto",background:T.card,padding:"0 18px 40px"};
  const HDL={width:40,height:5,background:T.card3,borderRadius:999,margin:"10px auto 16px"};
  const SHD={display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:14,borderBottom:`1px solid ${T.line}`,marginBottom:16};
  const GRP={background:T.card2,borderRadius:16,overflow:"hidden"};
  const ROW={display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",minHeight:48,borderBottom:`1px solid ${T.line}`};

  const startLP=(isoStr)=>{
    if(pv)return;
    cancelLP();
    lpTimer.current=setTimeout(()=>setLpChoice(isoStr),700);
  };
  const cancelLP=()=>{if(lpTimer.current){clearTimeout(lpTimer.current);lpTimer.current=null;}};

  // Build calendar cells array (no JSX in map)
  const calCells=[];
  for(let mi=0;mi<calM.length;mi++){
    const{y,mn,cells}=calM[mi];
    const dayCells=[];
    for(let ci=0;ci<cells.length;ci++){
      const{date,in:inM}=cells[ci];
      const seg=segOf(date,starts,ad.cl);
      const pmsInfo=pmsFor(seg,pmsStarts,lastPmsOff);
      const p=phOf(date,seg,ad.pl,pmsInfo?pmsInfo.off:null);
      const cdNum=seg&&inM?cycDay(date,seg):null;
      // Solid (vs. hatched) = this period start was actually logged, not predicted.
      const solidPeriod=p==="period"&&!!seg&&seg.logged;
      // Solid (vs. hatched) = the PMS start of this cycle was actually logged, not estimated.
      const solidPMS=p==="pms"&&!!pmsInfo&&pmsInfo.logged;
      const isT=dif(date,today)===0,isSel=sel&&dif(date,sel)===0;
      const vis=pv?true:((p==="period"&&spd)||(p==="follicular"&&sfl)||(p==="ovulation"&&sov)||(p==="luteal"&&slt)||(p==="pms"&&spm));
      const partOk=!pv||ad.sp[p]!==false;
      const show=vis&&partOk;
      // Ovulation bloom: petals grow 15→20→15px and redden toward the peak day, palest at the window edges.
      let ovSize=0,ovCol="";
      if(show&&p==="ovulation"&&seg){
        const doff=dif(date,seg.s),ovd=seg.len-14,dd=doff-ovd;
        const c=Math.max(0,Math.min(1,dd<=0?(dd+5)/5:(2-dd)/2));
        ovSize=Math.round(15+c*5);
        ovCol=`rgb(255,${Math.round(235-c*190)},${Math.round(235-c*180)})`;
      }
      const pcol=pCol(p);
      let bg=T.card,border="none",dayCol=T.ink,fw=400;
      if(show){
        if(p==="period"&&solidPeriod)bg=T.coral;
        else if(p==="period")bg=`repeating-linear-gradient(0deg,${T.coral}22 0,${T.coral}22 3px,${T.coral} 3px,${T.coral} 4.5px)`;
        else if(p==="follicular")bg=T.follicular+"55";
        else if(p==="ovulation")bg=`radial-gradient(ellipse at 50% 40%,${T.gold}44 0%,${T.gold}0a 100%)`;
        else if(p==="luteal")bg=T.luteal+"55";
        else if(p==="pms"&&solidPMS)bg=T.mauve;
        else if(p==="pms")bg=`repeating-linear-gradient(0deg,${T.mauve}22 0,${T.mauve}22 3px,${T.mauve} 3px,${T.mauve} 4.5px)`;
        fw=600;
      }
      if(p==="period"&&solidPeriod&&show){dayCol="#fff";fw=700;}
      if(p==="pms"&&solidPMS&&show){dayCol="#fff";fw=700;}
      if(isT)border=`2.5px solid ${T.ink}`;
      if(isSel)border=`2.5px solid ${T.coral}`;
      dayCells.push(
        <button key={ci} data-date={iso(date)} onClick={()=>setSel(isSel?null:date)} onTouchStart={e=>{const d=e.currentTarget.getAttribute("data-date");if(d)startLP(d);}} onTouchEnd={cancelLP} onTouchMove={cancelLP} onMouseDown={e=>{if(e.button!==0)return;const d=e.currentTarget.getAttribute("data-date");if(d)startLP(d);}} onMouseUp={cancelLP} onMouseLeave={cancelLP} onContextMenu={e=>{e.preventDefault();if(pv)return;const d=e.currentTarget.getAttribute("data-date");if(d)setLpChoice(d);}} style={{aspectRatio:"1/1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:11,background:bg,border,opacity:inM?1:.3,position:"relative",fontFamily:F,cursor:"pointer",boxShadow:isSel?`0 0 0 3px ${T.coral}44`:"none",userSelect:"none",WebkitUserSelect:"none"}}>
          {cdNum&&<span style={{position:"absolute",top:2,right:3,fontSize:12,fontWeight:600,color:dayCol,opacity:.65,lineHeight:1,fontFamily:F}}>{cdNum}</span>}
          <span style={{fontSize:15,fontWeight:fw,color:dayCol,lineHeight:1}}>{date.getDate()}</span>
          {ovSize>0&&(
            <svg width={ovSize} height={ovSize} viewBox="0 0 24 24" style={{display:"block",marginTop:1}} aria-hidden="true">
              <ellipse cx="12" cy="6.6" rx="2.7" ry="4.7" fill={ovCol} transform="rotate(0 12 12)"/>
              <ellipse cx="12" cy="6.6" rx="2.7" ry="4.7" fill={ovCol} transform="rotate(72 12 12)"/>
              <ellipse cx="12" cy="6.6" rx="2.7" ry="4.7" fill={ovCol} transform="rotate(144 12 12)"/>
              <ellipse cx="12" cy="6.6" rx="2.7" ry="4.7" fill={ovCol} transform="rotate(216 12 12)"/>
              <ellipse cx="12" cy="6.6" rx="2.7" ry="4.7" fill={ovCol} transform="rotate(288 12 12)"/>
              <circle cx="12" cy="12" r="3.1" fill="#fff"/>
            </svg>
          )}
        </button>
      );
    }
    const isCurMonth=mn===today.getMonth()&&y===today.getFullYear();
    calCells.push(
      <div key={mi} ref={isCurMonth?curMonthRef:null} style={{marginBottom:28,scrollMarginTop:52}}>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:10}}>
          <span style={{fontSize:20,fontWeight:700,color:T.ink,fontFamily:F}}>{MO[L][mn]}</span>
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
            ?(pv
              ?<span style={{display:"inline-block",fontSize:16,fontWeight:700,color:T.coral,padding:"4px 12px",borderRadius:999,border:`1px solid ${T.coral}44`,fontFamily:F}}>{ad.nm}</span>
              :<button onClick={()=>{setNi(ad.nm);setSNm(true);}} style={{fontSize:16,fontWeight:700,color:T.coral,padding:"4px 12px",borderRadius:999,border:`1px solid ${T.coral}44`,fontFamily:F}}>{ad.nm}</button>)
            :<span style={{fontSize:16,fontWeight:700,fontFamily:F}}><span style={{color:T.ink}}>Share</span><span style={{color:T.coral}}>Cycle</span></span>}
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"flex-end",alignItems:"center"}}>
          {pv&&own&&<button onClick={()=>{window.location.hash="";window.location.reload();}} style={{color:T.coral,fontSize:12,fontWeight:600,padding:"6px 10px",borderRadius:999,border:`1px solid ${T.coral}44`,fontFamily:F}}>↩</button>}
          <>
              <button onClick={()=>setSSetup(true)} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",background:T.card2,borderRadius:"50%",color:T.ink2}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              </button>
              {!pv&&lp&&<button onClick={()=>setSSh(true)} style={{background:T.coral,color:"#fff",fontSize:13,fontWeight:700,padding:"7px 12px",borderRadius:999,fontFamily:F}}>{S.share}</button>}
            </>
        </div>
      </nav>

      {/* Phase toggles — always visible, compact pill row */}
      {as&&(
        <div style={{display:"flex",gap:6,padding:"8px 14px 6px",flexShrink:0,overflowX:"auto",borderBottom:`1px solid ${T.line}`,background:T.bg+"F0",backdropFilter:"blur(8px)"}}>
          {[["period","P",spd,setSpd,T.coral,S.pPeriod],["follicular","F",sfl,setSfl,T.follicular,S.pFollicular],["ovulation","◆",sov,setSov,T.gold,S.pOvulation],["luteal","L",slt,setSlt,T.luteal,S.pLuteal],["pms","~",spm,setSpm,T.mauve,S.pPms]].map(([key,icon,stateOn,set,col,tip])=>{
            const on=pv?ad.sp[key]!==false:stateOn;
            return <div key={tip} onClick={pv?undefined:()=>set(v=>!v)} title={tip} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 9px",borderRadius:999,background:on?col+"30":T.card2,border:`1px solid ${on?col:T.line2}`,cursor:pv?"default":"pointer",flexShrink:0,userSelect:"none",opacity:pv?.5:1}}>
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
                <span style={{fontSize:12,color:T.muted,fontFamily:F}}>{ad.nm?S.day+" "+fdc+" · "+ad.nm:S.day+" "+fdc+" "+S.of+" "+fdLen}</span>
              </div>
              {!itd&&<button onClick={()=>setSel(null)} style={{fontSize:11,color:T.coral,padding:"3px 10px",border:`1px solid ${T.coral}55`,borderRadius:999,background:"none",fontFamily:F,fontWeight:600}}>{"← "+S.today}</button>}
            </div>
            {/* Progress bar */}
            <div style={{height:6,borderRadius:3,background:T.card3,marginBottom:10,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.round(Math.min(fdc/fdLen,1)*100)}%`,borderRadius:3,background:pc,transition:"width .3s"}}/>
            </div>
            {pv&&ad.sxt&&ad.sp[ph]!==false&&PTXT[L][ph]&&<div style={{fontSize:12,color:T.ink2,lineHeight:1.4,marginTop:8,fontFamily:F}}>{PTXT[L][ph]}</div>}
            {/* Row 2: facts */}
            <div style={{display:"flex",gap:0}}>
              <div style={{flex:1,borderRight:`1px solid ${T.line}`}}>
                <div style={{fontSize:15,fontWeight:700,color:T.ink,fontFamily:F,lineHeight:1}}>{dTxt(du,L)}</div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:T.muted,fontFamily:F,marginTop:2}}>{S.nextPeriod}</div>
              </div>
              {(!pv||ad.sp.ovulation)&&dto!=null&&(
                <div style={{flex:1,paddingLeft:14}}>
                  <div style={{fontSize:15,fontWeight:700,color:T.gold,fontFamily:F,lineHeight:1}}>{dTxt(dto,L)}</div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:T.muted,fontFamily:F,marginTop:2}}>{PLBL[L].ovulation}</div>
                </div>
              )}
              {!((!pv||ad.sp.ovulation)&&dto!=null)&&(
                <div style={{flex:1,paddingLeft:14}}>
                  <div style={{fontSize:15,fontWeight:700,color:T.ink2,fontFamily:F,lineHeight:1}}>{fdc}/{fdLen}</div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:T.muted,fontFamily:F,marginTop:2}}>{S.cycleDay}</div>
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
          <p style={{fontSize:14,color:T.ink2,lineHeight:1.5,maxWidth:240,fontFamily:F}}>{S.tagline}</p>
          <button onClick={()=>setSSetup(true)} style={{display:"block",width:"100%",maxWidth:280,background:T.coral,color:"#fff",fontSize:16,fontWeight:700,padding:15,borderRadius:16,border:"none",cursor:"pointer",fontFamily:F}}>{S.setup}</button>
        </div>
      )}

      {/* Calendar */}
      {as&&(
        <div style={{padding:"0 14px",overflowY:"auto",flex:1,paddingBottom:80}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:10,position:"sticky",top:0,zIndex:10,background:T.bg,paddingTop:6,paddingBottom:6}}>
            {WD[L].map(w=><div key={w} style={{textAlign:"center",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:T.muted,padding:"3px 0",fontFamily:F}}>{w}</div>)}
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
              <span style={{fontSize:18,fontWeight:700,color:T.ink,fontFamily:F}}>{S.name}</span>
              <button onClick={()=>{setNm(ni);setSNm(false);}} style={{color:T.coral,fontSize:16,fontWeight:600,fontFamily:F}}>{S.done}</button>
            </div>
            <p style={{fontSize:14,color:T.ink2,marginBottom:14,lineHeight:1.5,fontFamily:F}}>{S.nameHint}</p>
            <div style={{position:"relative"}}>
              <input value={ni} onChange={e=>setNi(e.target.value)} autoFocus maxLength={16} placeholder={S.namePlaceholder}
                style={{width:"100%",background:T.card2,border:`1.5px solid ${T.line2}`,borderRadius:14,padding:"14px 42px 14px 16px",fontSize:18,fontWeight:600,color:T.coral,outline:"none",fontFamily:F}}/>
              {ni&&<button onClick={()=>setNi("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:T.muted}}>✕</button>}
            </div>
            <button onClick={()=>{setNm(ni);setSNm(false);}} style={{display:"block",width:"100%",background:T.coral,color:"#fff",fontSize:16,fontWeight:700,padding:15,borderRadius:16,border:"none",cursor:"pointer",marginTop:16,fontFamily:F}}>{S.save}</button>
          </div>
        </div>
      )}

      {/* Setup sheet */}
      {sSetup&&(
        <div style={{...OV,animation:"fadeIn .2s"}} onClick={()=>(lp||pv)&&setSSetup(false)}>
          <div style={{...SB,animation:"slideUp .28s cubic-bezier(.22,1,.36,1)"}} onClick={e=>e.stopPropagation()}>
            <div style={HDL}/>
            <div style={SHD}>
              <span style={{fontSize:18,fontWeight:700,color:T.ink,fontFamily:F}}>{S.settings}</span>
              {(lp||pv)&&<button onClick={()=>setSSetup(false)} style={{color:T.coral,fontSize:16,fontWeight:600,fontFamily:F}}>{S.done}</button>}
            </div>
            {!pv&&(<div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,margin:"18px 2px 6px",fontFamily:F}}>{S.secName}</div>
            <div style={GRP}>
              <div style={{...ROW,borderBottom:"none"}}>
                <span style={{fontSize:16,color:T.ink,fontFamily:F}}>{S.name}</span>
                <input value={nm} onChange={e=>setNm(e.target.value)} placeholder={S.optional} maxLength={16}
                  style={{background:"transparent",border:"none",outline:"none",fontSize:16,color:T.coral,fontWeight:500,textAlign:"right",maxWidth:160,fontFamily:F}}/>
              </div>
            </div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,margin:"18px 2px 6px",fontFamily:F}}>{S.secPeriod}</div>
            <div style={GRP}>
              <div style={{...ROW,cursor:"pointer"}} onClick={()=>{const i=lp?parse(lp):new Date();setDpY(i.getFullYear());setDpM(i.getMonth());setDpS(lp||null);setSDp(true);}}>
                <span style={{fontSize:16,color:T.ink,fontFamily:F}}>{S.start}</span>
                <span style={{fontSize:15,color:T.coral,fontWeight:500,fontFamily:F}}>{lp?niceFmt(lp,L):S.tap}</span>
              </div>
              <div style={{...ROW,borderBottom:"none"}}>
                <span style={{fontSize:16,color:T.ink,fontFamily:F}}>{S.duration}</span>
                <div style={{display:"flex",alignItems:"center",background:T.card3,borderRadius:10,overflow:"hidden"}}>
                  <button onClick={()=>setPl(v=>Math.max(2,v-1))} style={{width:34,height:32,fontSize:20,color:T.coral,fontFamily:F}}>−</button>
                  <span style={{minWidth:50,textAlign:"center",fontSize:14,fontWeight:600,color:T.ink2,fontFamily:F}}>{pl}d</span>
                  <button onClick={()=>setPl(v=>Math.min(10,v+1))} style={{width:34,height:32,fontSize:20,color:T.coral,fontFamily:F}}>+</button>
                </div>
              </div>
            </div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,margin:"18px 2px 6px",fontFamily:F}}>{S.secCycle}</div>
            <div style={GRP}>
              <div style={{...ROW,borderBottom:"none"}}>
                <span style={{fontSize:16,color:T.ink,fontFamily:F}}>{S.length}</span>
                <div style={{display:"flex",alignItems:"center",background:T.card3,borderRadius:10,overflow:"hidden"}}>
                  <button onClick={()=>setCl(v=>Math.max(20,v-1))} style={{width:34,height:32,fontSize:20,color:T.coral,fontFamily:F}}>−</button>
                  <span style={{minWidth:50,textAlign:"center",fontSize:14,fontWeight:600,color:T.ink2,fontFamily:F}}>{cl}d</span>
                  <button onClick={()=>setCl(v=>Math.min(40,v+1))} style={{width:34,height:32,fontSize:20,color:T.coral,fontFamily:F}}>+</button>
                </div>
              </div>
            </div>
            </div>)}
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,margin:"18px 2px 6px",fontFamily:F}}>{S.secAppearance}</div>
            <div style={GRP}>
              <div style={ROW}>
                <span style={{fontSize:16,color:T.ink,fontFamily:F}}>{S.darkTheme}</span>
                <div onClick={()=>setDk(d=>!d)} style={{width:50,height:30,borderRadius:15,background:dk?T.coral:T.card3,cursor:"pointer",position:"relative",transition:"background .2s"}}>
                  <div style={{position:"absolute",top:3,left:dk?23:3,width:24,height:24,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
                </div>
              </div>
              <div style={{...ROW,borderBottom:"none"}}>
                <span style={{fontSize:16,color:T.ink,fontFamily:F}}>{S.language}</span>
                <div style={{display:"flex",alignItems:"center",background:T.card3,borderRadius:10,overflow:"hidden"}}>
                  <button onClick={()=>setLg("de")} style={{padding:"6px 14px",fontSize:13,fontWeight:lg==="de"?700:500,color:lg==="de"?"#fff":T.ink2,background:lg==="de"?T.coral:"transparent",fontFamily:F}}>DE</button>
                  <button onClick={()=>setLg("en")} style={{padding:"6px 14px",fontSize:13,fontWeight:lg==="en"?700:500,color:lg==="en"?"#fff":T.ink2,background:lg==="en"?T.coral:"transparent",fontFamily:F}}>EN</button>
                </div>
              </div>
            </div>
            {lp&&<button onClick={()=>setSSetup(false)} style={{display:"block",width:"100%",background:T.coral,color:"#fff",fontSize:16,fontWeight:700,padding:15,borderRadius:16,border:"none",cursor:"pointer",marginTop:16,fontFamily:F}}>{S.save}</button>}
            {lp&&<button onClick={()=>{if(confirm(S.confirmDelete)){localStorage.removeItem(SK);setNm("");setPs([]);setPss([]);setCl(28);setPl(5);setSSetup(true);}}} style={{display:"block",width:"100%",background:T.mauve+"22",color:"#FF453A",fontSize:15,fontWeight:500,padding:14,borderRadius:14,marginTop:10,cursor:"pointer",border:"none",fontFamily:F}}>{S.deleteAll}</button>}
            <p style={{fontSize:12,color:T.muted,textAlign:"center",marginTop:18,lineHeight:1.5,fontFamily:F}}>{S.localNote}</p>
          </div>
        </div>
      )}

      {/* Date picker */}
      {sDp&&(
        <div style={{...OV,zIndex:200,animation:"fadeIn .2s"}} onClick={()=>setSDp(false)}>
          <div style={{...SB,paddingBottom:28,animation:"slideUp .28s cubic-bezier(.22,1,.36,1)"}} onClick={e=>e.stopPropagation()}>
            <div style={HDL}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:14,borderBottom:`1px solid ${T.line}`,marginBottom:0}}>
              <button onClick={()=>setSDp(false)} style={{fontSize:16,color:T.muted,fontFamily:F}}>{S.cancel}</button>
              <span style={{fontSize:16,fontWeight:700,color:T.ink,fontFamily:F}}>{S.chooseDate}</span>
              <button onClick={()=>{if(dpS){setPs(o=>putStart(o.filter(x=>x<dpS),dpS));setSDp(false);}}} style={{fontSize:16,fontWeight:700,color:T.coral,opacity:dpS?1:.3,fontFamily:F}}>{S.done}</button>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 8px"}}>
              <button onClick={()=>{if(dpM===0){setDpM(11);setDpY(y=>y-1);}else setDpM(m=>m-1);}} style={{width:36,height:36,borderRadius:"50%",background:T.card2,fontSize:20,color:T.coral,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
              <span style={{fontSize:18,fontWeight:700,color:T.ink,fontFamily:F}}>{MO[L][dpM]} <span style={{color:T.muted,fontWeight:400,fontSize:14}}>{dpY}</span></span>
              <button onClick={()=>{if(dpM===11){setDpM(0);setDpY(y=>y+1);}else setDpM(m=>m+1);}} style={{width:36,height:36,borderRadius:"50%",background:T.card2,fontSize:20,color:T.coral,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
              {WD[L].map(w=><div key={w} style={{textAlign:"center",fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.muted,padding:"3px 0",fontFamily:F}}>{w}</div>)}
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
              <span style={{fontSize:18,fontWeight:700,color:T.ink,fontFamily:F}}>{S.shareExport}</span>
              <button onClick={()=>setSSh(false)} style={{color:T.coral,fontSize:16,fontWeight:600,fontFamily:F}}>{S.done}</button>
            </div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,margin:"0 2px 6px",fontFamily:F}}>{S.partnerLink}</div>
            <p style={{fontSize:13,color:T.ink2,marginBottom:12,lineHeight:1.5,fontFamily:F}}>{S.shareChoose}</p>
            <div style={GRP}>
              {[["period",T.coral],["follicular",T.follicular],["ovulation",T.gold],["luteal",T.luteal],["pms",T.mauve]].map(([k,col],i,arr)=>{
                return <div key={k} style={{...ROW,borderBottom:i===arr.length-1?"none":ROW.borderBottom}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:col}}/>
                    <span style={{fontSize:16,color:T.ink,fontFamily:F}}>{PLBL[L][k]}</span>
                  </div>
                  <div onClick={()=>setSp(o=>({...o,[k]:!o[k]}))} style={{width:50,height:30,borderRadius:15,background:sp[k]?T.coral:T.card3,cursor:"pointer",position:"relative",transition:"background .2s"}}>
                    <div style={{position:"absolute",top:3,left:sp[k]?23:3,width:24,height:24,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
                  </div>
                </div>;
              })}
            </div>
            <div style={{...GRP,marginTop:10}}>
              <div style={{...ROW,borderBottom:"none"}}>
                <div>
                  <div style={{fontSize:16,color:T.ink,fontFamily:F}}>{S.partnerInfo}</div>
                  <div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:F}}>{S.partnerInfoSub}</div>
                </div>
                <div onClick={()=>setSxt(v=>!v)} style={{width:50,height:30,borderRadius:15,background:sxt?T.coral:T.card3,cursor:"pointer",position:"relative",transition:"background .2s"}}>
                  <div style={{position:"absolute",top:3,left:sxt?23:3,width:24,height:24,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
                </div>
              </div>
            </div>
            <div style={{background:T.card2,borderRadius:12,marginTop:12,marginBottom:4}}>
              <input readOnly value={slink} onClick={e=>e.target.select()} style={{width:"100%",background:"transparent",border:"none",outline:"none",padding:"12px 14px",fontSize:11,color:T.coral,display:"block",fontFamily:"ui-monospace,monospace"}}/>
            </div>
            <button onClick={async()=>{try{await navigator.clipboard.writeText(slink);setCp(true);setTimeout(()=>setCp(false),2000);}catch{}}} style={{display:"block",width:"100%",background:T.coral,color:"#fff",fontSize:16,fontWeight:700,padding:15,borderRadius:16,border:"none",cursor:"pointer",marginTop:8,fontFamily:F}}>{cp?S.copied:S.copyLink}</button>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.muted,margin:"18px 2px 6px",fontFamily:F}}>{S.calExport}</div>
            <div style={{background:T.card2,borderRadius:16,overflow:"hidden"}}>
              <button onClick={dlIcal} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"13px 16px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:F}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:22}}>📅</span>
                  <div><div style={{fontSize:15,color:T.ink,fontWeight:500,fontFamily:F}}>Apple / iCal</div><div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:F}}>{S.icalSub}</div></div>
                </div>
                <span style={{fontSize:16,color:T.coral,fontWeight:600}}>↓</span>
              </button>
              <div style={{height:1,background:T.line}}/>
              <button onClick={gCal} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"13px 16px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:F}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:22}}>🗓</span>
                  <div><div style={{fontSize:15,color:T.ink,fontWeight:500,fontFamily:F}}>{S.googleCal}</div><div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:F}}>{S.addNextPeriod}</div></div>
                </div>
                <span style={{fontSize:16,color:T.coral,fontWeight:600}}>↗</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Long-press choice modal */}
      {lpChoice&&(
        <div style={{...OV,animation:"fadeIn .2s"}} onClick={()=>setLpChoice(null)}>
          <div style={{...SB,padding:"0 18px 28px",animation:"slideUp .28s cubic-bezier(.22,1,.36,1)"}} onClick={e=>e.stopPropagation()}>
            <div style={HDL}/>
            <div style={{textAlign:"center",fontSize:15,fontWeight:600,color:T.ink2,fontFamily:F,paddingBottom:16}}>
              {parse(lpChoice).toLocaleDateString(L==="en"?"en-US":"de-DE",{weekday:"long",day:"2-digit",month:"long"})}
            </div>
            <button onClick={()=>{setPs(o=>putStart(o,lpChoice));setSel(null);setLpChoice(null);}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:T.coral+"22",border:`1.5px solid ${T.coral}55`,borderRadius:16,padding:"14px 18px",marginBottom:10,cursor:"pointer",fontFamily:F}}>
              <span style={{fontSize:22}}>🩸</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:15,fontWeight:700,color:T.coral,fontFamily:F}}>{S.setPeriodStart}</div>
                <div style={{fontSize:12,color:T.muted,fontFamily:F,marginTop:2}}>{S.setPeriodStartSub}</div>
              </div>
            </button>
            <button onClick={()=>{setPss(o=>putStart(o,lpChoice));setSel(null);setLpChoice(null);}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:T.mauve+"22",border:`1.5px solid ${T.mauve}55`,borderRadius:16,padding:"14px 18px",marginBottom:10,cursor:"pointer",fontFamily:F}}>
              <span style={{fontSize:22}}>🌙</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:15,fontWeight:700,color:T.mauve,fontFamily:F}}>{S.setPmsStart}</div>
                <div style={{fontSize:12,color:T.muted,fontFamily:F,marginTop:2}}>{S.setPmsStartSub}</div>
              </div>
            </button>
            {pss.indexOf(lpChoice)>=0&&(
              <button onClick={()=>{setPss(o=>delStart(o,lpChoice));setSel(null);setLpChoice(null);}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:T.card2,border:`1.5px solid ${T.line2}`,borderRadius:16,padding:"14px 18px",marginBottom:10,cursor:"pointer",fontFamily:F}}>
                <span style={{fontSize:22}}>🗑</span>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:15,fontWeight:700,color:T.ink2,fontFamily:F}}>{S.delPmsStart}</div>
                  <div style={{fontSize:12,color:T.muted,fontFamily:F,marginTop:2}}>{S.delPmsStartSub}</div>
                </div>
              </button>
            )}
            {ps.length>1&&ps.indexOf(lpChoice)>=0&&(
              <button onClick={()=>{setPs(o=>delStart(o,lpChoice));setSel(null);setLpChoice(null);}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:T.card2,border:`1.5px solid ${T.line2}`,borderRadius:16,padding:"14px 18px",marginBottom:10,cursor:"pointer",fontFamily:F}}>
                <span style={{fontSize:22}}>🗑</span>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:15,fontWeight:700,color:T.ink2,fontFamily:F}}>{S.delPeriodStart}</div>
                  <div style={{fontSize:12,color:T.muted,fontFamily:F,marginTop:2}}>{S.delPeriodStartSub}</div>
                </div>
              </button>
            )}
            <button onClick={()=>setLpChoice(null)} style={{display:"block",width:"100%",padding:"12px 0",borderRadius:16,background:T.card2,color:T.muted,fontSize:14,fontWeight:600,fontFamily:F,border:"none",cursor:"pointer"}}>{S.cancel}</button>
          </div>
        </div>
      )}
    </div>
  );
}
