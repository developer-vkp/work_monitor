// ── GLOBALS ──────────────────────────────────────────────────────
var ROLES=['General Manager','Finance Controller','Admin Officer','Zonal Head','Zone Safety Head','School Head','Head Master','Vice Principal','SRPL Head','Regional Coordinator','Programme Officer','CCTV Coordinator','PED Coordinator','Admissions Head','Medical Officer','Engineer','RSA Officer','Other (type manually)'];
var INSTS=['Management','Key Members','Zonal Heads','Zone Safety','Admissions','School Heads','SRPL','Other'];
var PAL=['#0891B2','#7C3AED','#DB2777','#059669','#B45309','#DC2626','#0284C7','#065F46','#9333EA','#0F766E'];
function gc(id){return PAL[Math.abs(parseInt((id||'0').replace(/\D/g,''))%PAL.length)];}
function gbg(id){return gc(id)+'18';}
function ini(n){return (n||'').split(' ').filter(Boolean).slice(0,2).map(function(x){return x[0];}).join('').toUpperCase();}
function fmtDate(d){if(!d)return'';var o=new Date(d),t=new Date();t.setHours(0,0,0,0);o.setHours(0,0,0,0);var df=(t-o)/864e5;if(df===0)return'Today';if(df===1)return'Yesterday';return o.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'});}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function el(id){return document.getElementById(id);}
function todayStr(){return new Date().toISOString().slice(0,10);}
function relDate(n){return new Date(Date.now()+n*864e5).toISOString().slice(0,10);}

// ── DATA ─────────────────────────────────────────────────────────
// AUTH_USER is defined inline in the HTML to access Laravel Blade variables

var DIR={name:AUTH_USER.name,desig:'Administrator'};
var STAFF=[];
var TID=100;var TASKS=[];var FEED=[];
var _today=todayStr();
function addFeed(msg,col){FEED.unshift({id:++TID,msg:msg,col:col||'blue',time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})});if(FEED.length>50)FEED.pop();}
(function(){addFeed('WorkMonitor Pro ready','blue');})();

// ── STATE ─────────────────────────────────────────────────────────
var S={role:AUTH_USER.role||'user',staffId:AUTH_USER.id||'',selStaff:null,selDate:_today,
  view:AUTH_USER.isAdmin?'overview':'tasks',  // Default view based on role
  boardFilter:'all',boardSearch:'',boardCollapsed:{},boardDp:null,
  showAddForm:false,taskFromDate:_today,taskToDate:_today};
var _newStaff={name:'',email:'',role:'',inst:''};
var _editSD={};

// ── TOAST ─────────────────────────────────────────────────────────
function toast(msg,type){
  var e=document.createElement('div');e.className='tst ts-'+(type||'i');
  var c={'s':'var(--green)','e':'var(--red)','w':'var(--amber)','i':'var(--p3)'}[type||'i']||'var(--p3)';
  var ic={'s':'&#10003;','e':'&#10007;','w':'&#9888;','i':'i'}[type||'i']||'i';
  e.innerHTML='<span style="font-size:13px;color:'+c+';font-weight:700">'+ic+'</span><span>'+msg+'</span>';
  el('tw').appendChild(e);
  setTimeout(function(){e.style.cssText='opacity:0;transition:.3s';setTimeout(function(){e.remove();},300);},3000);
}

// ── HELPERS ──────────────────────────────────────────────────────
function perf(sid){var ts=TASKS.filter(function(t){return t.staffId===sid&&t.action;});if(!ts.length)return 0;return Math.round(ts.filter(function(t){return t.action==='Approved';}).length/ts.length*100);}
function tasksFor(sid,date){return TASKS.filter(function(t){return t.staffId===sid&&t.date===date;});}
function activeStaff(){return STAFF.filter(function(s){return s.active;});}
function allStats(){
  var ts=TASKS;var tot=ts.length;
  return{total:tot,ap:ts.filter(function(t){return t.action==='Approved';}).length,rj:ts.filter(function(t){return t.action==='Rejected';}).length,pn:ts.filter(function(t){return !t.action;}).length,dn:ts.filter(function(t){return t.status==='Done';}).length};
}

// ── LEFT PANE ────────────────────────────────────────────────────
function rLp(){
  el('lp').style.display='flex';el('lp').className='lpane';
  var active=activeStaff();

  // Build navigation items based on role
  var navItems = '';

  // Dashboard - only for Administrator role
  if(AUTH_USER.isAdmin){
    navItems += '<div class="lp-nav-item '+(S.view==='overview'?'on':'')+'" data-view="overview">'+
      '<svg class="lp-nav-ic" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>'+
      '<span class="lp-nav-lbl">Dashboard</span>'+
    '</div>';
  }

  // Tasks - for all users
  navItems += '<div class="lp-nav-item '+(S.view==='tasks'?'on':'')+'" data-view="tasks">'+
    '<svg class="lp-nav-ic" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>'+
    '<span class="lp-nav-lbl">My Tasks</span>'+
  '</div>';

  el('lp').innerHTML=
    '<div class="lp-top">'+
      '<div class="lp-nav">'+navItems+'</div>'+
    '</div>';

  // Bind
  el('lp').addEventListener('click',function(e){
    var nav=e.target.closest('[data-view]');
    if(nav){
      var view=nav.dataset.view;
      // Prevent non-admin from accessing overview
      if(view==='overview' && !AUTH_USER.isAdmin){
        toast('Access denied: Admin only','e');
        return;
      }
      S.view=view;
      S.selStaff=null;
      render();
      return;
    }
  });
}

// ── TOPBAR ───────────────────────────────────────────────────────
function rTb(){
  var isDir=AUTH_USER.isAdmin;
  var pend=TASKS.filter(function(t){return !t.action&&t.status==='Done';}).length;
  var viewTitles={overview:'Overview',board:'Task Board',timeline:'Timeline',analytics:'Analytics'};
  el('tb').innerHTML=
    '<div style="display:flex;align-items:center;gap:14px">'+
      '<button class="sidebar-toggle" id="sidebar-toggle-btn" style="width:36px;height:36px;font-size:18px;background:var(--white);border:1.5px solid var(--border);color:var(--t2)">&#9776;</button>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<img src="/storage/images/logo.png" alt="VKP Logo" style="height:32px;width:auto">'+
        '<div style="border-left:2px solid var(--border);padding-left:10px">'+
          '<div style="font-size:14px;font-weight:700;color:var(--p2);letter-spacing:-.3px;line-height:1.2">Work Monitor</div>'+
          '<div style="font-size:9px;color:var(--t3);letter-spacing:.08em;text-transform:uppercase">Admin Panel</div>'+
        '</div>'+
      '</div>'+
      '<div id="save-ind" style="font-size:9px;font-weight:600;color:var(--green);opacity:0;transition:opacity .5s;letter-spacing:.04em;margin-left:12px">&#10003; AUTO-SAVED</div>'+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:9px;margin-left:auto">'+
      '<div class="user-profile-trigger" id="user-profile-btn" style="cursor:pointer;position:relative">'+
        '<div class="ava ava-md" style="background:var(--grad);color:#fff">'+AUTH_USER.initials+'</div>'+
      '</div>'+
    '</div>';
  var profileBtn=el('user-profile-btn');if(profileBtn)profileBtn.onclick=function(e){toggleUserMenu(e);};

  // Sidebar toggle functionality
  var lpane = el('lp');
  var toggleBtn = el('sidebar-toggle-btn');
  var isPinned = localStorage.getItem('sidebar-pinned') === 'true';

  // Set initial state
  if (isPinned) {
    lpane.classList.add('expanded');
  }

  // Toggle button click
  if (toggleBtn) {
    toggleBtn.onclick = function(e) {
      e.stopPropagation();
      isPinned = !isPinned;
      localStorage.setItem('sidebar-pinned', isPinned);
      if (isPinned) {
        lpane.classList.add('expanded');
      } else {
        lpane.classList.remove('expanded');
      }
    };
  }

  // Hover to expand (only if not pinned)
  if (lpane) {
    lpane.onmouseenter = function() {
      if (!isPinned) {
        this.classList.add('expanded');
      }
    };

    lpane.onmouseleave = function() {
      if (!isPinned) {
        this.classList.remove('expanded');
      }
    };
  }
}

// ── TAB BAR ──────────────────────────────────────────────────────
function rTabBar(){
  var tbar=el('tbar');
  if(!AUTH_USER.isAdmin||S.view==='tasks'){tbar.style.display='none';return;}
  tbar.style.display='flex';
  var tabs=[{v:'overview',lbl:'&#9617; Overview'},{v:'board',lbl:'&#9776; Board'},{v:'timeline',lbl:'&#9641; Timeline'},{v:'analytics',lbl:'&#9656; Analytics'}];
  tbar.innerHTML=tabs.map(function(t){return '<div class="tab'+(S.view===t.v?' on':'')+'" data-tab="'+t.v+'">'+t.lbl+'</div>';}).join('');
  tbar.addEventListener('click',function(e){var tab=e.target.closest('[data-tab]');if(!tab)return;S.view=tab.dataset.tab;S.selStaff=null;renderContent();rLp();rTabBar();});
}

// ── STAFF MANAGEMENT PAGE ─────────────────────────────────────────
// Staff Management page removed - use User Management instead

// ── OVERVIEW ──────────────────────────────────────────────────────
function rOverview(){
  if(S.selStaff){el('ct').innerHTML='<div class="dash fi">'+rStaffDetail(S.selStaff)+'</div>';bindDetailEvents();return;}
  var st=allStats();var tot=st.total;
  var apP=tot?Math.round(st.ap/tot*100):0,rjP=tot?Math.round(st.rj/tot*100):0;
  var pnP=tot?Math.round(st.pn/tot*100):0,dnP=tot?Math.round(st.dn/tot*100):0;
  var kpis=[{cl:'kg',lbl:'Approved',val:st.ap,pct:apP,fc:'#059669'},{cl:'kr',lbl:'Rejected',val:st.rj,pct:rjP,fc:'#DC2626'},{cl:'ka',lbl:'Pending Review',val:st.pn,pct:pnP,fc:'#B45309'},{cl:'kb',lbl:'Completion',val:dnP+'%',pct:dnP,fc:'#0369A1'}];
  var kpiHTML=kpis.map(function(k){return '<div class="kpi '+k.cl+'"><div class="kpi-lbl">'+esc(k.lbl)+'</div><div class="kpi-val">'+k.val+'</div><div class="kpi-sub">'+k.pct+'% of total</div><div class="kpi-bar"><div class="kpi-fill" style="width:'+k.pct+'%;background:'+k.fc+'"></div></div></div>';}).join('');
  var active=activeStaff();
  var thumbsHTML=active.map(function(s,i){
    var st2=tasksFor(s.id,S.selDate);
    var ap2=st2.filter(function(t){return t.action==='Approved';}).length;
    var rj2=st2.filter(function(t){return t.action==='Rejected';}).length;
    var pn2=st2.filter(function(t){return !t.action;}).length;
    var p=perf(s.id);var pc=p>=70?'var(--green)':p>=40?'var(--amber)':'var(--red)';
    var dots=[1,2,3,4,5].map(function(n){var t=st2.find(function(x){return x.n===n;});var bc=!t?'var(--border)':t.action==='Approved'?'var(--green)':t.action==='Rejected'?'var(--red)':t.status==='Done'?'var(--amber)':'var(--border2)';return '<div class="st-dot" style="background:'+bc+'"></div>';}).join('');
    return '<div class="sthumb" data-i="'+i+'"><div class="st-head"><div class="ava ava-lg" style="background:'+gbg(s.id)+';color:'+gc(s.id)+'">'+ini(s.name)+'</div>'+
      '<div class="st-info"><div class="st-name">'+esc(s.name)+'</div><div class="st-role">'+esc(s.role)+'</div><div class="st-role">'+esc(s.inst)+'</div></div>'+
      '<div class="st-pct" style="color:'+pc+'">'+p+'%</div></div>'+
      '<div class="st-stats"><span class="st-s" style="background:var(--glight);color:var(--green)">&#10003; '+ap2+'</span>'+
        '<span class="st-s" style="background:var(--rlight);color:var(--red)">&#10007; '+rj2+'</span>'+
        '<span class="st-s" style="background:var(--alight);color:var(--amber)">&#9675; '+pn2+'</span></div>'+
      '<div class="st-dots">'+dots+'</div>'+
      '<div class="st-foot"><span class="st-today">'+st2.length+' of 5 tasks</span><button class="view-btn">Review &rsaquo;</button></div>'+
    '</div>';
  }).join('');
  var feedHTML=FEED.slice(0,8).map(function(a){var c={'green':'var(--green)','red':'var(--red)','amber':'var(--amber)','blue':'var(--p3)'}[a.col]||'var(--p3)';return '<div class="feed-row"><div class="feed-dot" style="background:'+c+'"></div><div><div class="feed-txt">'+esc(a.msg)+'</div><div class="feed-tm">'+esc(a.time)+'</div></div></div>';}).join('');
  el('ct').innerHTML='<div class="dash fi">'+
    '<div class="kpi-row">'+kpiHTML+'</div>'+
    '<div class="card-sec"><div class="sec-h"><div><div class="sec-title">Staff Overview &mdash; '+esc(fmtDate(S.selDate))+'</div><div class="sec-sub" style="margin-top:1px">Click any card to review tasks</div></div><div class="live">Live</div></div>'+
      '<div class="thumb-grid" id="tg">'+thumbsHTML+'</div></div>'+
    '<div class="card-sec"><div class="sec-h"><div class="sec-title">Activity</div><div class="live">Live</div></div>'+(FEED.length?feedHTML:'<div style="font-size:11px;color:var(--t4)">No activity yet.</div>')+'</div>'+
  '</div>';
  var tg=el('tg');if(tg)tg.addEventListener('click',function(e){var c=e.target.closest('.sthumb');if(!c)return;var s=activeStaff()[parseInt(c.dataset.i)];if(s){S.selStaff=s.id;rOverview();}});
}

// ── BOARD VIEW ────────────────────────────────────────────────────
function rBoard(){
  if(S.selStaff){el('ct').innerHTML='<div class="board-wrap fi">'+rStaffDetail(S.selStaff)+'</div>';bindDetailEvents();return;}
  var active=activeStaff();
  // filter / search tasks
  var allTs=TASKS.filter(function(t){var s=STAFF.find(function(x){return x.id===t.staffId;});return s&&s.active;});
  if(S.boardSearch){var q=S.boardSearch.toLowerCase();allTs=allTs.filter(function(t){var s=STAFF.find(function(x){return x.id===t.staffId;});return t.desc.toLowerCase().includes(q)||(s&&s.name.toLowerCase().includes(q));});}
  if(S.boardFilter==='approved')allTs=allTs.filter(function(t){return t.action==='Approved';});
  else if(S.boardFilter==='rejected')allTs=allTs.filter(function(t){return t.action==='Rejected';});
  else if(S.boardFilter==='pending')allTs=allTs.filter(function(t){return !t.action;});
  else if(S.boardFilter==='today')allTs=allTs.filter(function(t){return t.date===S.selDate;});
  // group by staff
  var groups=active.map(function(s,gi){
    var ts=allTs.filter(function(t){return t.staffId===s.id;});
    var ap=ts.filter(function(t){return t.action==='Approved';}).length;
    var rj=ts.filter(function(t){return t.action==='Rejected';}).length;
    var pn=ts.filter(function(t){return !t.action;}).length;
    var stripe=PAL[gi%PAL.length];
    // Initialize collapsed state - default to collapsed
    if(S.boardCollapsed[s.id]===undefined)S.boardCollapsed[s.id]=true;
    var coll=S.boardCollapsed[s.id];
    var rowsHTML='';
    if(!coll){
      ts.forEach(function(t){
        var rc=t.action==='Approved'?' ta':t.action==='Rejected'?' tr':'';
        var isDp=S.boardDp===t.id;
        var acBtn='<div class="dp-wrap">'+
          '<button class="bdg '+(t.action==='Approved'?'bdg-ap':t.action==='Rejected'?'bdg-rj':'bdg-nr')+'" data-dpid="'+t.id+'">'+(t.action==='Approved'?'&#10004; Approved':t.action==='Rejected'?'&#10006; Rejected':'&#9675; Review')+' &#9662;</button>'+
          (isDp?'<div class="dp-menu">'+
            '<div class="dp-item g" data-act="ap" data-tid="'+t.id+'"><span class="dp-dot" style="background:var(--green)"></span>Approve</div>'+
            '<div class="dp-item r" data-act="rj" data-tid="'+t.id+'"><span class="dp-dot" style="background:var(--red)"></span>Reject</div>'+
            '<div class="dp-div"></div>'+
            '<div class="dp-item" data-act="cl" data-tid="'+t.id+'"><span class="dp-dot" style="background:var(--t4)"></span>Clear</div>'+
            '<div class="dp-item" data-act="rm" data-tid="'+t.id+'"><span class="dp-dot" style="background:var(--red)"></span>Remarks&hellip;</div>'+
          '</div>':'')+
        '</div>';
        var priColor=t.priority==='High'?'var(--red)':t.priority==='Medium'?'var(--amber)':'var(--green)';
        rowsHTML+='<tr class="btr'+rc+'" data-tid="'+t.id+'">'+
          '<td><span class="bd-num">'+t.n+'</span></td>'+
          '<td><div class="bd-desc" title="'+esc(t.desc)+'">'+esc(t.desc.length>55?t.desc.slice(0,55)+'...':t.desc)+'</div></td>'+
          '<td><span class="bdg '+(t.status==='Done'?'bdg-g':'bdg-p')+'">'+(t.status==='Done'?'Done':'Pending')+'</span></td>'+
          '<td>'+acBtn+'</td>'+
          '<td><span style="font-size:10px;font-weight:600;color:'+priColor+'">'+esc(t.priority)+'</span></td>'+
          '<td style="font-size:10px;color:var(--t3)">'+esc(fmtDate(t.date))+'</td>'+
          '<td><div class="rem-cell'+(t.remarks?'':' rem-empty')+'" data-act="rm" data-tid="'+t.id+'">'+(t.remarks?esc(t.remarks.slice(0,30))+(t.remarks.length>30?'...':''):'Add remark...')+'</div></td>'+
          '<td><button class="btn btn-out btn-xs edit-btn-row" data-act="rv" data-sid="'+s.id+'">Review</button></td>'+
        '</tr>';
      });
    }
    return '<div class="board-group">'+
      '<div class="bg-header" data-grp="'+s.id+'">'+
        '<div class="bg-stripe" style="background:'+stripe+'"></div>'+
        '<span class="bg-chev'+(coll?'':' open')+'">&rsaquo;</span>'+
        '<div class="bg-title">'+esc(s.name)+' <span style="font-size:10px;font-weight:400;color:var(--t3)">'+esc(s.role)+'</span></div>'+
        '<span class="bg-count">'+ts.length+'</span>'+
        '<div class="bg-stats"><span style="color:var(--green)">&#10003; '+ap+'</span><span style="color:var(--red)">&#10007; '+rj+'</span><span style="color:var(--amber)">&#9675; '+pn+'</span></div>'+
      '</div>'+
      (!coll?'<table class="board-tbl"><thead><tr>'+
        ['#','Task','Status','Action','Priority','Date','Remarks',''].map(function(h){return '<th>'+h+'</th>';}).join('')+
      '</tr></thead><tbody>'+rowsHTML+'</tbody></table>':'')+'</div>';
  }).join('');
  var filterPills=[['all','All'],['today','Today'],['approved','Approved'],['rejected','Rejected'],['pending','Pending']];
  el('ct').innerHTML='<div class="board-wrap fi">'+
    '<div class="board-toolbar">'+
      '<div class="search-box"><span style="color:var(--t4)">&#9906;</span><input id="bd-srch" placeholder="Search tasks..." value="'+esc(S.boardSearch)+'"></div>'+
      '<div class="board-divider"></div>'+
      filterPills.map(function(f){return '<button class="filter-pill'+(S.boardFilter===f[0]?' on':'')+'" data-filter="'+f[0]+'">'+f[1]+'</button>';}).join('')+
      '<div class="board-divider"></div>'+
      '<span style="font-size:11px;color:var(--t3);margin-left:auto">'+allTs.length+' tasks</span>'+
    '</div>'+
    (groups||'<div style="text-align:center;padding:40px;color:var(--t4);font-size:13px">No tasks match the current filter.</div>')+
  '</div>';
  // Bind search
  var bdSrch=el('bd-srch');if(bdSrch)bdSrch.oninput=function(){S.boardSearch=this.value;rBoard();};
}

// ── TIMELINE VIEW ─────────────────────────────────────────────────
function rTimeline(){
  var active=activeStaff();
  // show last 7 days + next 2
  var days=[];for(var i=-6;i<=2;i++)days.push(relDate(i));
  var dayLabels=days.map(function(d){var o=new Date(d),t=new Date();t.setHours(0,0,0,0);o.setHours(0,0,0,0);var df=(t-o)/864e5;return{date:d,lbl:df===0?'Today':df===1?'Yest':o.toLocaleDateString('en-IN',{day:'2-digit',month:'short'}),isToday:df===0};});
  var rows=active.map(function(s){
    var cells=days.map(function(d){
      var ts=tasksFor(s.id,d);if(!ts.length)return '<td class="tl-cell"><div class="tl-empty"></div></td>';
      var ap=ts.filter(function(t){return t.action==='Approved';}).length;
      var rj=ts.filter(function(t){return t.action==='Rejected';}).length;
      var dn=ts.filter(function(t){return t.status==='Done';}).length;
      var tot=ts.length;
      var pct=Math.round(ap/tot*100);
      var c=pct>=80?'#059669':pct>=40?'#B45309':'#DC2626';
      var w=Math.max(20,Math.round(ap/5*100));
      return '<td class="tl-cell"><div class="tl-seg" style="background:'+c+';left:10%;width:'+w+'%;opacity:.85" title="'+tot+' tasks, '+ap+' approved">'+ap+'/'+tot+'</div></td>';
    }).join('');
    var p=perf(s.id);var pc=p>=70?'var(--green)':p>=40?'var(--amber)':'var(--red)';
    return '<tr class="tl-tr">'+
      '<td class="tl-td lbl"><div class="tl-name">'+esc(s.name)+'</div><div class="tl-sub">'+esc(s.role)+'</div></td>'+
      cells+
      '<td style="padding:0 12px;font-size:11px;font-weight:600;color:'+pc+'">'+p+'%</td>'+
    '</tr>';
  }).join('');
  el('ct').innerHTML='<div class="timeline-wrap fi">'+
    '<div class="card-sec">'+
      '<div class="sec-h"><div class="sec-title">Task Timeline &mdash; Past 6 Days + Next 2</div><div class="sec-sub">Approved / total tasks per day</div></div>'+
      '<div class="tl-grid">'+
        '<table class="tl-table">'+
          '<thead><tr>'+
            '<th class="tl-th lbl">Staff Member</th>'+
            dayLabels.map(function(d){return '<th class="tl-th" style="'+(d.isToday?'color:var(--p2);background:var(--bg2)':'')+'">'+esc(d.lbl)+'</th>';}).join('')+
            '<th class="tl-th">Rate</th>'+
          '</tr></thead>'+
          '<tbody>'+rows+'</tbody>'+
        '</table>'+
      '</div>'+
    '</div>'+
    '<div class="card-sec">'+
      '<div class="sec-h"><div class="sec-title">Legend</div></div>'+
      '<div style="display:flex;gap:16px;flex-wrap:wrap">'+
        '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--t2)"><div style="width:20px;height:10px;border-radius:3px;background:#059669"></div>High approval (&ge;80%)</div>'+
        '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--t2)"><div style="width:20px;height:10px;border-radius:3px;background:#B45309"></div>Moderate (40&ndash;79%)</div>'+
        '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--t2)"><div style="width:20px;height:10px;border-radius:3px;background:#DC2626"></div>Needs attention (&lt;40%)</div>'+
        '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--t2)"><div style="width:10px;height:10px;border-radius:50%;background:var(--border)"></div>No tasks</div>'+
      '</div>'+
    '</div>'+
  '</div>';
}

// ── ANALYTICS VIEW ────────────────────────────────────────────────
function rAnalytics(){
  var active=activeStaff();
  var st=allStats();var tot=st.total||1;
  // Bar chart: tasks per staff
  var maxT=Math.max.apply(null,active.map(function(s){return TASKS.filter(function(t){return t.staffId===s.id;}).length;})||[1]);
  var barHTML=active.map(function(s){
    var cnt=TASKS.filter(function(t){return t.staffId===s.id;}).length;
    var h=Math.round(cnt/maxT*100);
    return '<div style="flex:1;display:flex;flex-direction:column;align-items:center">'+
      '<div class="bc-bar" style="height:'+h+'px;background:'+gc(s.id)+'">'+
        '<div class="bc-val">'+cnt+'</div>'+
      '</div>'+
      '<div class="bc-lbl">'+esc(s.name.split(' ')[0])+'</div>'+
    '</div>';
  }).join('');
  // Donut (SVG)
  var r=36,cx=44,cy=44,circ=2*Math.PI*r;
  var apFrac=st.ap/tot,rjFrac=st.rj/tot,pnFrac=st.pn/tot;
  var ap_d=apFrac*circ,rj_d=rjFrac*circ,pn_d=pnFrac*circ;
  var ap_offset=0,rj_offset=circ-ap_d,pn_offset=circ-(ap_d+rj_d);
  var donutSVG='<svg width="88" height="88" viewBox="0 0 88 88" class="ring">'+
    '<circle class="ring-bg" cx="44" cy="44" r="36"></circle>'+
    '<circle class="ring-fill" cx="44" cy="44" r="36" stroke="#059669" stroke-dasharray="'+ap_d+' '+(circ-ap_d)+'" stroke-dashoffset="0"></circle>'+
    '<circle class="ring-fill" cx="44" cy="44" r="36" stroke="#DC2626" stroke-dasharray="'+rj_d+' '+(circ-rj_d)+'" stroke-dashoffset="-'+ap_d+'"></circle>'+
    '<circle class="ring-fill" cx="44" cy="44" r="36" stroke="#B45309" stroke-dasharray="'+pn_d+' '+(circ-pn_d)+'" stroke-dashoffset="-'+(ap_d+rj_d)+'"></circle>'+
    '<text x="44" y="47" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text)" font-family="Inter">'+st.ap+'</text>'+
  '</svg>';
  // Perf rows
  var perfHTML=active.map(function(s){
    var p=perf(s.id);var pc=p>=70?'var(--green)':p>=40?'var(--amber)':'var(--red)';
    return '<div class="perf-row"><div class="perf-name">'+esc(s.name.split(' ')[0]+' '+s.name.split(' ')[1])+'</div>'+
      '<div class="perf-bar-bg"><div class="perf-bar-fill" style="width:'+p+'%;background:'+pc+'"></div></div>'+
      '<div class="perf-pct" style="color:'+pc+'">'+p+'%</div>'+
    '</div>';
  }).join('');
  // Submission rate (tasks submitted today vs expected)
  var expected=active.length*5;
  var submitted=active.reduce(function(a,s){return a+tasksFor(s.id,S.selDate).length;},0);
  var subPct=expected?Math.round(submitted/expected*100):0;
  el('ct').innerHTML='<div class="analytics-wrap fi">'+
    '<div class="kpi-row">'+
      '<div class="kpi kb"><div class="kpi-lbl">Total Tasks</div><div class="kpi-val">'+st.total+'</div><div class="kpi-sub">All time</div></div>'+
      '<div class="kpi kg"><div class="kpi-lbl">Approval Rate</div><div class="kpi-val">'+Math.round(st.ap/(st.total||1)*100)+'%</div><div class="kpi-sub">Overall</div></div>'+
      '<div class="kpi ka"><div class="kpi-lbl">Today Submitted</div><div class="kpi-val">'+submitted+'</div><div class="kpi-sub">of '+expected+' expected</div></div>'+
      '<div class="kpi kr"><div class="kpi-lbl">Submission Rate</div><div class="kpi-val">'+subPct+'%</div><div class="kpi-sub">'+esc(fmtDate(S.selDate))+'</div></div>'+
    '</div>'+
    '<div class="an-grid">'+
      '<div class="chart-card"><div class="cc-title">Tasks by Staff Member</div>'+
        '<div class="bar-chart">'+barHTML+'</div>'+
      '</div>'+
      '<div class="chart-card"><div class="cc-title">Action Breakdown</div>'+
        '<div class="donut-wrap">'+donutSVG+
          '<div class="donut-leg">'+
            '<div class="leg-item"><div class="leg-dot" style="background:var(--green)"></div><span class="leg-lbl">Approved</span><span class="leg-val">'+st.ap+'</span></div>'+
            '<div class="leg-item"><div class="leg-dot" style="background:var(--red)"></div><span class="leg-lbl">Rejected</span><span class="leg-val">'+st.rj+'</span></div>'+
            '<div class="leg-item"><div class="leg-dot" style="background:var(--amber)"></div><span class="leg-lbl">Pending</span><span class="leg-val">'+st.pn+'</span></div>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="card-sec"><div class="sec-h"><div class="sec-title">Staff Performance (Approval Rate)</div></div>'+
      '<div>'+perfHTML+'</div>'+
    '</div>'+
  '</div>';
}

// ── STAFF DETAIL ─────────────────────────────────────────────────
function rStaffDetail(sid){
  var s=STAFF.find(function(x){return x.id===sid;});if(!s)return'';
  var ts=tasksFor(sid,S.selDate);var p=perf(sid);var pc=p>=70?'var(--green)':p>=40?'var(--amber)':'var(--red)';
  var rows=[1,2,3,4,5].map(function(n){
    var t=ts.find(function(x){return x.n===n;});
    if(!t)return '<div class="trow-empty">Task '+n+' &mdash; not submitted</div>';
    var rc=t.action==='Approved'?' ta':t.action==='Rejected'?' tr':'';
    return '<div class="trow'+rc+'"><div class="trow-n">'+n+'</div>'+
      '<div class="trow-body">'+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
          '<div class="trow-desc" style="margin:0;flex:1">'+esc(t.desc)+'</div>'+
          '<div style="display:flex;gap:4px;flex-shrink:0">'+
            '<button class="btn-icon btn-icon-grn" title="Approve" style="'+(t.action==='Approved'?'background:var(--green);color:#fff;':'')+'" data-act="approve" data-tid="'+t.id+'">'+
              '<svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'+
              '</svg>'+
            '</button>'+
            '<button class="btn-icon btn-icon-red" title="Reject" style="'+(t.action==='Rejected'?'background:var(--red);color:#fff;':'')+'" data-act="reject" data-tid="'+t.id+'">'+
              '<svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'+
              '</svg>'+
            '</button>'+
            (t.action?'<button class="btn-icon" title="Clear" data-act="clear" data-tid="'+t.id+'">'+
              '<svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'+
              '</svg>'+
            '</button>':'')+
            '<button class="btn-icon btn-icon-pri" title="Save Remarks" data-act="savrem" data-tid="'+t.id+'">'+
              '<svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>'+
              '</svg>'+
            '</button>'+
          '</div>'+
        '</div>'+
        '<div class="trow-meta">'+
          '<span class="bdg '+(t.status==='Done'?'bdg-g':'bdg-p')+'">'+(t.status==='Done'?'Done':'Pending')+'</span>'+
          '<span style="font-size:10px;color:'+( t.priority==='High'?'var(--red)':t.priority==='Medium'?'var(--amber)':'var(--green)')+'">'+esc(t.priority)+'</span>'+
          (t.staffRem?'<span style="font-size:10px;color:var(--t3);font-style:italic">Note: &ldquo;'+esc(t.staffRem.slice(0,40))+'&rdquo;</span>':'')+
        '</div>'+
        (t.remarks?'<div style="margin-top:8px;padding:8px 10px;background:var(--alight);border-left:3px solid var(--amber);border-radius:4px">'+
          '<div style="font-size:9px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Director Remarks:</div>'+
          '<div style="font-size:11px;color:var(--t2);line-height:1.4">'+esc(t.remarks)+'</div>'+
        '</div>':'')+
        '<div style="margin-top:8px">'+
          '<div style="font-size:10px;font-weight:600;color:var(--t3);margin-bottom:4px">Add/Edit Remarks:</div>'+
          '<textarea class="rem-ta" data-remid="'+t.id+'" placeholder="Remarks for '+esc(s.name.split(' ')[0])+'..." style="width:100%;min-height:60px;resize:vertical">'+esc(t.remarks||'')+'</textarea>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');
  return '<div class="sdetail">'+
    '<div class="sd-hdr">'+
      '<div class="ava ava-lg" style="background:rgba(255,255,255,.18);color:#fff;border:1.5px solid rgba(255,255,255,.3)">'+ini(s.name)+'</div>'+
      '<div style="flex:1"><div class="sd-title">'+esc(s.name)+'</div><div class="sd-sub">'+esc(s.role)+' &middot; '+esc(s.inst)+' &middot; '+esc(fmtDate(S.selDate))+' &middot; Approval: <strong style="color:#A5F3FC">'+p+'%</strong></div></div>'+
      '<button class="sd-back" id="sd-back">&#8592; Back</button>'+
    '</div><div id="detail-rows">'+rows+'</div></div>';
}
function bindDetailEvents(){
  var b=el('sd-back');if(b)b.onclick=function(){S.selStaff=null;renderContent();};
  var dr=el('detail-rows');if(!dr)return;
  dr.addEventListener('click',function(e){
    var btn=e.target.closest('[data-act]');if(!btn)return;
    var act=btn.dataset.act;var tid=parseInt(btn.dataset.tid);
    var t=TASKS.find(function(x){return x.id===tid;});if(!t)return;
    var s=STAFF.find(function(x){return x.id===t.staffId;});
    if(act==='approve'){
      t.action='Approved';
      toast(s.name+' Task '+t.n+' Approved','s');
      addFeed(s.name.split(' ')[0]+' Task '+t.n+' Approved','green');
      schedSave();
      renderContent();
      bindDetailEvents();
    }
    else if(act==='reject'){
      t.action='Rejected';
      toast(s.name+' Task '+t.n+' Rejected','e');
      addFeed(s.name.split(' ')[0]+' Task '+t.n+' Rejected','red');
      schedSave();
      renderContent();
      bindDetailEvents();
    }
    else if(act==='clear'){
      t.action='';
      toast('Cleared','i');
      schedSave();
      renderContent();
      bindDetailEvents();
    }
    else if(act==='savrem'){
      var ri=dr.querySelector('[data-remid="'+tid+'"]');
      if(ri&&t){
        t.remarks=ri.value.trim();
        toast('Remarks saved successfully','s');
        addFeed('Remarks updated for '+s.name.split(' ')[0]+' Task '+t.n,'amber');
        schedSave();
        renderContent();
        bindDetailEvents();
      }
    }
  });
}

// ── STAFF TASK FORM ───────────────────────────────────────────────
function rStaffView(){
  var s=STAFF.find(function(x){return x.id===S.staffId;});
  if(!s){
    el('ct').innerHTML='<div style="padding:40px;text-align:center">'+
      '<div style="font-size:32px;margin-bottom:12px">&#128100;</div>'+
      '<div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px">No Staff Selected</div>'+
      '<div style="font-size:12px;color:var(--t3)">Select a staff member from the dropdown above</div>'+
    '</div>';
    return;
  }
  var ts=tasksFor(S.staffId,S.selDate);
  var submitted=ts.length>=5;
  var allApproved=ts.length>0&&ts.every(function(t){return t.action==='Approved';});
  var hasRejected=ts.some(function(t){return t.action==='Rejected';});

  // Staff info header
  var headerHTML=
    '<div style="background:var(--grad);padding:18px 22px;border-radius:var(--rl) var(--rl) 0 0;display:flex;align-items:center;gap:14px">'+
      '<div class="ava ava-xl" style="background:rgba(255,255,255,.2);color:#fff;border:2px solid rgba(255,255,255,.35)">'+ini(s.name)+'</div>'+
      '<div>'+
        '<div style="font-size:16px;font-weight:700;color:#fff;letter-spacing:-.3px">'+esc(s.name)+'</div>'+
        '<div style="font-size:11px;color:rgba(255,255,255,.7);margin-top:2px">'+esc(s.role)+' &nbsp;&bull;&nbsp; '+esc(s.inst)+'</div>'+
        '<div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:3px">&#128197; '+esc(fmtDate(S.selDate))+'</div>'+
      '</div>'+
      '<div style="margin-left:auto;text-align:right">'+
        '<div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-1px">'+ts.length+'<span style="font-size:14px;font-weight:500;opacity:.7">/5</span></div>'+
        '<div style="font-size:10px;color:rgba(255,255,255,.65);text-transform:uppercase;letter-spacing:.06em">Tasks Submitted</div>'+
        (submitted?'<div style="font-size:10px;font-weight:700;color:#A5F3FC;margin-top:4px;background:rgba(255,255,255,.1);padding:3px 9px;border-radius:10px">&#10003; COMPLETE</div>':'')+
      '</div>'+
    '</div>';

  // Status banner
  var bannerHTML='';
  if(allApproved){
    bannerHTML='<div style="background:var(--glight);border:1.5px solid var(--gborder);border-radius:var(--r);padding:10px 14px;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--green);margin-bottom:14px">'+
      '<span style="font-size:16px">&#127881;</span> All your tasks have been approved by the Director!</div>';
  } else if(hasRejected){
    bannerHTML='<div style="background:var(--rlight);border:1.5px solid var(--rborder);border-radius:var(--r);padding:10px 14px;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--red);margin-bottom:14px">'+
      '<span style="font-size:16px">&#9888;</span> Some tasks need revision. See Director remarks below and resubmit.</div>';
  } else if(submitted){
    bannerHTML='<div style="background:rgba(8,145,178,.08);border:1.5px solid rgba(8,145,178,.2);border-radius:var(--r);padding:10px 14px;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--p2);margin-bottom:14px">'+
      '<span style="font-size:16px">&#9203;</span> Tasks submitted. Awaiting Director review.</div>';
  } else {
    bannerHTML='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:9px 13px;font-size:11px;color:var(--t2);margin-bottom:14px">'+
      '&#9432;&nbsp; Fill in all 5 tasks for today and click <strong>Submit All Tasks</strong> when done.</div>';
  }

  // Task blocks
  var blocksHTML=[1,2,3,4,5].map(function(n){
    var t=ts.find(function(x){return x.n===n;});
    var desc=t?t.desc:'';
    var status=t?t.status:'Pending';
    var hasRemarks=t&&t.remarks;
    var actionColor=t&&t.action==='Approved'?'var(--green)':t&&t.action==='Rejected'?'var(--red)':'var(--t4)';
    var actionText=t&&t.action?t.action:'Awaiting review';
    var actionIcon=t&&t.action==='Approved'?'&#10004;':t&&t.action==='Rejected'?'&#10006;':'&#9203;';
    var isRejected=t&&t.action==='Rejected';

    return '<div class="task-blk" style="'+(isRejected?'border-color:var(--rborder);':'')+'">'+
      '<div class="tblk-h" style="'+(isRejected?'background:var(--rlight);':'')+'">'+
        '<div class="tblk-n" style="'+(isRejected?'background:var(--red);':'')+'">'+n+'</div>'+
        '<span class="tblk-lbl">Task '+n+' of 5</span>'+
        '<div style="margin-left:auto;display:flex;align-items:center;gap:6px">'+
          '<span class="bdg '+(status==='Done'?'bdg-g':'bdg-p')+'" style="font-size:9px">'+(status==='Done'?'Done':'Pending')+'</span>'+
          '<span style="font-size:10px;font-weight:600;color:'+actionColor+'">'+actionIcon+' '+esc(actionText)+'</span>'+
        '</div>'+
      '</div>'+
      '<div class="tblk-b">'+
        '<textarea class="tblk-ta" id="t-d-'+n+'" rows="3" oninput="schedSave()" placeholder="Describe what you did for Task '+n+' today...">'+esc(desc)+'</textarea>'+
        '<div class="tblk-row">'+
          '<label style="font-size:10px;font-weight:600;color:var(--t3)">Status:</label>'+
          '<select class="tblk-sel" id="t-s-'+n+'" onchange="schedSave()">'+
            '<option value="Pending"'+(status==='Pending'?' selected':'')+'>&#9675; Pending</option>'+
            '<option value="Done"'+(status==='Done'?' selected':'')+'>&#10003; Done</option>'+
          '</select>'+
          (hasRemarks?'<div style="flex:1;background:var(--rlight);border:1px solid var(--rborder);border-radius:5px;padding:3px 8px;font-size:10px;color:var(--red);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+
            '<strong>Director:</strong> '+esc(t.remarks.slice(0,55))+'</div>':'')+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');

  // Overall remarks
  
  var sr=ts.length?ts[0].staffRem||'':'';
  var remarksHTML=
    '<div class="rem-blk" style="margin-top:6px">'+
      '<div class="rem-bh">'+
        '<span style="font-size:14px">&#128172;</span>'+
        '<span class="rem-bl">Overall Remarks <span style="font-size:9px;font-weight:400;color:var(--t3)">(Optional — general notes for the Director)</span></span>'+
      '</div>'+
      '<textarea class="rem-bta" id="staff-rem" oninput="schedSave()" placeholder="Any general notes, challenges, or context for today\'s work...">'+esc(sr)+'</textarea>'+
    '</div>';

  // Progress bar
  var doneCount=ts.filter(function(t){return t.status==='Done';}).length;
  var progPct=Math.round(ts.length/5*100);
  var progressHTML=
    '<div style="margin-bottom:14px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">'+
        '<span style="font-size:10px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.06em">Today\'s Progress</span>'+
        '<span style="font-size:10px;font-family:var(--mono);color:var(--p2);font-weight:600">'+ts.length+'/5 submitted &nbsp;&bull;&nbsp; '+doneCount+' done</span>'+
      '</div>'+
      '<div style="height:6px;background:var(--bg2);border-radius:3px;overflow:hidden">'+
        '<div style="height:100%;width:'+progPct+'%;background:var(--grad2);border-radius:3px;transition:width .5s"></div>'+
      '</div>'+
    '</div>';

  el('ct').innerHTML=
    '<div class="sf-wrap fi">'+
      '<div class="sf-card" style="padding:0;overflow:hidden">'+
        headerHTML+
        '<div style="padding:18px 20px">'+
          progressHTML+
          bannerHTML+
          blocksHTML+
          remarksHTML+
          '<div class="sf-foot" style="margin-top:14px">'+
            '<button class="btn btn-out btn-sm" id="sf-cl">&#8635; Clear Form</button>'+
            '<div style="flex:1"></div>'+
            '<button class="btn btn-pri" id="sf-sb" style="padding:9px 22px;font-size:13px">'+
              '&#10003;&nbsp; Submit All Tasks'+
            '</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';

  var sfC=el('sf-cl');
  if(sfC)sfC.onclick=function(){
    if(!confirm('Clear all filled task descriptions?'))return;
    for(var n=1;n<=5;n++){var d=el('t-d-'+n);if(d)d.value='';}
    var r=el('staff-rem');if(r)r.value='';
    toast('Form cleared','i');
  };
  var sfS=el('sf-sb');if(sfS)sfS.onclick=submitTasks;
}

function submitTasks(){
  var s=STAFF.find(function(x){return x.id===S.staffId;});if(!s)return;
  var saved=0;var priorities=['High','High','Medium','Medium','Low'];
  for(var n=1;n<=5;n++){
    var dEl=el('t-d-'+n);var stEl=el('t-s-'+n);
    var desc=dEl?dEl.value.trim():'';if(!desc)continue;
    var st2=stEl?stEl.value:'Pending';
    var ex=TASKS.find(function(t){return t.staffId===S.staffId&&t.date===S.selDate&&t.n===n;});
    if(ex){ex.desc=desc;ex.status=st2;}
    else TASKS.push({id:++TID,staffId:S.staffId,date:S.selDate,n:n,desc:desc,status:st2,action:'',remarks:'',staffRem:'',priority:priorities[n-1]});
    saved++;
  }
  if(!saved){toast('Fill at least one task','w');return;}
  var srEl=el('staff-rem');
  if(srEl&&srEl.value.trim()){var v=srEl.value.trim();TASKS.filter(function(t){return t.staffId===S.staffId&&t.date===S.selDate;}).forEach(function(t){t.staffRem=v;});}
  toast(saved+' task'+(saved>1?'s':'')+' submitted','s');addFeed(s.name.split(' ')[0]+' submitted '+saved+' tasks','blue');
  rLp();render();
}

// ── MODALS ───────────────────────────────────────────────────────
function showOv(html){closeOv();var w=document.createElement('div');w.className='ov';w.id='ov-root';w.innerHTML=html;w.onclick=function(e){if(e.target===w)closeOv();};document.body.appendChild(w);}
function closeOv(){var w=el('ov-root');if(w)w.remove();}

function openEditStaff(id){
  var s=STAFF.find(function(x){return x.id===id;});if(!s)return;
  var dept=s.department||s.inst||'';
  var roleIsCustom=ROLES.indexOf(s.role)<0;
  var deptIsCustom=INSTS.indexOf(dept)<0;
  var roleOpts=ROLES.map(function(r){return '<option value="'+esc(r)+'"'+(s.role===r?' selected':'')+'>'+esc(r)+'</option>';}).join('');
  var deptOpts=INSTS.map(function(r){return '<option value="'+esc(r)+'"'+(dept===r?' selected':'')+'>'+esc(r)+'</option>';}).join('');
  showOv('<div class="modal" onclick="event.stopPropagation()">'+
    '<div class="m-head"><div class="ava ava-md" style="background:'+gbg(s.id)+';color:'+gc(s.id)+'">'+ini(s.name)+'</div><div class="m-title">Edit Staff</div>'+
      '<button class="btn btn-out btn-sm" id="m-x" style="padding:3px 7px">&#10005;</button></div>'+
    '<div class="m-body"><div class="ml">Full Name *</div><input class="mi" id="es-name" value="'+esc(s.name)+'">'+
      '<div class="ml">Email</div><input class="mi" id="es-email" value="'+esc(s.email||'')+'">'+
      '<div class="ml">Role / Designation</div><select class="msel" id="es-role">'+roleOpts+'<option value="Other"'+(roleIsCustom?' selected':'')+'>Other (manual)</option></select>'+
        '<div id="es-rc-w" style="'+(roleIsCustom?'':'display:none;')+'margin-top:6px"><input class="mi last" id="es-rc" placeholder="Enter role" value="'+(roleIsCustom?esc(s.role):'')+'"></div>'+
      '<div class="ml" style="margin-top:9px">Department / Institution</div>'+
        '<select class="msel" id="es-dept">'+deptOpts+'<option value="Other"'+(deptIsCustom?' selected':'')+'>Other (manual)</option></select>'+
        '<div id="es-dc-w" style="'+(deptIsCustom?'':'display:none;')+'margin-top:6px"><input class="mi last" id="es-dc" placeholder="Enter department" value="'+(deptIsCustom?esc(dept):'')+'"></div>'+
      '<div style="background:var(--bg2);border-radius:var(--r);padding:8px 11px;font-size:11px;color:var(--t3);margin-top:12px">ID: <span style="font-family:var(--mono);color:var(--p2);font-weight:600">'+esc(s.id)+'</span></div>'+
    '</div>'+
    '<div class="m-foot"><button class="btn btn-red btn-sm" id="es-del">Remove</button>'+
      '<div style="flex:1"></div><button class="btn btn-out btn-sm" id="es-cn">Cancel</button>'+
      '<button class="btn btn-pri btn-sm" id="es-sv">Save</button></div>'+
  '</div>');
  el('m-x').onclick=closeOv;el('es-cn').onclick=closeOv;
  el('es-del').onclick=function(){closeOv();confirmRemove(id);};
  el('es-role').onchange=function(){el('es-rc-w').style.display=(this.value==='Other'||this.value==='Other (manual)')?'block':'none';};
  el('es-dept').onchange=function(){el('es-dc-w').style.display=this.value==='Other'?'block':'none';};
  el('es-sv').onclick=function(){
    var nm=(el('es-name')||{}).value||'';if(!nm.trim()){toast('Name required','w');return;}
    var role=(el('es-role')||{}).value||s.role;
    if(role==='Other'||role==='Other (manual)'){role=((el('es-rc')||{}).value||'').trim();if(!role){toast('Enter role','w');return;}}
    var dept=(el('es-dept')||{}).value||dept;
    if(dept==='Other'){dept=((el('es-dc')||{}).value||'').trim();if(!dept){toast('Enter department','w');return;}}
    s.name=nm.trim();s.email=(el('es-email')||{}).value||'';s.role=role;s.department=dept;s.inst=dept;
    closeOv();toast('Updated: '+esc(s.name),'s');addFeed(s.name+' updated','amber');schedSave();render();
  };
}

function openDirEdit(){
  showOv('<div class="modal" onclick="event.stopPropagation()">'+
    '<div class="m-head"><div class="ava ava-md" style="background:'+gbg('D00')+';color:'+gc('D00')+'">'+ini(DIR.name)+'</div>'+
      '<div class="m-title">Director Profile</div><button class="btn btn-out btn-sm" id="m-x" style="padding:3px 7px">&#10005;</button></div>'+
    '<div class="m-body"><div class="ml">Full Name *</div><input class="mi" id="dir-n" value="'+esc(DIR.name)+'">'+
      '<div class="ml">Designation</div><input class="mi last" id="dir-d" value="'+esc(DIR.desig)+'"></div>'+
    '<div class="m-foot"><button class="btn btn-out btn-sm" id="m-cn">Cancel</button>'+
      '<button class="btn btn-pri btn-sm" id="dir-sv">&#10003; Save</button></div>'+
  '</div>');
  el('m-x').onclick=closeOv;el('m-cn').onclick=closeOv;
  el('dir-sv').onclick=function(){var nm=(el('dir-n')||{}).value||'';if(!nm.trim()){toast('Name required','w');return;}DIR.name=nm.trim();DIR.desig=(el('dir-d')||{}).value||DIR.desig;closeOv();toast('Profile updated','s');rLp();};
}

function openAssign(id){
  var s=STAFF.find(function(x){return x.id===id;});if(!s)return;
  var existing=tasksFor(s.id,S.selDate);var rem=10-existing.length;
  var exRows=existing.map(function(t){return '<div class="at-row"><div class="at-n">'+t.n+'</div>'+
    '<div class="at-desc">'+esc(t.desc)+'</div>'+
    '<span class="bdg '+(t.status==='Done'?'bdg-g':'bdg-p')+'" style="font-size:9px">'+(t.status==='Done'?'Done':'Pend')+'</span>'+
    '<button class="at-del" data-delid="'+t.id+'">&#10005;</button></div>';}).join('');
  var staffOpts=STAFF.filter(function(x){return x.active;}).map(function(x){return '<option value="'+esc(x.id)+'"'+(x.id===s.id?' selected':'')+'>'+esc(x.name)+'</option>';}).join('');
  showOv('<div class="modal" onclick="event.stopPropagation()">'+
    '<div class="m-head"><div class="ava ava-md" style="background:'+gbg(s.id)+';color:'+gc(s.id)+'">'+ini(s.name)+'</div>'+
      '<div><div class="m-title">Assign Task</div><div style="font-size:10px;color:var(--t3)">'+esc(s.name)+' &middot; '+esc(fmtDate(S.selDate))+'</div></div>'+
      '<button class="btn btn-out btn-sm" id="m-x" style="padding:3px 7px;margin-left:auto">&#10005;</button></div>'+
    '<div class="m-body"><div class="ml">Staff Member</div><select class="msel" id="as-st">'+staffOpts+'</select>'+
      (existing.length?'<div class="ml">Current Tasks ('+existing.length+')</div>'+exRows:'<div style="font-size:11px;color:var(--t4);margin-bottom:9px">No tasks for this date.</div>')+
      (rem>0?'<div style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px">'+
        '<div class="ml">New Task</div>'+
        '<textarea class="mi" id="as-desc" placeholder="Task description..." style="resize:none;min-height:66px;margin-bottom:9px"></textarea>'+
        '<div class="mr2"><div><div class="ml">Date</div><input type="date" class="mi last" id="as-date" value="'+S.selDate+'"></div>'+
          '<div><div class="ml">Priority</div><select class="msel last" id="as-pri"><option value="High">High</option><option value="Medium" selected>Medium</option><option value="Low">Low</option></select></div></div></div>':''+
        '<div style="background:var(--glight);border:1px solid var(--gborder);border-radius:var(--r);padding:8px 11px;font-size:11px;color:var(--green);text-align:center">&#10003; All slots filled</div>')+
    '</div>'+
    '<div class="m-foot"><button class="btn btn-out btn-sm" id="as-cl">Close</button>'+
      (rem>0?'<button class="btn btn-pri btn-sm" id="as-sv">&#10003; Assign</button>':'')+
    '</div></div>');
  el('m-x').onclick=closeOv;el('as-cl').onclick=closeOv;
  var asSt=el('as-st');if(asSt)asSt.onchange=function(){var ns=STAFF.find(function(x){return x.id===this.value;},this);if(ns){closeOv();openAssign(ns.id);}};
  var asSv=el('as-sv');
  if(asSv)asSv.onclick=function(){
    var sid=(el('as-st')||{}).value||id;
    var desc=(el('as-desc')||{}).value||'';if(!desc.trim()){toast('Description required','w');return;}
    var date=(el('as-date')||{}).value||S.selDate;
    var pri=(el('as-pri')||{}).value||'Medium';
    var ct=tasksFor(sid,date).length;
    TASKS.push({id:++TID,staffId:sid,date:date,n:ct+1,desc:desc.trim(),status:'Pending',action:'',remarks:'',staffRem:'',priority:pri});
    var sv=STAFF.find(function(x){return x.id===sid;});
    toast('Assigned to '+esc(sv.name),'s');addFeed('Task assigned to '+sv.name,'blue');
    closeOv();rLp();renderContent();
  };
  var mb=document.querySelector('#ov-root .m-body');
  if(mb)mb.addEventListener('click',function(e){var btn=e.target.closest('[data-delid]');if(!btn)return;var did=parseInt(btn.dataset.delid);TASKS=TASKS.filter(function(t){return t.id!==did;});toast('Task removed','e');closeOv();openAssign(id);rLp();renderContent();});
}

function confirmClearStaff(){
  var ov=document.createElement('div');ov.className='ov';ov.id='ov-root';
  ov.innerHTML='<div class="cfm" onclick="event.stopPropagation()">'+
    '<div class="cfm-t">Clear All Staff?</div>'+
    '<div class="cfm-m">This will remove all <strong>'+activeStaff().length+'</strong> staff members and all their tasks from the system. This cannot be undone.</div>'+
    '<div class="cfm-r">'+
      '<button class="btn btn-out btn-sm" id="cfm-no">Cancel</button>'+
      '<button class="btn btn-red btn-sm" id="cfm-yes">&#128465; Clear All Staff</button>'+
    '</div>'+
  '</div>';
  ov.onclick=function(e){if(e.target===ov)closeOv();};
  document.body.appendChild(ov);
  el('cfm-no').onclick=closeOv;
  el('cfm-yes').onclick=function(){
    STAFF.length=0;TASKS.length=0;FEED.length=0;TID=100;
    S.selStaff=null;
    closeOv();
    toast('All staff and tasks cleared','w');
    addFeed('Staff list cleared by Director','amber');
    render();
  };
}

function confirmRemove(id){
  var s=STAFF.find(function(x){return x.id===id;});if(!s)return;
  closeOv();
  var ov=document.createElement('div');ov.className='ov';ov.id='ov-root';
  ov.innerHTML='<div class="cfm" onclick="event.stopPropagation()">'+
    '<div class="cfm-t">Remove Staff Member?</div>'+
    '<div class="cfm-m">Remove <strong>'+esc(s.name)+'</strong>? They will be deactivated. Task records are kept.</div>'+
    '<div class="cfm-r"><button class="btn btn-out btn-sm" id="cfm-no">Cancel</button><button class="btn btn-red btn-sm" id="cfm-yes">Remove</button></div>'+
  '</div>';
  ov.onclick=function(e){if(e.target===ov)closeOv();};
  document.body.appendChild(ov);
  el('cfm-no').onclick=closeOv;
  el('cfm-yes').onclick=function(){s.active=false;closeOv();toast('Removed: '+esc(s.name),'e');addFeed(s.name+' removed','red');S.selStaff=null;rLp();renderContent();};
}

function saveNewStaff(){
  var nm=(el('ns-name')||{}).value||'';nm=nm.trim();if(!nm){toast('Name required','w');return;}
  var em=(el('ns-email')||{}).value||'';em=em.trim();
  var rVal=(el('ns-role')||{}).value||'';var iVal=(el('ns-inst')||{}).value||'';
  var role=(rVal==='Other'||rVal==='Other (type manually)')?((el('ns-rc')||{}).value||'').trim():rVal;
  var inst=iVal==='Other'?((el('ns-ic')||{}).value||'').trim():iVal;
  if(!role){toast('Select or enter a role','w');return;}if(!inst){toast('Select or enter an institution','w');return;}
  var nid='ST'+String(Date.now()).slice(-3);
  STAFF.push({id:nid,name:nm,role:role,inst:inst,email:em,active:true});
  _newStaff={name:'',email:'',role:'',inst:''};S.showAddForm=false;
  toast(nm+' added','s');addFeed('New staff: '+nm,'green');rLp();renderContent();
}

function setRole(r){S.role=r;S.selStaff=null;S.view='overview';render();toast('Switched to '+r,'i');}


// ── CONSOLIDATION BAR ────────────────────────────────────────────
function rConsolBar(){
  var cbar=el('cbar');if(!cbar)return;
  if(!AUTH_USER.isAdmin||S.view==='tasks'){cbar.style.display='none';return;}
  cbar.style.display='flex';
  var active=activeStaff();
  var totalStaff=active.length;
  var submitted=active.filter(function(s){return tasksFor(s.id,S.selDate).length>=5;}).length;
  var partial=active.filter(function(s){var t=tasksFor(s.id,S.selDate).length;return t>0&&t<5;}).length;
  var none=active.filter(function(s){return tasksFor(s.id,S.selDate).length===0;}).length;
  var allTs=TASKS.filter(function(t){return t.date===S.selDate;});
  var approved=allTs.filter(function(t){return t.action==='Approved';}).length;
  var rejected=allTs.filter(function(t){return t.action==='Rejected';}).length;
  var pending=allTs.filter(function(t){return !t.action&&t.status==='Done';}).length;
  var totalTasks=allTs.length;
  var compPct=totalTasks?Math.round(allTs.filter(function(t){return t.status==='Done';}).length/totalTasks*100):0;

  function tile(bg,clr,bdr,icon,label,val){
    return '<span class="consol-stat" style="background:'+bg+';color:'+clr+';border:1px solid '+bdr+'">'+
      '<span class="cs-icon">'+icon+'</span>'+
      '<span class="cs-body">'+
        '<span class="cs-label">'+label+'</span>'+
        '<span class="cs-val" style="color:'+clr+'">'+val+'</span>'+
      '</span>'+
    '</span>';
  }

  cbar.innerHTML=
    tile('rgba(8,145,178,.1)','var(--p2)','rgba(8,145,178,.25)','&#128101;','Total Staff',totalStaff)+
    '<div class="consol-divider"></div>'+
    tile('var(--glight)','var(--green)','var(--gborder)','&#128203;','Submitted',submitted)+
    tile('var(--bg2)','var(--t2)','var(--border)','&#8854;','Not Submitted',none)+
    '<div class="consol-divider"></div>'+
    '<div class="consol-right">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-right:12px">'+
        '<label style="font-size:11px;font-weight:600;color:var(--t2)">Date:</label>'+
        '<input type="date" class="date-inp" id="cbar-date" value="'+S.selDate+'">'+
      '</div>'+
      '<div class="download-dropdown">'+
        '<button class="export-btn" id="download-toggle-btn">'+
          '<svg style="width:14px;height:14px;margin-right:4px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>'+
          '</svg>'+
          'Download'+
        '</button>'+
        '<div class="download-dropdown-menu" id="download-menu">'+
          '<button class="download-dropdown-item" id="exp-xlsx">'+
            '<svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>'+
            '</svg>'+
            'Excel'+
          '</button>'+
          '<button class="download-dropdown-item" id="exp-pdf">'+
            '<svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>'+
            '</svg>'+
            'PDF'+
          '</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  // Download dropdown toggle
  var downloadToggle=el('download-toggle-btn');
  var downloadMenu=el('download-menu');
  if(downloadToggle&&downloadMenu){
    downloadToggle.onclick=function(e){
      e.stopPropagation();
      downloadMenu.classList.toggle('show');
    };
    document.addEventListener('click',function(e){
      if(downloadMenu&&!e.target.closest('.download-dropdown')){
        downloadMenu.classList.remove('show');
      }
    });
  }

  var eXl=el('exp-xlsx');if(eXl)eXl.onclick=function(){exportReport('xlsx');if(downloadMenu)downloadMenu.classList.remove('show');};
  var ePdf=el('exp-pdf');if(ePdf)ePdf.onclick=function(){exportReport('pdf');if(downloadMenu)downloadMenu.classList.remove('show');};

  // Date picker handler
  var cbarDate=el('cbar-date');if(cbarDate)cbarDate.onchange=function(){S.selDate=this.value;render();};
}

// ── TASK MANAGEMENT PAGE ────────────────────────────────────────
function rTaskManagementPage(){
  // For non-admin users, show only their tasks
  if(!AUTH_USER.isAdmin){
    showMyTasks();
    return;
  }

  // Admin view - show only staff who have tasks in the date range
  var active=activeStaff();

  // Filter to show only users with tasks in the selected date range
  var staffWithTasks=active.filter(function(s){
    var tasksInRange=TASKS.filter(function(t){
      return t.staffId===s.id&&t.date>=S.taskFromDate&&t.date<=S.taskToDate;
    });
    return tasksInRange.length>0;
  });

  var html='<div class="dash">'+
    '<div class="sec-h">'+
      '<div><div class="sec-title">Task Management</div><div class="sec-sub">Assign and manage tasks within date range</div></div>'+
      '<div style="display:flex;align-items:center;gap:12px;margin-left:auto">'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<label style="font-size:12px;font-weight:600;color:var(--t2);white-space:nowrap">From:</label>'+
          '<input type="date" class="date-inp" id="task-from-date" value="'+S.taskFromDate+'" style="width:140px">'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<label style="font-size:12px;font-weight:600;color:var(--t2);white-space:nowrap">To:</label>'+
          '<input type="date" class="date-inp" id="task-to-date" value="'+S.taskToDate+'" style="width:140px">'+
        '</div>'+
        '<div class="search-box">'+
          '<svg style="width:16px;height:16px;color:var(--t3);flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>'+
          '</svg>'+
          '<input type="text" id="task-search" placeholder="Search staff..." style="width:200px">'+
        '</div>'+
        '<button class="btn btn-pri" onclick="openAssignTask(null)" style="white-space:nowrap">'+
          '<svg style="width:14px;height:14px;margin-right:4px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>'+
          '</svg>'+
          'Assign Task'+
        '</button>'+
      '</div>'+
    '</div>'+
    '<div class="staff-table-container">'+
      '<table class="staff-table">'+
        '<thead><tr>'+
          '<th>Staff Member</th>'+
          '<th>Role</th>'+
          '<th>Department</th>'+
          '<th>Tasks in Range</th>'+
          '<th style="text-align:right">Actions</th>'+
        '</tr></thead>'+
        '<tbody id="task-staff-tbody">';

  if(staffWithTasks.length===0){
    html+='<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--t3)">No tasks found in this date range. Use "Assign Task" to create new tasks.</td></tr>';
  }else{
    staffWithTasks.forEach(function(s){
      var dateRangeTasks=TASKS.filter(function(t){
        return t.staffId===s.id&&t.date>=S.taskFromDate&&t.date<=S.taskToDate;
      });
      var ini2=ini(s.name);
      html+='<tr class="task-staff-row" data-name="'+esc(s.name).toLowerCase()+'" data-role="'+esc(s.role||'').toLowerCase()+'" data-dept="'+esc(s.department||s.inst||'').toLowerCase()+'">'+
        '<td><div style="display:flex;align-items:center;gap:10px">'+
          '<div class="ava ava-md" style="background:'+gbg(s.id)+';color:'+gc(s.id)+'">'+ini2+'</div>'+
          '<div><div style="font-size:13px;font-weight:600;color:var(--text)">'+esc(s.name)+'</div>'+
            '<div style="font-size:11px;color:var(--t3)">'+(s.email||'—')+'</div></div>'+
        '</div></td>'+
        '<td><span class="role-badge">'+esc(s.role||'—')+'</span></td>'+
        '<td><span class="dept-badge">'+esc(s.department||s.inst||'—')+'</span></td>'+
        '<td><span style="font-size:13px;font-weight:600;color:var(--p2)">'+dateRangeTasks.length+'</span> <span style="font-size:11px;color:var(--t3)">tasks</span></td>'+
        '<td style="text-align:right">'+
          '<div style="display:flex;gap:6px;justify-content:flex-end">'+
            '<button class="btn btn-out btn-sm" onclick="viewStaffTasks(\''+s.id+'\')">'+
              '<svg style="width:14px;height:14px;margin-right:3px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>'+
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>'+
              '</svg>'+
              'View Tasks ('+dateRangeTasks.length+')'+
            '</button>'+
            '<button class="btn btn-pri btn-sm" onclick="openAssignTask(\''+s.id+'\')">'+
              '<svg style="width:14px;height:14px;margin-right:3px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>'+
              '</svg>'+
              'Assign Task'+
            '</button>'+
          '</div>'+
        '</td>'+
      '</tr>';
    });
  }

  html+='</tbody></table></div></div>';
  el('ct').innerHTML=html;

  // Date range handlers
  var fromDateInput=el('task-from-date');
  var toDateInput=el('task-to-date');
  if(fromDateInput){
    fromDateInput.onchange=function(){
      S.taskFromDate=this.value;
      // Ensure from date is not after to date
      if(S.taskFromDate>S.taskToDate){
        S.taskToDate=S.taskFromDate;
      }
      rTaskManagementPage();
    };
  }
  if(toDateInput){
    toDateInput.onchange=function(){
      S.taskToDate=this.value;
      // Ensure to date is not before from date
      if(S.taskToDate<S.taskFromDate){
        S.taskFromDate=S.taskToDate;
      }
      rTaskManagementPage();
    };
  }

  // Search functionality
  var searchInput=el('task-search');
  if(searchInput){
    searchInput.oninput=function(){
      var query=this.value.toLowerCase().trim();
      var rows=document.querySelectorAll('.task-staff-row');
      rows.forEach(function(row){
        var name=row.dataset.name||'';
        var role=row.dataset.role||'';
        var dept=row.dataset.dept||'';
        var matches=!query||name.includes(query)||role.includes(query)||dept.includes(query);
        row.style.display=matches?'':'none';
      });
    };
  }
}

// Show tasks for the current logged-in user only
function showMyTasks(){
  // Initialize filter state if not exists
  if(!S.myTaskFilters){
    S.myTaskFilters={
      fromDate:_today,
      toDate:_today,
      priority:'all',
      status:'all'
    };
  }

  var allMyTasks=TASKS.filter(function(t){
    return t.staffId===AUTH_USER.id;
  });

  // Apply filters
  var myTasks=allMyTasks.filter(function(t){
    // Date filter
    if(t.date<S.myTaskFilters.fromDate||t.date>S.myTaskFilters.toDate){
      return false;
    }
    // Priority filter
    if(S.myTaskFilters.priority!=='all'&&t.priority!==S.myTaskFilters.priority){
      return false;
    }
    // Status filter
    if(S.myTaskFilters.status!=='all'){
      if(S.myTaskFilters.status==='Done'&&t.status!=='Done'){
        return false;
      }
      if(S.myTaskFilters.status==='Pending'&&(t.action||t.status==='Done')){
        return false;
      }
      if(S.myTaskFilters.status==='Approved'&&t.action!=='Approved'){
        return false;
      }
      if(S.myTaskFilters.status==='Rejected'&&t.action!=='Rejected'){
        return false;
      }
    }
    return true;
  });

  // Sort by date descending (newest first)
  myTasks.sort(function(a,b){
    return new Date(b.date)-new Date(a.date);
  });

  // Group tasks by date
  var tasksByDate={};
  myTasks.forEach(function(task){
    if(!tasksByDate[task.date]){
      tasksByDate[task.date]=[];
    }
    tasksByDate[task.date].push(task);
  });

  // Initialize collapsed state if not exists
  if(!S.myTasksCollapsed){
    S.myTasksCollapsed={};
  }

  var html='<div class="dash">'+
    '<div class="sec-h">'+
      '<div>'+
        '<div class="sec-title">My Tasks</div>'+
        '<div class="sec-sub">Tasks assigned to you</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:12px;margin-left:auto">'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<label style="font-size:12px;font-weight:600;color:var(--t2);white-space:nowrap">From:</label>'+
          '<input type="date" class="date-inp" id="my-task-from" value="'+S.myTaskFilters.fromDate+'" style="width:140px">'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<label style="font-size:12px;font-weight:600;color:var(--t2);white-space:nowrap">To:</label>'+
          '<input type="date" class="date-inp" id="my-task-to" value="'+S.myTaskFilters.toDate+'" style="width:140px">'+
        '</div>'+
        '<select id="my-task-priority" class="msel" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:6px;font-size:13px">'+
          '<option value="all"'+(S.myTaskFilters.priority==='all'?' selected':'')+'>All Priority</option>'+
          '<option value="High"'+(S.myTaskFilters.priority==='High'?' selected':'')+'>High</option>'+
          '<option value="Medium"'+(S.myTaskFilters.priority==='Medium'?' selected':'')+'>Medium</option>'+
          '<option value="Low"'+(S.myTaskFilters.priority==='Low'?' selected':'')+'>Low</option>'+
        '</select>'+
        '<select id="my-task-status" class="msel" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:6px;font-size:13px">'+
          '<option value="all"'+(S.myTaskFilters.status==='all'?' selected':'')+'>All Status</option>'+
          '<option value="Pending"'+(S.myTaskFilters.status==='Pending'?' selected':'')+'>Pending</option>'+
          '<option value="Done"'+(S.myTaskFilters.status==='Done'?' selected':'')+'>Done</option>'+
          '<option value="Approved"'+(S.myTaskFilters.status==='Approved'?' selected':'')+'>Approved</option>'+
          '<option value="Rejected"'+(S.myTaskFilters.status==='Rejected'?' selected':'')+'>Rejected</option>'+
        '</select>'+
      '</div>'+
    '</div>';

  if(myTasks.length===0){
    html+='<div style="text-align:center;padding:60px 20px;color:var(--t3)">'+
      '<svg style="width:48px;height:48px;margin:0 auto 16px;opacity:0.3" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>'+
      '</svg>'+
      '<div style="font-size:16px;font-weight:600;color:var(--t2);margin-bottom:8px">No tasks found</div>'+
      '<div style="font-size:13px;color:var(--t3)">Try adjusting your filters</div>'+
    '</div>';
  }else{
    html+='<div style="display:grid;gap:16px;padding:20px">';

    // Iterate through dates
    Object.keys(tasksByDate).sort(function(a,b){
      return new Date(b)-new Date(a);
    }).forEach(function(date){
      var tasksForDate=tasksByDate[date];
      var isCollapsed=S.myTasksCollapsed[date]!==false; // Default to collapsed
      var taskCount=tasksForDate.length;

      // Date header
      html+='<div style="background:var(--white);border:1.5px solid var(--border);border-radius:10px;overflow:hidden">'+
        '<div onclick="toggleMyTaskDate(\''+date+'\')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#f9fafb;cursor:pointer;user-select:none">'+
          '<svg style="width:20px;height:20px;color:#3b82f6;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>'+
          '</svg>'+
          '<div style="flex:1">'+
            '<div style="font-size:15px;font-weight:600;color:var(--t1)">'+fmtDate(date)+'</div>'+
            '<div style="font-size:12px;color:var(--t3)">'+taskCount+' task'+(taskCount>1?'s':'')+'</div>'+
          '</div>'+
          '<svg style="width:20px;height:20px;color:var(--t3);transform:rotate('+(isCollapsed?'-90':'0')+'deg);transition:transform 0.2s" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>'+
          '</svg>'+
        '</div>';

      // Tasks for this date
      if(!isCollapsed){
        html+='<div style="padding:12px">';
        tasksForDate.forEach(function(task,idx){
          var statusColor=task.status==='Done'?'var(--green)':!task.action?'var(--amber)':task.action==='Approved'?'var(--green)':'var(--red)';
          var statusText=task.status==='Done'?'Done':!task.action?'Pending':task.action==='Approved'?'Approved':'Rejected';
          var statusBg=task.status==='Done'?'var(--glight)':!task.action?'var(--alight)':task.action==='Approved'?'var(--glight)':'var(--rlight)';

          var priorityColor=task.priority==='High'?'#dc2626':task.priority==='Low'?'#0369a1':'#b45309';
          var priorityBg=task.priority==='High'?'#fee2e2':task.priority==='Low'?'#dbeafe':'#fef3c7';

          html+='<div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:14px;'+(idx>0?'margin-top:10px':'')+'">'+
            '<div style="display:flex;align-items:start;gap:12px;margin-bottom:10px">'+
              '<div style="flex:1">'+
                '<div style="font-size:14px;font-weight:600;color:var(--t1);margin-bottom:6px">'+esc(task.desc||'No description')+'</div>'+
                '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
                  (task.priority?'<span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:'+priorityBg+';color:'+priorityColor+'">'+esc(task.priority)+'</span>':'')+
                '</div>'+
              '</div>'+
              '<div style="display:flex;gap:8px;align-items:center">'+
                '<div style="padding:5px 10px;border-radius:6px;font-size:11px;font-weight:600;background:'+statusBg+';color:'+statusColor+'">'+
                  statusText+
                '</div>';

          // Show Mark as Done button only if task is not done and not rejected
          if(task.status!=='Done'&&task.action!=='Rejected'){
            html+='<button onclick="markTaskDone('+task.id+')" style="padding:5px 10px;background:#10b981;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap">✓ Done</button>';
          }

          html+='  </div>'+
            '</div>';

          if(task.adminRem){
            html+='<div style="background:#fff;border-radius:6px;padding:8px;margin-bottom:6px">'+
              '<div style="font-size:10px;font-weight:600;color:var(--t3);margin-bottom:3px">Admin Note:</div>'+
              '<div style="font-size:12px;color:var(--t2)">'+esc(task.adminRem)+'</div>'+
            '</div>';
          }

          if(task.staffRem){
            html+='<div style="background:#fff;border-radius:6px;padding:8px">'+
              '<div style="font-size:10px;font-weight:600;color:var(--t3);margin-bottom:3px">My Note:</div>'+
              '<div style="font-size:12px;color:var(--t2)">'+esc(task.staffRem)+'</div>'+
            '</div>';
          }

          html+='</div>';
        });
        html+='</div>';
      }

      html+='</div>';
    });
    html+='</div>';
  }

  html+='</div>';
  el('ct').innerHTML=html;

  // Bind filter change events
  var fromDate=el('my-task-from');
  var toDate=el('my-task-to');
  var priority=el('my-task-priority');
  var status=el('my-task-status');

  if(fromDate){
    fromDate.onchange=function(){
      S.myTaskFilters.fromDate=this.value;
      if(S.myTaskFilters.fromDate>S.myTaskFilters.toDate){
        S.myTaskFilters.toDate=S.myTaskFilters.fromDate;
      }
      showMyTasks();
    };
  }

  if(toDate){
    toDate.onchange=function(){
      S.myTaskFilters.toDate=this.value;
      if(S.myTaskFilters.toDate<S.myTaskFilters.fromDate){
        S.myTaskFilters.fromDate=S.myTaskFilters.toDate;
      }
      showMyTasks();
    };
  }

  if(priority){
    priority.onchange=function(){
      S.myTaskFilters.priority=this.value;
      showMyTasks();
    };
  }

  if(status){
    status.onchange=function(){
      S.myTaskFilters.status=this.value;
      showMyTasks();
    };
  }
}

// Mark task as done
function markTaskDone(taskId){
  var task=TASKS.find(function(t){return t.id===taskId;});
  if(!task)return;

  // Show custom confirmation modal
  showConfirmDialog(
    'Mark Task as Done?',
    'Are you sure you want to mark "'+esc(task.desc)+'" as completed?',
    function(){
      // On confirm
      task.status='Done';
      toast('Task marked as done!','s');
      addFeed('Task completed: '+task.desc,'green');
      schedSave();
      showMyTasks(); // Refresh the view
    }
  );
}

// Custom confirmation dialog
function showConfirmDialog(title,message,onConfirm){
  var html='<div class="modal" onclick="event.stopPropagation()" style="max-width:450px">'+
    '<div class="m-head">'+
      '<div style="flex:1">'+
        '<div style="font-size:18px;font-weight:700;color:var(--t1)">'+esc(title)+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="m-body">'+
      '<div style="font-size:14px;color:var(--t2);line-height:1.6">'+esc(message)+'</div>'+
    '</div>'+
    '<div class="m-foot" style="display:flex;gap:10px">'+
      '<button class="btn btn-out" id="confirm-cancel" style="flex:1">Cancel</button>'+
      '<button class="btn btn-pri" id="confirm-ok" style="flex:1;background:#10b981">'+
        '<svg style="width:16px;height:16px;margin-right:4px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'+
        '</svg>'+
        'Confirm'+
      '</button>'+
    '</div>'+
  '</div>';

  showOv(html);

  el('confirm-cancel').onclick=closeOv;
  el('confirm-ok').onclick=function(){
    closeOv();
    if(onConfirm)onConfirm();
  };
}

// Toggle date group collapse/expand
function toggleMyTaskDate(date){
  if(!S.myTasksCollapsed){
    S.myTasksCollapsed={};
  }
  // Toggle: if undefined/true (collapsed), set to false (expanded)
  // if false (expanded), set to true (collapsed)
  S.myTasksCollapsed[date]=S.myTasksCollapsed[date]===false?true:false;
  showMyTasks(); // Refresh the view
}

function viewStaffTasks(id){
  var s=STAFF.find(function(x){return x.id===id;});if(!s)return;
  // Filter tasks by staff and date range
  var allTasks=TASKS.filter(function(t){
    return t.staffId===s.id&&t.date>=S.taskFromDate&&t.date<=S.taskToDate;
  });

  // Group tasks by date
  var tasksByDate={};
  allTasks.forEach(function(t){
    if(!tasksByDate[t.date])tasksByDate[t.date]=[];
    tasksByDate[t.date].push(t);
  });

  var dates=Object.keys(tasksByDate).sort().reverse();

  var tasksHTML='';
  if(dates.length===0){
    tasksHTML='<div style="text-align:center;padding:30px;background:var(--bg2);border-radius:8px">'+
      '<svg style="width:48px;height:48px;color:var(--t4);margin:0 auto 12px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>'+
      '</svg>'+
      '<div style="font-size:13px;color:var(--t3);font-weight:500">No tasks assigned yet</div>'+
    '</div>';
  }else{
    dates.forEach(function(date){
      var tasks=tasksByDate[date];
      var dateFormatted=new Date(date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
      var completed=tasks.filter(function(t){return t.status==='Done';}).length;
      var total=tasks.length;

      tasksHTML+='<div style="margin-bottom:16px">'+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:1.5px solid var(--border)">'+
          '<svg style="width:16px;height:16px;color:var(--p2);flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>'+
          '</svg>'+
          '<span style="font-size:13px;font-weight:600;color:var(--text)">'+dateFormatted+'</span>'+
          '<span style="margin-left:auto;font-size:11px;color:var(--t3)">'+completed+'/'+total+' completed</span>'+
        '</div>';

      tasks.forEach(function(t){
        var statusColor=t.status==='Done'?'var(--green)':'var(--amber)';
        var statusBg=t.status==='Done'?'var(--glight)':'var(--alight)';
        var actionBadge='';
        if(t.action==='Approved'){
          actionBadge='<span class="bdg bdg-ap" style="font-size:9px">Approved</span>';
        }else if(t.action==='Rejected'){
          actionBadge='<span class="bdg bdg-rj" style="font-size:9px">Rejected</span>';
        }

        tasksHTML+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px 12px;margin-bottom:6px">'+
          '<div style="display:flex;align-items:start;gap:8px">'+
            '<div style="width:22px;height:22px;border-radius:4px;background:var(--grad2);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+t.n+'</div>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-size:12px;color:var(--text);font-weight:500;line-height:1.4;margin-bottom:6px">'+esc(t.desc)+'</div>'+
              '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
                '<span class="bdg" style="font-size:9px;background:'+statusBg+';color:'+statusColor+';border:1px solid '+statusColor+'20">'+esc(t.status)+'</span>'+
                (t.priority?'<span class="bdg bdg-nr" style="font-size:9px">'+esc(t.priority)+'</span>':'')+
                actionBadge+
              '</div>'+
              (t.remarks?'<div style="margin-top:6px;padding:6px 8px;background:var(--white);border-radius:4px;font-size:11px;color:var(--t2);border-left:2px solid var(--p3)">'+
                '<div style="font-size:9px;font-weight:600;color:var(--t3);margin-bottom:2px">REMARKS</div>'+esc(t.remarks)+
              '</div>':'')+
            '</div>'+
          '</div>'+
        '</div>';
      });

      tasksHTML+='</div>';
    });
  }

  var fromFormatted=new Date(S.taskFromDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
  var toFormatted=new Date(S.taskToDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  var dateRangeStr=S.taskFromDate===S.taskToDate?fromFormatted:fromFormatted+' - '+toFormatted;

  showOv('<div class="modal" onclick="event.stopPropagation()" style="max-width:600px">'+
    '<div class="m-head" style="background:var(--grad);color:#fff;border-bottom:none">'+
      '<div class="ava ava-lg" style="background:rgba(255,255,255,.2);color:#fff;border:2px solid rgba(255,255,255,.3)">'+ini(s.name)+'</div>'+
      '<div style="flex:1">'+
        '<div style="font-size:16px;font-weight:700">'+esc(s.name)+'\'s Tasks</div>'+
        '<div style="font-size:11px;opacity:.85">'+allTasks.length+' tasks · '+dateRangeStr+'</div>'+
      '</div>'+
      '<button class="btn btn-out btn-sm" id="m-x" style="padding:4px 8px;background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.3);color:#fff">&#10005;</button>'+
    '</div>'+
    '<div class="m-body" style="max-height:500px;overflow-y:auto">'+
      '<div style="background:var(--bg2);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:16px">'+
        '<div style="font-size:13px;font-weight:600;color:var(--text)">'+esc(s.name)+'</div>'+
        '<div style="font-size:11px;color:var(--t3)">'+esc(s.role||'—')+' · '+esc(s.department||s.inst||'—')+'</div>'+
      '</div>'+
      tasksHTML+
    '</div>'+
    '<div class="m-foot">'+
      '<button class="btn btn-out btn-sm" id="vt-cl">Close</button>'+
      '<button class="btn btn-pri btn-sm" onclick="closeOv();openAssignTask(\''+id+'\')">'+
        '<svg style="width:14px;height:14px;margin-right:3px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>'+
        '</svg>'+
        'Assign New Task'+
      '</button>'+
    '</div>'+
  '</div>');

  el('m-x').onclick=closeOv;
  el('vt-cl').onclick=closeOv;
}

function openAssignTask(id){
  var active=activeStaff();

  // If no ID provided, show user selection dropdown
  if(!id || id===null || id==='null'){
    var dateFormatted=new Date(S.selDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});

    // Build user dropdown options
    var userOptions='<option value="">Select User</option>';
    active.forEach(function(user){
      userOptions+='<option value="'+user.id+'">'+esc(user.name)+' ('+esc(user.role||'—')+')</option>';
    });

    showOv('<div class="modal" onclick="event.stopPropagation()" style="max-width:500px">'+
      '<div class="m-head">'+
        '<div style="flex:1">'+
          '<div style="font-size:16px;font-weight:700;color:var(--t1)">Assign New Task</div>'+
          '<div style="font-size:12px;color:var(--t3)">Select user and assign task</div>'+
        '</div>'+
        '<button class="btn btn-out btn-sm" id="m-x">&#10005;</button>'+
      '</div>'+
      '<div class="m-body">'+
        '<div class="ml" style="margin-bottom:6px">Assign To</div>'+
        '<select class="msel" id="at-user" style="margin-bottom:12px">'+userOptions+'</select>'+
        '<div class="ml" style="margin-bottom:8px">Task Description</div>'+
        '<textarea class="mi" id="at-desc" placeholder="Enter task description..." style="resize:none;min-height:70px;margin-bottom:10px;line-height:1.5"></textarea>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
          '<div><div class="ml">Date</div><input type="date" class="mi last" id="at-date" value="'+_today+'"></div>'+
          '<div><div class="ml">Priority</div><select class="msel last" id="at-pri">'+
            '<option value="High">High</option>'+
            '<option value="Medium" selected>Medium</option>'+
            '<option value="Low">Low</option>'+
          '</select></div>'+
        '</div>'+
      '</div>'+
      '<div class="m-foot">'+
        '<button class="btn btn-out btn-sm" id="at-cl">Close</button>'+
        '<button class="btn btn-pri btn-sm" id="at-sv">'+
          '<svg style="width:14px;height:14px;margin-right:3px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'+
          '</svg>'+
          'Assign Task'+
        '</button>'+
      '</div>'+
    '</div>');

    el('m-x').onclick=closeOv;
    el('at-cl').onclick=closeOv;
    el('at-sv').onclick=function(){
      var userId=(el('at-user')||{}).value||'';
      if(!userId){toast('Please select a user','w');return;}

      var desc=(el('at-desc')||{}).value||'';
      if(!desc.trim()){toast('Task description is required','w');return;}

      var date=(el('at-date')||{}).value||S.selDate;
      var pri=(el('at-pri')||{}).value||'Medium';

      var selectedUser=active.find(function(u){return u.id===userId;});
      if(!selectedUser){toast('User not found','e');return;}

      var ct=tasksFor(userId,date).length;
      TASKS.push({
        id:++TID,
        staffId:userId,
        date:date,
        n:ct+1,
        desc:desc.trim(),
        status:'Pending',
        action:'',
        remarks:'',
        staffRem:'',
        adminRem:'',
        priority:pri
      });
      toast('Task assigned to '+esc(selectedUser.name),'s');
      addFeed('Task assigned to '+selectedUser.name+' for '+date,'blue');
      schedSave();
      closeOv();
      render();
    };
    return;
  }

  // Original code for when specific user ID is provided
  var s=STAFF.find(function(x){return x.id===id;});if(!s)return;
  var existing=tasksFor(s.id,S.selDate);
  var dateFormatted=new Date(S.selDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});

  var exRows='';
  if(existing.length>0){
    exRows='<div style="margin:12px 0"><div style="font-size:11px;font-weight:600;color:var(--t3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Tasks for '+dateFormatted+'</div>';
    existing.forEach(function(t){
      exRows+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:8px 11px;margin-bottom:6px">'+
        '<div style="display:flex;align-items:start;gap:8px">'+
          '<div style="width:20px;height:20px;border-radius:4px;background:var(--grad2);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+t.n+'</div>'+
          '<div style="flex:1;min-width:0"><div style="font-size:12px;color:var(--text);font-weight:500;line-height:1.4">'+esc(t.desc)+'</div>'+
            '<div style="display:flex;gap:6px;margin-top:4px">'+
              '<span class="bdg '+(t.status==='Done'?'bdg-g':'bdg-p')+'" style="font-size:9px">'+(t.status==='Done'?'Done':'Pending')+'</span>'+
              (t.priority?'<span class="bdg bdg-nr" style="font-size:9px">'+esc(t.priority)+'</span>':'')+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>';
    });
    exRows+='</div>';
  }else{
    exRows='<div style="text-align:center;padding:20px;background:var(--bg2);border-radius:8px;margin:12px 0">'+
      '<div style="font-size:12px;color:var(--t3)">No tasks for this date.</div>'+
    '</div>';
  }

  showOv('<div class="modal" onclick="event.stopPropagation()" style="max-width:500px">'+
    '<div class="m-head" style="background:var(--grad);color:#fff;border-bottom:none">'+
      '<div class="ava ava-lg" style="background:rgba(255,255,255,.2);color:#fff;border:2px solid rgba(255,255,255,.3)">'+ini(s.name)+'</div>'+
      '<div style="flex:1"><div style="font-size:16px;font-weight:700">'+esc(s.name)+'</div>'+
        '<div style="font-size:11px;opacity:.85">'+dateFormatted+'</div></div>'+
      '<button class="btn btn-out btn-sm" id="m-x" style="padding:4px 8px;background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.3);color:#fff">&#10005;</button>'+
    '</div>'+
    '<div class="m-body">'+
      '<div class="ml" style="margin-bottom:6px">Staff Member</div>'+
      '<div style="background:var(--bg2);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:12px">'+
        '<div style="font-size:13px;font-weight:600;color:var(--text)">'+esc(s.name)+'</div>'+
        '<div style="font-size:11px;color:var(--t3)">'+esc(s.role||'—')+' · '+esc(s.department||s.inst||'—')+'</div>'+
      '</div>'+
      exRows+
      '<div style="border-top:1.5px solid var(--border);margin-top:16px;padding-top:16px">'+
        '<div class="ml" style="margin-bottom:8px">New Task</div>'+
        '<textarea class="mi" id="at-desc" placeholder="Enter task description..." style="resize:none;min-height:70px;margin-bottom:10px;line-height:1.5"></textarea>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
          '<div><div class="ml">Date</div><input type="date" class="mi last" id="at-date" value="'+_today+'"></div>'+
          '<div><div class="ml">Priority</div><select class="msel last" id="at-pri">'+
            '<option value="High">High</option>'+
            '<option value="Medium" selected>Medium</option>'+
            '<option value="Low">Low</option>'+
          '</select></div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="m-foot">'+
      '<button class="btn btn-out btn-sm" id="at-cl">Close</button>'+
      '<button class="btn btn-pri btn-sm" id="at-sv">'+
        '<svg style="width:14px;height:14px;margin-right:3px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'+
        '</svg>'+
        'Assign Task'+
      '</button>'+
    '</div>'+
  '</div>');

  el('m-x').onclick=closeOv;
  el('at-cl').onclick=closeOv;
  el('at-sv').onclick=function(){
    var desc=(el('at-desc')||{}).value||'';
    if(!desc.trim()){toast('Task description is required','w');return;}
    var date=(el('at-date')||{}).value||S.selDate;
    var pri=(el('at-pri')||{}).value||'Medium';
    var ct=tasksFor(s.id,date).length;
    TASKS.push({
      id:++TID,
      staffId:s.id,
      date:date,
      n:ct+1,
      desc:desc.trim(),
      status:'Pending',
      action:'',
      remarks:'',
      staffRem:'',
      priority:pri
    });
    toast('Task assigned to '+esc(s.name),'s');
    addFeed('Task assigned to '+s.name+' for '+date,'blue');
    schedSave();
    closeOv();
    render();
  };
}


// ── RENDER ───────────────────────────────────────────────────────
function renderContent(){
  if(AUTH_USER.isAdmin){
    if(S.view==='tasks')rTaskManagementPage();
    else if(S.view==='board')rBoard();
    else if(S.view==='timeline')rTimeline();
    else if(S.view==='analytics')rAnalytics();
    else rOverview();
  } else {
    // Non-admin users only see their tasks
    rTaskManagementPage();
  }
}
function render(){rLp();rTb();rTabBar();rConsolBar();renderContent();}

// ── AUTO-SAVE ────────────────────────────────────────────────────
var _saveTimer=null;
var _isSaving=false;

function autoSave(){
  if(_isSaving)return;
  _isSaving=true;

  var ind=el('save-ind');
  if(ind)ind.style.opacity='1';

  // Save tasks data to GitHub
  fetch('/api/tasks/save',{
    method:'POST',
    headers:{'Content-Type':'application/json','X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]')?.content||''},
    body:JSON.stringify({tasks:TASKS})
  }).then(function(r){return r.json();}).then(function(data){
    if(!data.success){console.error('Tasks save failed:',data.message);}
    _isSaving=false;
    if(ind){clearTimeout(ind._t);ind._t=setTimeout(function(){ind.style.opacity='0';},1800);}
  }).catch(function(e){
    console.error('Tasks save error:',e);
    _isSaving=false;
    if(ind)ind.style.opacity='0';
  });

  // Also save to localStorage as backup
  try{
    var snap={STAFF:STAFF,TASKS:TASKS,FEED:FEED,TID:TID,DIR:DIR,S:{role:S.role,staffId:S.staffId,selDate:S.selDate,view:S.view}};
    localStorage.setItem('wmp_data_backup',JSON.stringify(snap));
  }catch(e){}
}

function schedSave(){clearTimeout(_saveTimer);_saveTimer=setTimeout(autoSave,800);}

function restoreData(){
  var restored=false;

  // Load users from User Management API
  fetch('/admin/users',{
    method:'GET',
    headers:{
      'Content-Type':'application/json',
      'X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]')?.content||''
    }
  }).then(function(r){return r.json();}).then(function(response){
    if(response.success&&response.users&&response.users.length){
      STAFF.length=0;
      response.users.forEach(function(user){
        // Convert user format to staff format
        STAFF.push({
          id:user.id,
          name:user.name,
          email:user.email,
          role:user.role,
          department:user.department,
          inst:user.department,
          active:true
        });
      });
      restored=true;
      render();
    }
  }).catch(function(e){console.error('User load error:',e);});

  // Load tasks data from GitHub
  fetch('/api/tasks',{
    method:'GET',
    headers:{'Content-Type':'application/json'}
  }).then(function(r){return r.json();}).then(function(response){
    if(response.success&&response.data&&response.data.length){
      TASKS.length=0;
      response.data.forEach(function(t){TASKS.push(t);});
      restored=true;
      render();
    }
  }).catch(function(e){console.error('Tasks load error:',e);});

  // Try localStorage backup if GitHub fails
  if(!restored){
    try{
      var raw=localStorage.getItem('wmp_data_backup');
      if(raw){
        var snap=JSON.parse(raw);
        if(snap.STAFF&&snap.STAFF.length){
          STAFF.length=0;snap.STAFF.forEach(function(s){STAFF.push(s);});
          TASKS.length=0;snap.TASKS.forEach(function(t){TASKS.push(t);});
          FEED.length=0;snap.FEED.forEach(function(f){FEED.push(f);});
          TID=snap.TID||TID;
          if(snap.DIR){DIR.name=snap.DIR.name||DIR.name;DIR.desig=snap.DIR.desig||DIR.desig;}
          if(snap.S){S.role=snap.S.role||S.role;S.staffId=snap.S.staffId||S.staffId;S.selDate=snap.S.selDate||S.selDate;}
          restored=true;
        }
      }
    }catch(e){}
  }

  return restored;
}

// Patch functions that mutate data to trigger auto-save
// Auto-save is triggered inline at each mutation point via schedSave()

// ── EXPORT REPORT ─────────────────────────────────────────────────
function exportReport(fmt){
  var date=S.selDate;
  var active=activeStaff();
  if(fmt==='json'){
    var data={exportDate:new Date().toISOString(),reportDate:date,director:DIR,staff:active,tasks:TASKS};
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download='WorkMonitor_Report_'+date+'.json';a.click();
    toast('JSON exported','s');return;
  }
  if(fmt==='pdf'){
    // Build printable HTML and open in new window for print-to-PDF
    var rows=active.map(function(s){
      var ts=TASKS.filter(function(t){return t.staffId===s.id&&t.date===date;});
      var ap=ts.filter(function(t){return t.action==='Approved';}).length;
      var rj=ts.filter(function(t){return t.action==='Rejected';}).length;
      return '<tr><td>'+esc(s.id)+'</td><td>'+esc(s.name)+'</td><td>'+esc(s.role)+'</td><td>'+esc(s.inst)+'</td>'+
        '<td>'+ts.length+'/5</td><td style="color:#059669;font-weight:600">'+ap+'</td>'+
        '<td style="color:#DC2626;font-weight:600">'+rj+'</td>'+
        '<td style="color:#B45309">'+(ts.length-ap-rj)+'</td></tr>'+
        ts.map(function(t){return '<tr style="background:#F8FBFF"><td></td><td colspan="2" style="padding-left:24px;font-size:11px;color:#2B5270">Task '+t.n+': '+esc(t.desc.slice(0,60))+'</td>'+
          '<td></td><td style="text-align:center"><span style="font-size:10px">'+esc(t.status)+'</span></td>'+
          '<td colspan="2" style="font-size:10px;color:'+(t.action==='Approved'?'#059669':'#DC2626')+'">'+esc(t.action||'Pending')+'</td>'+
          '<td style="font-size:10px;color:#5A8AA8">'+esc(t.remarks.slice(0,40))+'</td></tr>';}).join('');
    }).join('');
    var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WorkMonitor Report</title>'+
      '<style>body{font-family:Arial,sans-serif;font-size:12px;color:#0F2535}'+
      'h1{background:linear-gradient(135deg,#003D5C,#0891B2);color:#fff;padding:12px 18px;border-radius:8px;font-size:16px;margin-bottom:4px}'+
      'h2{font-size:12px;color:#5A8AA8;margin-bottom:16px;font-weight:400}'+
      'table{width:100%;border-collapse:collapse;margin-top:12px}'+
      'th{background:#E0F2FE;color:#003D5C;padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;text-align:left;border:1px solid #BAE6FD}'+
      'td{padding:6px 10px;border:1px solid #E0F2FE;vertical-align:top}'+
      'tr:nth-child(even) td{background:#F7FBFE}'+
      '@media print{body{margin:0}}</style></head><body>'+
      '<h1>WorkMonitor Pro &mdash; Daily Report</h1>'+
      '<h2>Date: '+esc(date)+' &nbsp;&bull;&nbsp; Director: '+esc(DIR.name)+' ('+esc(DIR.desig)+') &nbsp;&bull;&nbsp; Generated: '+new Date().toLocaleString('en-IN')+'</h2>'+
      '<table><thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Department</th><th>Tasks</th><th>Approved</th><th>Rejected</th><th>Pending</th></tr></thead>'+
      '<tbody>'+rows+'</tbody></table></body></html>';
    var w=window.open('','_blank','width=900,height=700');
    w.document.write(html);w.document.close();
    setTimeout(function(){w.print();},400);
    toast('PDF ready — use Print > Save as PDF','s');return;
  }
  if(fmt==='xlsx'){
    // Build CSV (Excel-compatible) since we cannot use openpyxl in browser
    var csvRows=['Staff ID,Name,Designation,Department,Date,Task No,Task Description,Status,Action,Remarks'];
    active.forEach(function(s){
      var ts=TASKS.filter(function(t){return t.staffId===s.id&&t.date===date;});
      if(ts.length===0){
        csvRows.push([s.id,s.name,s.role,s.inst,date,'','','','',''].join(','));
      } else {
        ts.forEach(function(t){
          function q(v){return '"'+(String(v||'').replace(/"/g,'""'))+'"';}
          csvRows.push([q(s.id),q(s.name),q(s.role),q(s.inst),q(t.date),t.n,q(t.desc),q(t.status),q(t.action||'Pending'),q(t.remarks)].join(','));
        });
      }
    });
    var blob2=new Blob([csvRows.join('\n')],{type:'text/csv;charset=utf-8'});
    var a2=document.createElement('a');a2.href=URL.createObjectURL(blob2);
    a2.download='WorkMonitor_Report_'+date+'.csv';a2.click();
    toast('Excel (CSV) exported — open in Excel','s');
  }
}

var restored=restoreData();
render();

// ── GLOBAL EVENT HANDLERS ────────────────────────────────────────
// Board click events (attached once to avoid duplicates)
document.addEventListener('click',function(e){
  var ct=el('ct');if(!ct)return;
  // Check if click is within content area
  if(!ct.contains(e.target))return;

  // filter pills
  var pill=e.target.closest('[data-filter]');if(pill){S.boardFilter=pill.dataset.filter;rBoard();return;}
  // action dropdown toggle
  var dpBtn=e.target.closest('[data-dpid]');if(dpBtn){S.boardDp=S.boardDp===parseInt(dpBtn.dataset.dpid)?null:parseInt(dpBtn.dataset.dpid);rBoard();return;}
  // dropdown actions
  var dpAct=e.target.closest('[data-act][data-tid]');if(dpAct){
    var act=dpAct.dataset.act;var tid=parseInt(dpAct.dataset.tid);
    var t=TASKS.find(function(x){return x.id===tid;});if(!t)return;
    var s=STAFF.find(function(x){return x.id===t.staffId;});
    if(act==='ap'){t.action='Approved';toast(s.name+' Task '+t.n+' Approved','s');addFeed(s.name.split(' ')[0]+' Task '+t.n+' Approved','green');S.boardDp=null;rBoard();autoSave();}
    else if(act==='rj'){t.action='Rejected';toast(s.name+' Task '+t.n+' Rejected','e');addFeed(s.name.split(' ')[0]+' Task '+t.n+' Rejected','red');S.boardDp=null;rBoard();autoSave();}
    else if(act==='cl'){t.action='';S.boardDp=null;rBoard();toast('Cleared','i');autoSave();}
    else if(act==='rm'||act==='rv'){
      var sv=e.target.closest('[data-sid]');
      if(sv){S.selStaff=sv.dataset.sid;}else{S.selStaff=t.staffId;}
      S.boardDp=null;rBoard();
    }
    return;
  }
  // group toggle
  var grp=e.target.closest('[data-grp]');
  if(grp){
    var gid=grp.dataset.grp;
    S.boardCollapsed[gid]=!S.boardCollapsed[gid];
    rBoard();
    return;
  }
  // review button
  var rvBtn=e.target.closest('[data-act="rv"]');if(rvBtn){var sid=rvBtn.dataset.sid;if(sid){S.selStaff=sid;rBoard();}return;}
  // close dp if clicking elsewhere
  if(S.boardDp){S.boardDp=null;rBoard();}
});

// ── USER PROFILE DROPDOWN ────────────────────────────────────────
function toggleUserMenu(e) {
  e.stopPropagation();
  var dropdown = document.getElementById('userDropdown');

  if (!dropdown) return;

  dropdown.classList.toggle('show');

  // Update dropdown content
  var nameEl = dropdown.querySelector('.dropdown-name');
  var emailEl = dropdown.querySelector('.dropdown-email');
  var avatarEl = dropdown.querySelector('.ava');

  if (nameEl) nameEl.textContent = AUTH_USER.name;
  if (emailEl) emailEl.textContent = AUTH_USER.email;
  if (avatarEl) avatarEl.textContent = AUTH_USER.initials;
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  var dropdown = document.getElementById('userDropdown');
  if (dropdown && dropdown.classList.contains('show')) {
    dropdown.classList.remove('show');
  }
});

// Prevent dropdown from closing when clicking inside it
var userDropdownEl = document.getElementById('userDropdown');
if (userDropdownEl) {
  userDropdownEl.addEventListener('click', function(e) {
    e.stopPropagation();
  });
}

// ── PROFILE MODAL ─────────────────────────────────────────────────
function openProfileModal() {
  // Close dropdown
  var dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.classList.remove('show');

  // Show modal
  var modal = document.getElementById('profileModal');
  if (modal) {
    modal.style.display = 'flex';

    // Populate profile data
    var nameEl = document.getElementById('profile-name');
    var emailEl = document.getElementById('profile-email');
    var roleEl = document.getElementById('profile-role');

    if (nameEl) nameEl.textContent = AUTH_USER.name;
    if (emailEl) emailEl.textContent = AUTH_USER.email;
    if (roleEl) roleEl.textContent = AUTH_USER.role;

    // Update avatar
    var avatars = modal.querySelectorAll('.ava');
    avatars.forEach(function(ava) {
      ava.textContent = AUTH_USER.initials;
    });

    // Update header info
    var titleEls = modal.querySelectorAll('div[style*="font-size:18px"]');
    if (titleEls[0]) titleEls[0].textContent = AUTH_USER.name;

    var subtitleEls = modal.querySelectorAll('div[style*="font-size:12px;color:var(--t3)"]');
    if (subtitleEls[0]) subtitleEls[0].textContent = AUTH_USER.email;
  }
}

function closeProfileModal() {
  var modal = document.getElementById('profileModal');
  if (modal) {
    modal.style.display = 'none';
    // Reset change password form
    var form = document.getElementById('changePasswordForm');
    if (form) form.reset();
  }
}

function handleChangePassword(e) {
  e.preventDefault();

  var form = e.target;
  var formData = new FormData(form);
  var newPassword = formData.get('new_password');
  var confirmPassword = formData.get('new_password_confirmation');

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    toast('New passwords do not match!', 'e');
    return;
  }

  // Prepare data
  var data = {
    current_password: formData.get('current_password'),
    new_password: newPassword,
    new_password_confirmation: confirmPassword
  };

  // Get CSRF token
  var csrfToken = document.querySelector('meta[name="csrf-token"]');
  var token = csrfToken ? csrfToken.getAttribute('content') : '';

  // Send to backend
  fetch('/admin/profile/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': token,
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(result) {
    if (result.success) {
      toast('Password updated successfully!', 's');
      form.reset();
    } else {
      toast(result.message || 'Failed to update password', 'e');
    }
  })
  .catch(function(error) {
    console.error('Error:', error);
    toast('An error occurred. Please try again.', 'e');
  });
}

// ── USER MANAGEMENT MODAL ────────────────────────────────────────
function openUserManagementModal() {
  // Close dropdown
  var dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.classList.remove('show');

  // Update modal title and form visibility based on role
  var form = document.getElementById('addUserForm');
  var title = document.getElementById('userMgmtTitle');
  var subtitle = document.getElementById('userMgmtSubtitle');

  if (AUTH_USER.isAdmin) {
    // Admin view - show form and management title
    if (form) form.style.display = 'block';
    if (title) title.textContent = 'User Management';
    if (subtitle) subtitle.textContent = 'Add new user to the system';
    // Reset to add mode
    resetUserForm();
  } else {
    // Non-admin view - hide form, show profile title
    if (form) form.style.display = 'none';
    if (title) title.textContent = 'My Profile';
    if (subtitle) subtitle.textContent = 'View and edit your profile information';
  }

  // Show modal
  var modal = document.getElementById('userManagementModal');
  if (modal) {
    modal.style.display = 'flex';
    // Load users when modal opens
    loadUsers();
  }
}

function closeUserManagementModal() {
  var modal = document.getElementById('userManagementModal');
  if (modal) {
    modal.style.display = 'none';
    // Reset form
    resetUserForm();
  }
}

function resetUserForm() {
  var form = document.getElementById('addUserForm');
  if (form) form.reset();

  // Reset to add mode
  document.getElementById('editUserId').value = '';
  document.getElementById('submitUserBtnText').textContent = 'Add User';
  document.getElementById('userPassword').required = true;
  document.getElementById('passwordOptional').style.display = 'none';

  // Hide custom role input
  var roleCustomWrapper = document.getElementById('userRoleCustomWrapper');
  if (roleCustomWrapper) roleCustomWrapper.style.display = 'none';
}

function toggleRoleCustomInput() {
  var roleSelect = document.getElementById('userRole');
  var roleCustomWrapper = document.getElementById('userRoleCustomWrapper');

  if (roleSelect && roleCustomWrapper) {
    roleCustomWrapper.style.display = roleSelect.value === 'Other' ? 'block' : 'none';
  }
}

function loadUsers() {
  var usersList = document.getElementById('usersList');
  if (!usersList) return;

  // Show loading state
  usersList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3);font-size:13px">Loading users...</div>';

  // Get CSRF token
  var csrfToken = document.querySelector('meta[name="csrf-token"]');
  var token = csrfToken ? csrfToken.getAttribute('content') : '';

  fetch('/admin/users', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-CSRF-TOKEN': token
    }
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(result) {
    if (result.success && result.users) {
      var usersToDisplay = result.users;

      // For non-admin users, show only their own record
      if (!AUTH_USER.isAdmin) {
        usersToDisplay = result.users.filter(function(user) {
          return user.email === AUTH_USER.email;
        });
      }

      displayUsers(usersToDisplay);
      // Also sync ALL users to STAFF array for task management (admins need to see all for tasks)
      syncUsersToStaff(result.users);
    } else {
      usersList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3);font-size:13px">Failed to load users</div>';
    }
  })
  .catch(function(error) {
    console.error('Error loading users:', error);
    usersList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3);font-size:13px">Error loading users</div>';
  });
}

// Sync users from User Management to STAFF array for task management
function syncUsersToStaff(users) {
  STAFF.length = 0;
  users.forEach(function(user) {
    STAFF.push({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      inst: user.department,
      active: true
    });
  });
}

function displayUsers(users) {
  var usersList = document.getElementById('usersList');
  if (!usersList) return;

  if (users.length === 0) {
    usersList.innerHTML = '<div style="text-align:center;padding:20px;color:#6b7280;font-size:13px">No users found</div>';
    return;
  }

  var html = '';
  users.forEach(function(user) {
    var initials = user.name ? user.name.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase();
    var roleDisplay = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    var departmentDisplay = user.department || 'N/A';
    var isCurrentUser = AUTH_USER.email === user.email;

    html += '<div style="display:flex;align-items:center;gap:12px;padding:14px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">';
    html += '  <div style="width:44px;height:44px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;border-radius:50%;flex-shrink:0">' + initials + '</div>';
    html += '  <div style="flex:1;min-width:0">';
    html += '    <div style="font-size:14px;font-weight:600;color:#1f2937">' + user.name + '</div>';
    html += '    <div style="font-size:12px;color:#6b7280">' + user.email + ' • ' + roleDisplay + ' • ' + departmentDisplay + '</div>';
    html += '  </div>';

    html += '  <div style="display:flex;gap:8px;flex-shrink:0">';

    // Always show Edit button for everyone
    html += '    <button onclick="editUser(\'' + user.id + '\')" style="padding:8px 14px;background:#3b82f6;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background=\'#2563eb\'" onmouseout="this.style.background=\'#3b82f6\'">Edit</button>';

    // Show Delete button only for Admin users (not for non-admins)
    if (AUTH_USER.isAdmin) {
      // Admin users can delete others, but not themselves
      if (!isCurrentUser) {
        html += '    <button onclick="deleteUser(\'' + user.id + '\', \'' + user.name + '\')" style="padding:8px 14px;background:#ef4444;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background=\'#dc2626\'" onmouseout="this.style.background=\'#ef4444\'">Delete</button>';
      } else {
        // Show "Current User" badge for admin viewing themselves
        html += '    <div style="padding:8px 14px;background:#e5e7eb;color:#6b7280;border-radius:6px;font-size:12px;font-weight:600">Current User</div>';
      }
    }

    html += '  </div>';

    html += '</div>';
  });

  usersList.innerHTML = html;
}

function deleteUser(userId, userName) {
  showConfirmDialog(
    'Delete User',
    'Are you sure you want to delete user "' + userName + '"? This action cannot be undone.',
    function() {
      performDeleteUser(userId, userName);
    }
  );
}

function performDeleteUser(userId, userName) {

  // Get CSRF token
  var csrfToken = document.querySelector('meta[name="csrf-token"]');
  var token = csrfToken ? csrfToken.getAttribute('content') : '';

  fetch('/admin/users/' + userId, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'X-CSRF-TOKEN': token
    }
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(result) {
    if (result.success) {
      toast('User deleted successfully!', 's');
      loadUsers(); // Reload the user list (this also syncs to STAFF)
      // Also refresh the main view if needed
      if (typeof renderContent === 'function' && S.view === 'tasks') {
        setTimeout(renderContent, 300);
      }
    } else {
      toast(result.message || 'Failed to delete user', 'e');
    }
  })
  .catch(function(error) {
    console.error('Error deleting user:', error);
    toast('An error occurred. Please try again.', 'e');
  });
}

function editUser(userId) {
  // Get CSRF token
  var csrfToken = document.querySelector('meta[name="csrf-token"]');
  var token = csrfToken ? csrfToken.getAttribute('content') : '';

  // Fetch user data
  fetch('/admin/users', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-CSRF-TOKEN': token
    }
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(result) {
    if (result.success && result.users) {
      var user = result.users.find(function(u) { return u.id === userId; });
      if (user) {
        // Populate form with user data
        document.getElementById('editUserId').value = user.id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userDepartment').value = user.department || '';
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').required = false;
        document.getElementById('passwordOptional').style.display = 'inline';
        document.getElementById('submitUserBtnText').textContent = 'Update User';

        // Handle role - check if it's a predefined role or custom
        var roleSelect = document.getElementById('userRole');
        var predefinedRoles = ['Developer', 'Designer', 'Manager', 'Analyst', 'Tester', 'Engineer', 'Architect', 'Administrator'];

        if (predefinedRoles.indexOf(user.role) !== -1) {
          roleSelect.value = user.role;
        } else {
          // Custom role
          roleSelect.value = 'Other';
          document.getElementById('userRoleCustom').value = user.role;
          document.getElementById('userRoleCustomWrapper').style.display = 'block';
        }

        // Scroll to top of form
        document.querySelector('.md-body').scrollTop = 0;
      }
    }
  })
  .catch(function(error) {
    console.error('Error fetching user:', error);
    toast('Failed to load user data', 'e');
  });
}

function handleSaveUser(e) {
  e.preventDefault();

  var form = e.target;
  var formData = new FormData(form);
  var userId = document.getElementById('editUserId').value;
  var isEdit = userId !== '';

  // Get role - either from dropdown or custom input
  var roleSelect = document.getElementById('userRole').value;
  var role = roleSelect;
  if (roleSelect === 'Other') {
    role = document.getElementById('userRoleCustom').value.trim();
    if (!role) {
      toast('Please enter a custom role', 'e');
      return;
    }
  }

  // Prepare data
  var data = {
    name: formData.get('name'),
    email: formData.get('email'),
    role: role,
    department: formData.get('department')
  };

  // Add password only if provided
  var password = formData.get('password');
  if (password && password.trim() !== '') {
    data.password = password;
  }

  // Get CSRF token from meta tag or form
  var csrfToken = document.querySelector('meta[name="csrf-token"]');
  var token = csrfToken ? csrfToken.getAttribute('content') : '';

  // If no meta tag, try to get from form
  if (!token) {
    var csrfInput = document.querySelector('input[name="_token"]');
    token = csrfInput ? csrfInput.value : '';
  }

  // Determine URL and method
  var url = isEdit ? '/admin/users/' + userId : '/admin/users/create';
  var method = isEdit ? 'PUT' : 'POST';

  // Send to backend
  fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': token,
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(result) {
    if (result.success) {
      toast(isEdit ? 'User updated successfully!' : 'User added successfully!', 's');
      resetUserForm();
      form.reset();
      loadUsers(); // Reload the user list (this also syncs to STAFF)
      // Also refresh the main view if needed
      if (typeof renderContent === 'function' && S.view === 'tasks') {
        setTimeout(renderContent, 300);
      }
    } else {
      toast(result.message || (isEdit ? 'Failed to update user' : 'Failed to add user'), 'e');
    }
  })
  .catch(function(error) {
    console.error('Error:', error);
    toast('An error occurred. Please try again.', 'e');
  });
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
  var profileModal = document.getElementById('profileModal');
  var userModal = document.getElementById('userManagementModal');

  if (e.target === profileModal) closeProfileModal();
  if (e.target === userModal) closeUserManagementModal();
});
