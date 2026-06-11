// ── GLOBALS ──────────────────────────────────────────────────────
var ROLES=['General Manager','Finance Controller','Admin Officer','Zonal Head','Zone Safety Head','School Head','Head Master','Vice Principal','SRPL Head','Regional Coordinator','Programme Officer','CCTV Coordinator','PED Coordinator','Admissions Head','Medical Officer','Engineer','RSA Officer','Other (type manually)'];
var INSTS=['Management','Key Members','Zonal Heads','Zone Safety','Admissions','School Heads','SRPL','Other'];
var PAL=['#0891B2','#7C3AED','#DB2777','#059669','#B45309','#DC2626','#0284C7','#065F46','#9333EA','#0F766E'];
function gc(id){return PAL[Math.abs(parseInt(String(id||'0').replace(/\D/g,''))%PAL.length)];}
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
  showAddForm:false,taskFromDate:relDate(-1),taskToDate:_today,
  overviewFromDate:_today,overviewToDate:_today,overviewSearch:''};
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

  // User Dashboard - only for Administrator role
  if(AUTH_USER.isAdmin){
    navItems += '<div class="lp-nav-item '+(S.view==='overview'?'on':'')+'" data-view="overview">'+
      '<svg class="lp-nav-ic" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>'+
      '<span class="lp-nav-lbl">Dashboard</span>'+
    '</div>';

    // User Management - only for Administrator role
    navItems += '<div class="lp-nav-item '+(S.view==='users'?'on':'')+'" data-view="users">'+
      '<svg class="lp-nav-ic" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>'+
      '<span class="lp-nav-lbl">User Management</span>'+
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

  // Bind navigation clicks
  var lpNav=el('lp');
  // Remove old listener if exists
  if(lpNav._clickHandler){
    lpNav.removeEventListener('click',lpNav._clickHandler);
  }
  // Add new listener
  lpNav._clickHandler=function(e){
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
  };
  lpNav.addEventListener('click',lpNav._clickHandler);
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
  if(!AUTH_USER.isAdmin||S.view==='tasks'||S.view==='users'){tbar.style.display='none';return;}
  tbar.style.display='flex';
  var tabs=[{v:'overview',lbl:'&#9617; Overview'},{v:'board',lbl:'&#9776; Board'},{v:'timeline',lbl:'&#9641; Timeline'},{v:'analytics',lbl:'&#9656; Analytics'}];
  tbar.innerHTML=tabs.map(function(t){return '<div class="tab'+(S.view===t.v?' on':'')+'" data-tab="'+t.v+'">'+t.lbl+'</div>';}).join('');

  // Remove old listener if exists
  if(tbar._clickHandler){
    tbar.removeEventListener('click',tbar._clickHandler);
  }
  // Add new listener
  tbar._clickHandler=function(e){
    var tab=e.target.closest('[data-tab]');
    if(!tab)return;
    S.view=tab.dataset.tab;
    S.selStaff=null;
    renderContent();
    rLp();
    rTabBar();
  };
  tbar.addEventListener('click',tbar._clickHandler);
}

// ── STAFF MANAGEMENT PAGE ─────────────────────────────────────────
// Staff Management page removed - use User Management instead

// ── OVERVIEW ──────────────────────────────────────────────────────
function rOverview(){
  if(S.selStaff){el('ct').innerHTML='<div class="dash fi">'+rStaffDetail(S.selStaff)+'</div>';bindDetailEvents();return;}

  // Helper function to get tasks in date range for a user
  var tasksInRange=function(staffId,fromDate,toDate){
    return TASKS.filter(function(t){
      return t.staffId===staffId && t.date>=fromDate && t.date<=toDate;
    });
  };

  // Calculate stats for the selected date range only
  var tasksInDateRange=TASKS.filter(function(t){
    return t.date>=S.overviewFromDate && t.date<=S.overviewToDate;
  });
  var tot=tasksInDateRange.length;
  var ap=tasksInDateRange.filter(function(t){return t.action==='Approved';}).length;
  var rj=tasksInDateRange.filter(function(t){return t.action==='Rejected';}).length;
  var pn=tasksInDateRange.filter(function(t){return !t.action;}).length;
  var dn=tasksInDateRange.filter(function(t){return t.status==='Done';}).length;
  var apP=tot?Math.round(ap/tot*100):0,rjP=tot?Math.round(rj/tot*100):0;
  var pnP=tot?Math.round(pn/tot*100):0,dnP=tot?Math.round(dn/tot*100):0;
  var kpis=[{cl:'kg',lbl:'Approved',val:ap,pct:apP,fc:'#059669',filter:'approved'},{cl:'kr',lbl:'Rejected',val:rj,pct:rjP,fc:'#DC2626',filter:'rejected'},{cl:'ka',lbl:'Pending Review',val:pn,pct:pnP,fc:'#B45309',filter:'pending'},{cl:'kb',lbl:'Completion',val:dnP+'%',pct:dnP,fc:'#0369A1',filter:'all'}];
  var kpiHTML=kpis.map(function(k){return '<div class="kpi '+k.cl+'" data-kpi-filter="'+k.filter+'" style="cursor:pointer"><div class="kpi-lbl">'+esc(k.lbl)+'</div><div class="kpi-val">'+k.val+'</div><div class="kpi-sub">'+k.pct+'% of total</div><div class="kpi-bar"><div class="kpi-fill" style="width:'+k.pct+'%;background:'+k.fc+'"></div></div></div>';}).join('');
  var active=activeStaff().sort(function(a,b){return a.name.localeCompare(b.name);});
  // Filter by search query
  if(S.overviewSearch){
    var query=S.overviewSearch.toLowerCase();
    active=active.filter(function(s){return s.name.toLowerCase().indexOf(query)!==-1;});
  }
  var thumbsHTML=active.map(function(s,i){
    var st2=tasksInRange(s.id,S.overviewFromDate,S.overviewToDate);
    var ap2=st2.filter(function(t){return t.action==='Approved';}).length;
    var rj2=st2.filter(function(t){return t.action==='Rejected';}).length;
    var pn2=st2.filter(function(t){return !t.action;}).length;
    var p=perf(s.id);var pc=p>=70?'var(--green)':p>=40?'var(--amber)':'var(--red)';
    var totalTasks=st2.length;
    var maxDots=5;
    var dots='';
    for(var n=1;n<=maxDots;n++){
      if(n<=totalTasks){
        var tasksOnN=st2.slice(n-1,n);
        var firstTask=tasksOnN[0];
        var bc=firstTask.action==='Approved'?'var(--green)':firstTask.action==='Rejected'?'var(--red)':firstTask.status==='Done'?'var(--amber)':'var(--border2)';
        dots+='<div class="st-dot" style="background:'+bc+'"></div>';
      }else{
        dots+='<div class="st-dot" style="background:var(--border)"></div>';
      }
    }
    return '<div class="sthumb" data-i="'+i+'"><div class="st-head"><div class="ava ava-lg" style="background:'+gbg(s.id)+';color:'+gc(s.id)+'">'+ini(s.name)+'</div>'+
      '<div class="st-info"><div class="st-name">'+esc(s.name)+'</div><div class="st-role">'+esc(s.role)+'</div><div class="st-role">'+esc(s.inst)+'</div></div>'+
      '<div class="st-pct" style="color:'+pc+'">'+p+'%</div></div>'+
      '<div class="st-stats"><span class="st-s" style="background:var(--glight);color:var(--green)">&#10003; '+ap2+'</span>'+
        '<span class="st-s" style="background:var(--rlight);color:var(--red)">&#10007; '+rj2+'</span>'+
        '<span class="st-s" style="background:var(--alight);color:var(--amber)">&#9675; '+pn2+'</span></div>'+
      '<div class="st-dots">'+dots+'</div>'+
      '<div class="st-foot"><span class="st-today">'+totalTasks+' tasks</span><button class="view-btn">Review &rsaquo;</button></div>'+
    '</div>';
  }).join('');
  var feedHTML=FEED.slice(0,8).map(function(a){var c={'green':'var(--green)','red':'var(--red)','amber':'var(--amber)','blue':'var(--p3)'}[a.col]||'var(--p3)';return '<div class="feed-row"><div class="feed-dot" style="background:'+c+'"></div><div><div class="feed-txt">'+esc(a.msg)+'</div><div class="feed-tm">'+esc(a.time)+'</div></div></div>';}).join('');

  var dateRangeText=(S.overviewFromDate===S.overviewToDate)?fmtDate(S.overviewFromDate):(fmtDate(S.overviewFromDate)+' to '+fmtDate(S.overviewToDate));
  var staffCountText=S.overviewSearch?'Showing '+active.length+' of '+activeStaff().length+' staff':'Click any card to review tasks';

  el('ct').innerHTML='<div class="dash fi">'+
    '<div class="kpi-row">'+kpiHTML+'</div>'+
    '<div class="card-sec"><div class="sec-h"><div><div class="sec-title">Staff Overview &mdash; '+esc(dateRangeText)+'</div><div class="sec-sub" style="margin-top:1px">'+staffCountText+'</div></div></div>'+
      '<div class="thumb-grid" id="tg">'+thumbsHTML+'</div></div>'+
    '<div class="card-sec"><div class="sec-h"><div class="sec-title">Activity</div><div class="live">Live</div></div>'+(FEED.length?feedHTML:'<div style="font-size:11px;color:var(--t4)">No activity yet.</div>')+'</div>'+
  '</div>';

  var tg=el('tg');if(tg)tg.addEventListener('click',function(e){var c=e.target.closest('.sthumb');if(!c)return;var s=active[parseInt(c.dataset.i)];if(s){S.selStaff=s.id;rOverview();}});
  // KPI card click handler
  var kpiCards=document.querySelectorAll('[data-kpi-filter]');kpiCards.forEach(function(card){card.addEventListener('click',function(){var filter=this.dataset.kpiFilter;S.boardFilter=filter;S.view='board';S.selStaff=null;renderContent();rLp();rTabBar();});});
}

// ── USER MANAGEMENT VIEW ─────────────────────────────────────────
function rUserManagement(){
  var users=STAFF.filter(function(s){return s.active;});

  var html='<div class="dash">'+
    '<div class="sec-h">'+
      '<div><div class="sec-title">User Management</div><div class="sec-sub">Manage all users in the system</div></div>'+
      '<div style="display:flex;align-items:center;gap:12px;margin-left:auto">'+
        '<div class="search-box">'+
          '<svg style="width:16px;height:16px;color:var(--t3);flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>'+
          '</svg>'+
          '<input type="text" id="user-search" placeholder="Search users..." style="width:200px">'+
        '</div>'+
        '<button class="btn btn-pri" onclick="openUserManagementModal()" style="white-space:nowrap">'+
          '<svg style="width:14px;height:14px;margin-right:4px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>'+
          '</svg>'+
          'Add User'+
        '</button>'+
      '</div>'+
    '</div>'+
    '<div class="staff-table-container">'+
      '<table class="staff-table">'+
        '<thead><tr>'+
          '<th>Name</th>'+
          '<th>Email</th>'+
          '<th>Role</th>'+
          '<th>Department</th>'+
          '<th>Total Tasks</th>'+
          '<th style="text-align:right">Actions</th>'+
        '</tr></thead>'+
        '<tbody id="user-tbody">';

  if(users.length===0){
    html+='<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--t3)">No users found.</td></tr>';
  }else{
    users.forEach(function(u){
      var userTasks=TASKS.filter(function(t){return t.staffId===u.id;}).length;
      var ini2=ini(u.name);
      html+='<tr class="user-row" data-name="'+esc(u.name).toLowerCase()+'" data-email="'+esc(u.email||'').toLowerCase()+'" data-role="'+esc(u.role||'').toLowerCase()+'" data-dept="'+esc(u.department||u.inst||'').toLowerCase()+'">'+
        '<td><div style="display:flex;align-items:center;gap:10px">'+
          '<div class="ava ava-md" style="background:'+gbg(u.id)+';color:'+gc(u.id)+'">'+ini2+'</div>'+
          '<div style="font-size:14px;font-weight:600;color:var(--text)">'+esc(u.name)+'</div>'+
        '</div></td>'+
        '<td><span style="font-size:13px;color:var(--t2)">'+esc(u.email||'—')+'</span></td>'+
        '<td><span class="role-badge">'+esc(u.role||'—')+'</span></td>'+
        '<td><span class="dept-badge">'+esc(u.department||u.inst||'—')+'</span></td>'+
        '<td><span style="font-size:13px;font-weight:600;color:var(--p2)">'+userTasks+'</span> <span style="font-size:11px;color:var(--t3)">tasks</span></td>'+
        '<td style="text-align:right">'+
          '<div style="display:flex;gap:6px;justify-content:flex-end">'+
            '<button class="btn btn-pri btn-sm" onclick="editUser('+u.id+')">'+
              '<svg style="width:14px;height:14px;margin-right:3px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>'+
              '</svg>'+
              'Edit'+
            '</button>'+
            (u.id!=AUTH_USER.id?'<button class="btn btn-out btn-sm" onclick="deleteUser('+u.id+',\''+esc(u.name)+'\')" style="color:var(--red);border-color:var(--red)">'+
              '<svg style="width:14px;height:14px;margin-right:3px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>'+
              '</svg>'+
              'Delete'+
            '</button>':'')+
          '</div>'+
        '</td>'+
      '</tr>';
    });
  }

  html+='</tbody></table></div></div>';
  el('ct').innerHTML=html;

  // Search functionality
  var searchInput=el('user-search');
  if(searchInput){
    searchInput.onkeydown=function(e){
      if(e.key==='Enter'||e.keyCode===13){
        var query=this.value.toLowerCase().trim();
        var rows=document.querySelectorAll('.user-row');
        rows.forEach(function(row){
          var name=row.dataset.name||'';
          var email=row.dataset.email||'';
          var role=row.dataset.role||'';
          var dept=row.dataset.dept||'';
          var matches=!query||name.includes(query)||email.includes(query)||role.includes(query)||dept.includes(query);
          row.style.display=matches?'':'none';
        });
      }
    };
  }
}

// ── BOARD VIEW ────────────────────────────────────────────────────
function rBoard(){
  if(S.selStaff){el('ct').innerHTML='<div class="board-wrap fi">'+rStaffDetail(S.selStaff)+'</div>';bindDetailEvents();return;}
  var active=activeStaff();

  // Filter staff by search query (search by name, email, role, department)
  var filteredStaff=active;
  if(S.boardSearch){
    var q=S.boardSearch.toLowerCase();
    filteredStaff=active.filter(function(s){
      return (s.name||'').toLowerCase().includes(q)||
             (s.email||'').toLowerCase().includes(q)||
             (s.role||'').toLowerCase().includes(q)||
             (s.department||'').toLowerCase().includes(q)||
             (s.inst||'').toLowerCase().includes(q);
    });
  }

  // Filter tasks for the filtered staff
  var allTs=TASKS.filter(function(t){
    var s=filteredStaff.find(function(x){return x.id===t.staffId;});
    return s&&s.active;
  });

  // Apply status filters to tasks
  if(S.boardFilter==='approved')allTs=allTs.filter(function(t){return t.action==='Approved';});
  else if(S.boardFilter==='rejected')allTs=allTs.filter(function(t){return t.action==='Rejected';});
  else if(S.boardFilter==='pending')allTs=allTs.filter(function(t){return !t.action;});
  else if(S.boardFilter==='today')allTs=allTs.filter(function(t){return t.date===S.selDate;});

  // Filter staff to only show those with tasks matching the current filter
  var staffWithFilteredTasks=filteredStaff.filter(function(s){
    var staffTasks=allTs.filter(function(t){return t.staffId===s.id;});
    return staffTasks.length>0;
  });

  // group by staff
  var groups=staffWithFilteredTasks.map(function(s,gi){
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
        // Replace dropdown with always-visible inline buttons
        var acBtn='<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap">'+
          '<button class="btn-icon btn-icon-grn" title="Approve" style="'+(t.action==='Approved'?'background:var(--green);color:#fff;':'')+'" data-act="ap" data-tid="'+t.id+'">'+
            '<svg style="width:12px;height:12px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>'+
            '</svg>'+
          '</button>'+
          '<button class="btn-icon btn-icon-red" title="Reject" style="'+(t.action==='Rejected'?'background:var(--red);color:#fff;':'')+'" data-act="rj" data-tid="'+t.id+'">'+
            '<svg style="width:12px;height:12px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path>'+
            '</svg>'+
          '</button>'+
          (t.action?'<button class="btn-icon" title="Clear" style="background:var(--t4);color:#fff" data-act="cl" data-tid="'+t.id+'">'+
            '<svg style="width:12px;height:12px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>'+
            '</svg>'+
          '</button>':'')+
        '</div>';
        var priColor=t.priority==='High'?'var(--red)':t.priority==='Medium'?'var(--amber)':'var(--green)';
        var statusBadge=t.action==='Approved'?'<span class="bdg bdg-ap">Approved</span>':t.action==='Rejected'?'<span class="bdg bdg-rj">Rejected</span>':'<span class="bdg bdg-nr">Pending</span>';
        rowsHTML+='<tr class="btr'+rc+'" data-tid="'+t.id+'">'+
          '<td style="text-align:center!important"><span class="bd-num">'+t.n+'</span></td>'+
          '<td><div class="bd-desc" title="'+esc(t.desc)+'">'+esc(t.desc.length>55?t.desc.slice(0,55)+'...':t.desc)+'</div></td>'+
          '<td style="text-align:center!important">'+statusBadge+'</td>'+
          '<td style="text-align:center!important">'+acBtn+'</td>'+
          '<td style="text-align:center!important"><span style="font-size:10px;font-weight:600;color:'+priColor+'">'+esc(t.priority)+'</span></td>'+
          '<td style="text-align:center!important;font-size:10px;color:var(--t3)">'+esc(fmtDate(t.date))+'</td>'+
          '<td><div class="rem-cell'+(t.remarks?'':' rem-empty')+'" onclick="openRemarksEditor('+t.id+')" style="cursor:pointer" title="Click to edit remarks">'+(t.remarks?esc(t.remarks.slice(0,30))+(t.remarks.length>30?'...':''):'Add remarks...')+'</div></td>'+
        '</tr>';
      });
    }
    return '<div class="board-group">'+
      '<div class="bg-header" data-grp="'+s.id+'">'+
        '<div class="bg-stripe" style="background:'+stripe+'"></div>'+
        '<span class="bg-chev'+(coll?'':' open')+'">&rsaquo;</span>'+
        '<div class="bg-title">'+
          '<div style="display:flex;flex-direction:column;gap:2px">'+
            '<div>'+esc(s.name)+'</div>'+
            '<div style="font-size:11px;font-weight:400;color:var(--t3)">'+esc(s.email||'—')+' <span style="color:var(--t4)">•</span> '+esc(s.role||'—')+'</div>'+
          '</div>'+
        '</div>'+
        '<span class="bg-count">'+ts.length+'</span>'+
        '<div class="bg-stats"><span style="color:var(--green)">&#10003; '+ap+'</span><span style="color:var(--red)">&#10007; '+rj+'</span><span style="color:var(--amber)">&#9675; '+pn+'</span></div>'+
        '<button class="btn btn-out btn-xs" onclick="event.stopPropagation();viewStaffTasks(\''+s.id+'\')" style="margin-left:auto;margin-right:8px" title="View all tasks for this user">'+
          '<svg style="width:12px;height:12px;margin-right:3px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>'+
          '</svg>'+
          'View All'+
        '</button>'+
      '</div>'+
      (!coll?'<table class="board-tbl"><thead><tr>'+
        '<th style="text-align:center!important">#</th>'+
        '<th>Task</th>'+
        '<th style="text-align:center!important">Status</th>'+
        '<th style="text-align:center!important">Action</th>'+
        '<th style="text-align:center!important">Priority</th>'+
        '<th style="text-align:center!important">Date</th>'+
        '<th>Remarks</th>'+
      '</tr></thead><tbody>'+rowsHTML+'</tbody></table>':'')+'</div>';
  }).join('');
  var filterPills=[['all','All'],['today','Today'],['approved','Approved'],['rejected','Rejected'],['pending','Pending']];
  el('ct').innerHTML='<div class="board-wrap fi">'+
    '<div class="board-toolbar">'+
      '<div class="search-box"><span style="color:var(--t4)">&#9906;</span><input id="bd-srch" placeholder="Search users... (press Enter)" value="'+esc(S.boardSearch)+'"></div>'+
      '<div class="board-divider"></div>'+
      filterPills.map(function(f){return '<button class="filter-pill'+(S.boardFilter===f[0]?' on':'')+'" data-filter="'+f[0]+'">'+f[1]+'</button>';}).join('')+
      '<div class="board-divider"></div>'+
      '<span style="font-size:11px;color:var(--t3);margin-left:auto">'+allTs.length+' tasks</span>'+
    '</div>'+
    (staffWithFilteredTasks.length>0?groups:'<div style="text-align:center;padding:40px;color:var(--t4);font-size:13px">No tasks match the current filter.</div>')+
  '</div>';
  // Bind search - trigger only on Enter key press
  var bdSrch=el('bd-srch');
  if(bdSrch){
    bdSrch.onkeydown=function(e){
      if(e.key==='Enter'||e.keyCode===13){
        S.boardSearch=this.value;
        rBoard();
      }
    };
  }
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
      return '<td class="tl-cell"><div class="tl-seg" style="background:'+c+';left:35%;width:'+w+'%;opacity:.85;text-align:center" title="'+tot+' tasks, '+ap+' approved">'+ap+'/'+tot+'</div></td>';
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
    return '<div class="perf-row"><div class="perf-name">'+esc(s.name)+'</div>'+
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
          '<button class="btn btn-pri btn-sm" data-act="savrem" data-tid="'+t.id+'" style="margin-top:8px">'+
            '<svg style="width:14px;height:14px;margin-right:4px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'+
            '</svg>'+
            'Save Remarks'+
          '</button>'+
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
    var staffName=s?s.name:'Staff';
    if(act==='approve'){
      t.action='Approved';
      toast(staffName+' Task '+t.n+' Approved','s');
      addFeed(staffName.split(' ')[0]+' Task '+t.n+' Approved','green');
      schedSave();
      renderContent();
      bindDetailEvents();
    }
    else if(act==='reject'){
      t.action='Rejected';
      toast(staffName+' Task '+t.n+' Rejected','e');
      addFeed(staffName.split(' ')[0]+' Task '+t.n+' Rejected','red');
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
  if(mb)mb.addEventListener('click',function(e){
    var btn=e.target.closest('[data-delid]');
    if(!btn)return;
    var did=parseInt(btn.dataset.delid);

    // Call DELETE API endpoint
    fetch('/api/tasks/'+did,{
      method:'DELETE',
      credentials:'same-origin',
      headers:{
        'Content-Type':'application/json',
        'X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]')?.content||''
      }
    }).then(function(r){
      return r.json();
    }).then(function(data){
      if(data.success){
        // Remove from local TASKS array
        TASKS=TASKS.filter(function(t){return t.id!==did;});
        toast('Task removed','e');
        closeOv();
        openAssign(id);
        rLp();
        renderContent();
      }else{
        toast('Failed to delete task: '+(data.message||'Unknown error'),'e');
      }
    }).catch(function(e){
      console.error('Delete task error:',e);
      toast('Error deleting task','e');
    });
  });
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
  if(!AUTH_USER.isAdmin||S.view==='tasks'||S.view==='users'){cbar.style.display='none';return;}
  cbar.style.display='flex';
  var active=activeStaff();
  var totalStaff=active.length;

  // Filter tasks by date range
  var allTs=TASKS.filter(function(t){return t.date>=S.overviewFromDate && t.date<=S.overviewToDate;});

  // Calculate stats based on date range
  var staffWithTasks=active.filter(function(s){
    var staffTasks=TASKS.filter(function(t){return t.staffId===s.id && t.date>=S.overviewFromDate && t.date<=S.overviewToDate;});
    return staffTasks.length>0;
  }).length;
  var staffWithoutTasks=totalStaff-staffWithTasks;

  // Calculate today's tasks
  var todaysTasks=TASKS.filter(function(t){return t.date===_today;});
  var todayTotal=todaysTasks.length;
  var todayNotSubmitted=todaysTasks.filter(function(t){return !t.action;}).length;

  function tile(bg,clr,bdr,icon,label,val,clickAction){
    var cursor=clickAction?'cursor:pointer;':'';
    var dataAction=clickAction?'data-action="'+clickAction+'"':'';
    return '<span class="consol-stat" '+dataAction+' style="background:'+bg+';color:'+clr+';border:1px solid '+bdr+';'+cursor+'">'+
      '<span class="cs-icon">'+icon+'</span>'+
      '<span class="cs-body">'+
        '<span class="cs-label">'+label+'</span>'+
        '<span class="cs-val" style="color:'+clr+'">'+val+'</span>'+
      '</span>'+
    '</span>';
  }

  cbar.innerHTML=
    tile('rgba(8,145,178,.1)','var(--p2)','rgba(8,145,178,.25)','&#128101;','Total Staff',totalStaff,'users')+
    '<div class="consol-divider"></div>'+
    tile('var(--glight)','var(--green)','var(--gborder)','&#128203;','Today Total Tasks',todayTotal,'tasks')+
    tile('var(--bg2)','var(--t2)','var(--border)','&#8854;','Tasks Not Submitted',todayNotSubmitted,'tasks')+
    '<div class="consol-divider"></div>'+
    '<div class="consol-right">'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<input type="text" id="overviewSearchInput" placeholder="Search staff by name..." value="'+esc(S.overviewSearch)+'" style="padding:10px 20px;border:1px solid var(--border);border-radius:25px;font-size:13px;width:320px;outline:none;box-shadow:0 1px 2px rgba(0,0,0,0.05)">'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<label style="font-size:11px;font-weight:600;color:var(--t2);white-space:nowrap">From:</label>'+
        '<input type="date" class="date-inp" id="cbar-from" value="'+S.overviewFromDate+'" style="width:130px">'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px;margin-right:12px">'+
        '<label style="font-size:11px;font-weight:600;color:var(--t2);white-space:nowrap">To:</label>'+
        '<input type="date" class="date-inp" id="cbar-to" value="'+S.overviewToDate+'" style="width:130px">'+
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

  // Tile click handlers
  var tiles=document.querySelectorAll('.consol-stat[data-action]');
  tiles.forEach(function(tile){
    tile.onclick=function(){
      var action=this.dataset.action;
      if(action==='users'){
        S.view='users';
        renderContent();
        rLp();
        rTabBar();
      }else if(action==='tasks'){
        S.view='tasks';
        S.selDate=_today;
        renderContent();
        rLp();
        rTabBar();
      }
    };
  });

  // Date range picker handlers
  var cbarFrom=el('cbar-from');
  if(cbarFrom){
    cbarFrom.onchange=function(){
      S.overviewFromDate=this.value;
      render();
    };
  }
  var cbarTo=el('cbar-to');
  if(cbarTo){
    cbarTo.onchange=function(){
      S.overviewToDate=this.value;
      render();
    };
  }

  // Search input handler
  var searchInput=el('overviewSearchInput');
  if(searchInput){
    searchInput.oninput=function(e){
      var cursorPos=e.target.selectionStart;
      S.overviewSearch=e.target.value;
      renderContent();
      // Restore focus and cursor position
      var newInput=el('overviewSearchInput');
      if(newInput){
        newInput.focus();
        newInput.setSelectionRange(cursorPos,cursorPos);
      }
    };
  }
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
        '<button class="btn btn-pri" onclick="openAssignTask(\''+AUTH_USER.id+'\')" style="white-space:nowrap">'+
          '<svg style="width:14px;height:14px;margin-right:4px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>'+
          '</svg>'+
          'Add Task'+
        '</button>'+
      '</div>'+
    '</div>'+
    '<div class="staff-table-container">'+
      '<table class="staff-table">'+
        '<thead><tr>'+
          '<th>Name</th>'+
          '<th>Email</th>'+
          '<th>Role</th>'+
          '<th>Department</th>'+
          '<th>Tasks in Range</th>'+
          '<th style="text-align:right">Actions</th>'+
        '</tr></thead>'+
        '<tbody id="task-staff-tbody">';

  if(staffWithTasks.length===0){
    html+='<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--t3)">No tasks found in this date range. Use "Assign Task" to create new tasks.</td></tr>';
  }else{
    staffWithTasks.forEach(function(s){
      var dateRangeTasks=TASKS.filter(function(t){
        return t.staffId===s.id&&t.date>=S.taskFromDate&&t.date<=S.taskToDate;
      });
      var ini2=ini(s.name);
      html+='<tr class="task-staff-row" data-name="'+esc(s.name).toLowerCase()+'" data-role="'+esc(s.role||'').toLowerCase()+'" data-dept="'+esc(s.department||s.inst||'').toLowerCase()+'">'+
        '<td><div style="display:flex;align-items:center;gap:10px">'+
          '<div class="ava ava-md" style="background:'+gbg(s.id)+';color:'+gc(s.id)+'">'+ini2+'</div>'+
          '<div style="font-size:14px;font-weight:600;color:var(--text)">'+esc(s.name)+'</div>'+
        '</div></td>'+
        '<td><span style="font-size:13px;color:var(--t2)">'+esc(s.email||'—')+'</span></td>'+
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
      fromDate:relDate(-1),  // Yesterday
      toDate:_today,         // Today
      priority:'all',
      status:'all'
    };
  }

  var allMyTasks=TASKS.filter(function(t){
    return t.staffId==AUTH_USER.id; // Use == to handle string/number type differences
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
        '<button id="add-my-task-btn" class="btn" style="background:#14b8a6;color:#ffffff;padding:8px 16px;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;margin-left:8px">'+
          '<svg style="width:16px;height:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>'+
          '</svg>'+
          'Add Task'+
        '</button>'+
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
              '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
                '<div style="padding:5px 10px;border-radius:6px;font-size:11px;font-weight:600;background:'+statusBg+';color:'+statusColor+'">'+
                  statusText+
                '</div>';

          // Show Mark as Done button only if task is not done and not rejected
          if(task.status!=='Done'&&task.action!=='Rejected'){
            html+='<button onclick="markTaskDone('+task.id+')" style="padding:5px 10px;background:#10b981;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap">✓ Done</button>';
          }

          // Edit button - allow editing if not approved/rejected
          if(!task.action){
            html+='<button onclick="editMyTask('+task.id+')" style="padding:5px 10px;background:#3b82f6;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap">✏ Edit</button>';
          }

          // Delete button
          html+='<button onclick="deleteTask('+task.id+',\''+esc(AUTH_USER.name)+'\')" style="padding:5px 10px;background:#dc2626;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap">🗑 Delete</button>';

          html+='  </div>'+
            '</div>';

          if(task.remarks){
            html+='<div style="background:#FEF3C7;border-left:3px solid #F59E0B;border-radius:6px;padding:8px;margin-bottom:6px">'+
              '<div style="font-size:10px;font-weight:600;color:#D97706;margin-bottom:3px">Director Remarks:</div>'+
              '<div style="font-size:12px;color:#92400E">'+esc(task.remarks)+'</div>'+
            '</div>';
          }

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

  // Bind Add Task button
  var addTaskBtn=el('add-my-task-btn');
  if(addTaskBtn){
    addTaskBtn.onclick=function(){
      openAssignTask(AUTH_USER.id);
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

// Edit task for users
function editMyTask(taskId){
  var task=TASKS.find(function(t){return t.id==taskId;});
  if(!task){
    toast('Task not found','e');
    return;
  }

  // Don't allow editing if task is already approved or rejected
  if(task.action){
    toast('Cannot edit task that has been '+task.action.toLowerCase(),'w');
    return;
  }

  var html='<div class="modal" onclick="event.stopPropagation()" style="max-width:550px">'+
    '<div class="m-head">'+
      '<div style="flex:1">'+
        '<div style="font-size:18px;font-weight:700;color:var(--t1)">Edit Task</div>'+
        '<div style="font-size:12px;color:var(--t3);margin-top:4px">Update your task details</div>'+
      '</div>'+
      '<button onclick="closeOv()" style="background:none;border:none;font-size:24px;color:var(--t3);cursor:pointer;padding:0;width:32px;height:32px">&times;</button>'+
    '</div>'+
    '<div class="m-body" style="max-height:calc(90vh - 200px);overflow-y:auto">'+
      '<div style="margin-bottom:16px">'+
        '<label style="display:block;font-size:12px;font-weight:600;color:var(--t2);margin-bottom:6px">Task Description *</label>'+
        '<textarea id="edit-task-desc" rows="4" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;resize:vertical" placeholder="Describe what you did...">'+esc(task.desc||'')+'</textarea>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'+
        '<div>'+
          '<label style="display:block;font-size:12px;font-weight:600;color:var(--t2);margin-bottom:6px">Status</label>'+
          '<select id="edit-task-status" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:6px;font-size:13px">'+
            '<option value="Pending"'+(task.status==='Pending'?' selected':'')+'>Pending</option>'+
            '<option value="Done"'+(task.status==='Done'?' selected':'')+'>Done</option>'+
          '</select>'+
        '</div>'+
        '<div>'+
          '<label style="display:block;font-size:12px;font-weight:600;color:var(--t2);margin-bottom:6px">Priority</label>'+
          '<select id="edit-task-priority" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:6px;font-size:13px">'+
            '<option value="High"'+(task.priority==='High'?' selected':'')+'>High</option>'+
            '<option value="Medium"'+(task.priority==='Medium'?' selected':'')+'>Medium</option>'+
            '<option value="Low"'+(task.priority==='Low'?' selected':'')+'>Low</option>'+
          '</select>'+
        '</div>'+
      '</div>'+
      '<div style="margin-bottom:16px">'+
        '<label style="display:block;font-size:12px;font-weight:600;color:var(--t2);margin-bottom:6px">My Notes (Optional)</label>'+
        '<textarea id="edit-task-staffrem" rows="3" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;resize:vertical" placeholder="Add any additional notes...">'+esc(task.staffRem||'')+'</textarea>'+
      '</div>'+
    '</div>'+
    '<div class="m-foot" style="display:flex;gap:10px;justify-content:flex-end">'+
      '<button onclick="closeOv()" class="btn" style="background:var(--bg2);color:var(--t2);padding:10px 20px;border:1px solid var(--border);border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">Cancel</button>'+
      '<button id="save-edit-task-btn" class="btn" style="background:#3b82f6;color:white;padding:10px 20px;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">Save Changes</button>'+
    '</div>'+
  '</div>';

  showOv(html);

  // Save button handler
  el('save-edit-task-btn').onclick=function(){
    var desc=(el('edit-task-desc')||{}).value||'';
    var status=(el('edit-task-status')||{}).value||'Pending';
    var priority=(el('edit-task-priority')||{}).value||'Medium';
    var staffRem=(el('edit-task-staffrem')||{}).value||'';

    if(!desc.trim()){
      toast('Please enter a task description','w');
      return;
    }

    // Update task
    task.desc=desc.trim();
    task.status=status;
    task.priority=priority;
    task.staffRem=staffRem.trim();

    toast('Task updated successfully!','s');
    addFeed('Task updated: '+task.desc,'blue');
    schedSave();
    closeOv();
    showMyTasks(); // Refresh the view
  };
}

// Delete task (Admin only)
function deleteTask(taskId,staffName){
  console.log('deleteTask called with taskId:',taskId,'Type:',typeof taskId);

  var task=TASKS.find(function(t){return t.id==taskId;});

  if(!task){
    console.error('Task not found for deletion. ID:',taskId);
    toast('Task not found','e');
    return;
  }

  // Show custom confirmation modal
  showConfirmDialog(
    'Delete Task?',
    'Are you sure you want to delete this task: "'+esc(task.desc)+'"? This action cannot be undone.',
    function(){
      // On confirm - call DELETE API endpoint
      fetch('/api/tasks/'+taskId,{
        method:'DELETE',
        credentials:'same-origin',
        headers:{
          'Content-Type':'application/json',
          'X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]')?.content||''
        }
      }).then(function(r){
        return r.json();
      }).then(function(data){
        if(data.success){
          // Remove from local TASKS array
          var taskIndex=TASKS.findIndex(function(t){return t.id==taskId;});
          if(taskIndex>-1){
            TASKS.splice(taskIndex,1);
          }

          toast('Task deleted successfully!','s');
          addFeed('Task deleted: '+task.desc,'red');

          // Close modal and refresh the view
          closeOv();

          // Refresh based on current view
          if(S.view==='tasks'){
            if(AUTH_USER.isAdmin){
              rTaskManagementPage();
            }else{
              showMyTasks();
            }
          }else{
            render();
          }
        }else{
          toast('Failed to delete task: '+(data.message||'Unknown error'),'e');
        }
      }).catch(function(e){
        console.error('Delete task error:',e);
        toast('Error deleting task. Please try again.','e');
      });
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
  console.log('viewStaffTasks called with id:',id,'Type:',typeof id);

  // Use == instead of === to handle string/number type differences
  var s=STAFF.find(function(x){return x.id==id;});

  if(!s){
    console.error('Staff not found. ID:',id,'Type:',typeof id,'STAFF:',STAFF);
    toast('User not found. Please refresh the page.','e');
    return;
  }

  console.log('Found staff:',s.name,'Tasks in range from',S.taskFromDate,'to',S.taskToDate);

  // Filter tasks by staff and date range
  var allTasks=TASKS.filter(function(t){
    return t.staffId==s.id&&t.date>=S.taskFromDate&&t.date<=S.taskToDate;
  });

  console.log('Filtered tasks:',allTasks.length);

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
            (AUTH_USER.isAdmin?'<button onclick="deleteTask('+t.id+',\''+esc(s.name)+'\')" style="padding:6px 8px;background:#ef4444;color:white;border:none;border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;flex-shrink:0;height:28px" onmouseover="this.style.background=\'#dc2626\'" onmouseout="this.style.background=\'#ef4444\'" title="Delete Task">'+
              '<svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>'+
              '</svg>'+
            '</button>':'')+
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
  '</div>');

  el('m-x').onclick=closeOv;
}

function openRemarksEditor(taskId){
  console.log('Opening remarks editor for task:',taskId);

  var task=TASKS.find(function(t){return t.id==taskId;});
  if(!task){
    console.error('Task not found:',taskId);
    toast('Task not found','e');
    return;
  }

  var remarksText=task.remarks||'';
  var taskDesc=task.desc.length>50?task.desc.slice(0,50)+'...':task.desc;

  showOv('<div class="modal" onclick="event.stopPropagation()" style="max-width:500px">'+
    '<div class="m-head">'+
      '<div style="flex:1">'+
        '<div style="font-size:16px;font-weight:700;color:var(--t1)">Edit Remarks</div>'+
        '<div style="font-size:12px;color:var(--t3);margin-top:2px">'+esc(taskDesc)+'</div>'+
      '</div>'+
      '<button class="btn btn-out btn-sm" id="rem-x" style="padding:4px 8px">&#10005;</button>'+
    '</div>'+
    '<div class="m-body">'+
      '<div style="margin-bottom:8px">'+
        '<label style="display:block;font-size:13px;color:var(--t2);font-weight:600;margin-bottom:6px">Admin Remarks</label>'+
        '<textarea id="rem-textarea" placeholder="Add remarks for this task..." style="width:100%;min-height:120px;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;color:var(--text);background:var(--bg2);resize:vertical;font-family:inherit;line-height:1.5">'+esc(remarksText)+'</textarea>'+
      '</div>'+
    '</div>'+
    '<div class="m-foot">'+
      '<button class="btn btn-out btn-sm" id="rem-cancel">Cancel</button>'+
      '<button class="btn btn-pri btn-sm" id="rem-save">'+
        '<svg style="width:14px;height:14px;margin-right:4px" fill="none" stroke="currentColor" viewBox="0 0 24 24">'+
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'+
        '</svg>'+
        'Save Remarks'+
      '</button>'+
    '</div>'+
  '</div>');

  el('rem-x').onclick=closeOv;
  el('rem-cancel').onclick=closeOv;
  el('rem-save').onclick=function(){
    var newRemarks=el('rem-textarea').value.trim();
    task.remarks=newRemarks;
    console.log('Saved remarks for task',taskId,':',newRemarks);
    toast('Remarks saved successfully','s');
    schedSave();
    closeOv();
    renderContent();
  };

  // Focus textarea
  setTimeout(function(){
    var textarea=el('rem-textarea');
    if(textarea){
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length,textarea.value.length);
    }
  },100);
}

function openAssignTask(id){
  // Only allow task assignment when a specific user ID is provided
  if(!id || id===null || id==='null'){
    toast('Please select a user first','w');
    return;
  }

  var active=activeStaff();
  // Code for when specific user ID is provided
  // Use == instead of === to handle string/number type differences
  var s=STAFF.find(function(x){return x.id==id;});
  if(!s){
    console.error('User not found in STAFF array. ID:',id,'Type:',typeof id,'STAFF:',STAFF);
    toast('User not found. Please refresh the page.','e');
    return;
  }
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
        '<div class="ml" style="margin-bottom:8px">Add New Tasks (Max 5 per day)</div>'+
        [1,2,3,4,5].map(function(i){
          return '<div style="background:'+(i===1?'var(--bg2)':'transparent')+';border:1.5px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px">'+
            '<div style="font-size:11px;font-weight:600;color:var(--t3);margin-bottom:6px">Task '+i+'</div>'+
            '<textarea class="mi" id="at-desc-'+i+'" placeholder="Enter task description..." style="resize:none;min-height:60px;margin-bottom:8px;line-height:1.5"></textarea>'+
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
              '<div><div class="ml" style="font-size:10px">Date</div><input type="date" class="mi" id="at-date-'+i+'" value="'+_today+'" style="font-size:12px;padding:6px 8px"></div>'+
              '<div><div class="ml" style="font-size:10px">Priority</div><select class="msel" id="at-pri-'+i+'" style="font-size:12px;padding:6px 8px">'+
                '<option value="High">High</option>'+
                '<option value="Medium" selected>Medium</option>'+
                '<option value="Low">Low</option>'+
              '</select></div>'+
            '</div>'+
          '</div>';
        }).join('')+
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
    try{
      var tasksAdded=0;
      var tasksByDate={};

      // Loop through all 5 task inputs
      for(var i=1;i<=5;i++){
        var desc=(el('at-desc-'+i)||{}).value||'';
        if(!desc.trim())continue; // Skip empty tasks

        var date=(el('at-date-'+i)||{}).value||S.selDate;
        var pri=(el('at-pri-'+i)||{}).value||'Medium';

        // Track tasks per date to calculate correct task numbers
        if(!tasksByDate[date]){
          tasksByDate[date]=tasksFor(s.id,date).length;
        }
        tasksByDate[date]++;

        var newTask={
          id:++TID,
          staffId:s.id,
          date:date,
          n:tasksByDate[date],
          desc:desc.trim(),
          status:'Pending',
          action:'',
          remarks:'',
          staffRem:'',
          adminRem:'',
          priority:pri
        };

        console.log('Adding task:',newTask);
        TASKS.push(newTask);
        tasksAdded++;
      }

      if(tasksAdded===0){toast('Please enter at least one task description','w');return;}

      console.log('Total tasks added:',tasksAdded,'Total TASKS:',TASKS.length);
      toast(tasksAdded+' task'+(tasksAdded>1?'s':'')+' assigned to '+esc(s.name),'s');
      addFeed(tasksAdded+' task'+(tasksAdded>1?'s':'')+' assigned to '+s.name,'blue');
      schedSave();
      closeOv();
      render();
    }catch(e){
      console.error('Error adding tasks:',e);
      toast('Failed to add tasks. Please try again.','e');
    }
  };
}


// ── RENDER ───────────────────────────────────────────────────────
function renderContent(){
  if(AUTH_USER.isAdmin){
    if(S.view==='tasks')rTaskManagementPage();
    else if(S.view==='users')rUserManagement();
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

  console.log('Saving tasks to database. Total tasks:',TASKS.length);
  console.log('First task sample:',TASKS[0]);

  // Save tasks data to database
  fetch('/api/tasks/save',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json','X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]')?.content||''},
    body:JSON.stringify({tasks:TASKS})
  }).then(function(r){
    console.log('Save response status:',r.status);
    return r.json();
  }).then(function(data){
    console.log('Save response data:',data);
    if(!data.success){
      console.error('Tasks save failed:',data.message,data);
      toast('Failed to save tasks: '+(data.message||'Unknown error'),'e');
    }else{
      console.log('Tasks saved successfully');
      // Reload tasks from database to sync IDs
      reloadTasksFromDB();
    }
    _isSaving=false;
    if(ind){clearTimeout(ind._t);ind._t=setTimeout(function(){ind.style.opacity='0';},1800);}
  }).catch(function(e){
    console.error('Tasks save error:',e);
    toast('Error saving tasks. Please try again.','e');
    _isSaving=false;
    if(ind)ind.style.opacity='0';
  });

  // localStorage backup removed - all data now stored in database
}

function schedSave(){clearTimeout(_saveTimer);_saveTimer=setTimeout(autoSave,800);}

function reloadTasksFromDB(){
  console.log('Reloading tasks from database...');
  fetch('/api/tasks',{
    method:'GET',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'}
  }).then(function(r){
    if(!r.ok){
      console.warn('Tasks reload returned status:',r.status);
      return null;
    }
    return r.json();
  }).then(function(response){
    if(response&&response.success&&response.data){
      TASKS.length=0;
      response.data.forEach(function(t){TASKS.push(t);});

      // Update TID to be max task ID + 1
      var maxId=Math.max.apply(null,TASKS.map(function(t){return t.id||0;}));
      if(maxId>TID){
        TID=maxId;
      }

      console.log('Tasks reloaded. Total:',TASKS.length,'Max ID:',maxId);
      render();
    }
  }).catch(function(e){
    console.error('Tasks reload error:',e);
  });
}

function restoreData(){
  var restored=false;

  // Ensure current user is always in STAFF array as fallback
  if(AUTH_USER&&AUTH_USER.id){
    var currentUserExists=STAFF.find(function(s){return s.id===AUTH_USER.id;});
    if(!currentUserExists){
      STAFF.push({
        id:AUTH_USER.id,
        name:AUTH_USER.name,
        email:AUTH_USER.email,
        role:AUTH_USER.role||'User',
        department:'',
        inst:'',
        active:true
      });
    }
  }

  // Load users from User Management API
  fetch('/admin/users',{
    method:'GET',
    credentials:'same-origin',
    headers:{
      'Content-Type':'application/json',
      'X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]')?.content||''
    }
  }).then(function(r){
    if(!r.ok){
      console.warn('User API returned status:',r.status);
      return null;
    }
    // Try to parse as JSON regardless of content-type header
    return r.json().catch(function(){
      console.warn('User API response could not be parsed as JSON');
      return null;
    });
  }).then(function(response){
    if(response&&response.success&&response.users&&response.users.length){
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

  // Load tasks data from database
  fetch('/api/tasks',{
    method:'GET',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'}
  }).then(function(r){
    if(!r.ok){
      console.warn('Tasks API returned status:',r.status);
      return null;
    }
    // Try to parse as JSON regardless of content-type header
    return r.json().catch(function(){
      console.warn('Tasks API response could not be parsed as JSON');
      return null;
    });
  }).then(function(response){
    if(response&&response.success&&response.data&&response.data.length){
      TASKS.length=0;
      response.data.forEach(function(t){TASKS.push(t);});

      // Update TID to be max task ID + 1 to avoid conflicts
      var maxId=Math.max.apply(null,TASKS.map(function(t){return t.id||0;}));
      if(maxId>TID){
        TID=maxId;
      }

      restored=true;
      render();
    }
  }).catch(function(e){console.error('Tasks load error:',e);});

  return restored;
}

// Patch functions that mutate data to trigger auto-save
// Auto-save is triggered inline at each mutation point via schedSave()

// ── EXPORT REPORT ─────────────────────────────────────────────────
function exportReport(fmt){
  var fromDate=S.overviewFromDate;
  var toDate=S.overviewToDate;
  var dateRangeText=(fromDate===toDate)?fromDate:(fromDate+' to '+toDate);
  var active=activeStaff();

  if(fmt==='xlsx'){
    // Build CSV (Excel-compatible) for date range
    var csvRows=['Staff ID,Name,Designation,Department,Date,Task No,Task Description,Status,Action,Remarks'];
    active.forEach(function(s){
      // Filter tasks within date range
      var ts=TASKS.filter(function(t){return t.staffId===s.id && t.date>=fromDate && t.date<=toDate;});
      if(ts.length===0){
        csvRows.push([s.id,s.name,s.role,s.inst,dateRangeText,'','','','',''].join(','));
      } else {
        ts.forEach(function(t){
          function q(v){return '"'+(String(v||'').replace(/"/g,'""'))+'"';}
          csvRows.push([q(s.id),q(s.name),q(s.role),q(s.inst),q(t.date),t.n,q(t.desc),q(t.status),q(t.action||'Pending'),q(t.remarks)].join(','));
        });
      }
    });
    var blob2=new Blob([csvRows.join('\n')],{type:'text/csv;charset=utf-8'});
    var a2=document.createElement('a');a2.href=URL.createObjectURL(blob2);
    a2.download='WorkMonitor_Report_'+fromDate+'_to_'+toDate+'.csv';a2.click();
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
  // action buttons (removed dropdown toggle - now using always-visible buttons)
  var dpAct=e.target.closest('[data-act][data-tid]');if(dpAct){
    var act=dpAct.dataset.act;var tid=parseInt(dpAct.dataset.tid);
    var t=TASKS.find(function(x){return x.id===tid;});if(!t)return;
    var s=STAFF.find(function(x){return x.id===t.staffId;});
    var staffName=s?s.name:'Staff';
    if(act==='ap'){
      t.action='Approved';
      toast(staffName+' Task '+t.n+' Approved','s');
      addFeed(staffName.split(' ')[0]+' Task '+t.n+' Approved','green');
      S.boardDp=null;
      // Clear filter to show the approved task
      if(S.boardFilter==='pending'){S.boardFilter='all';}
      renderContent();
      autoSave();
    }
    else if(act==='rj'){
      t.action='Rejected';
      toast(staffName+' Task '+t.n+' Rejected','e');
      addFeed(staffName.split(' ')[0]+' Task '+t.n+' Rejected','red');
      S.boardDp=null;
      // Clear filter to show the rejected task
      if(S.boardFilter==='pending'){S.boardFilter='all';}
      renderContent();
      autoSave();
    }
    else if(act==='cl'){t.action='';S.boardDp=null;renderContent();toast('Cleared','i');autoSave();}
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
    credentials: 'same-origin',
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
  var bulkUploadSection = document.getElementById('bulkUploadSection');
  var userProfileDisplay = document.getElementById('userProfileDisplay');

  if (AUTH_USER.isAdmin) {
    // Admin view - show form and management title
    if (form) form.style.display = 'block';
    if (bulkUploadSection) bulkUploadSection.style.display = 'block';
    if (userProfileDisplay) userProfileDisplay.style.display = 'none';
    if (title) title.textContent = 'User Management';
    if (subtitle) subtitle.textContent = 'Add new user to the system';
    // Reset to add mode
    resetUserForm();
  } else {
    // Non-admin view - hide form, show profile title and profile display
    if (form) form.style.display = 'none';
    if (bulkUploadSection) bulkUploadSection.style.display = 'none';
    if (userProfileDisplay) userProfileDisplay.style.display = 'block';
    if (title) title.textContent = 'My Profile';
    if (subtitle) subtitle.textContent = 'View and edit your profile information';
  }

  // Show modal
  var modal = document.getElementById('userManagementModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeUserManagementModal() {
  var modal = document.getElementById('userManagementModal');
  if (modal) {
    modal.style.display = 'none';
    // Reset form
    resetUserForm();
    // Reset to profile view for non-admin users
    if (!AUTH_USER.isAdmin) {
      var form = document.getElementById('addUserForm');
      var userProfileDisplay = document.getElementById('userProfileDisplay');
      if (form) form.style.display = 'none';
      if (userProfileDisplay) userProfileDisplay.style.display = 'block';
    }
  }
}

function editMyProfile() {
  // Hide profile display and show form
  var form = document.getElementById('addUserForm');
  var userProfileDisplay = document.getElementById('userProfileDisplay');
  var title = document.getElementById('userMgmtTitle');
  var subtitle = document.getElementById('userMgmtSubtitle');

  if (userProfileDisplay) userProfileDisplay.style.display = 'none';
  if (form) form.style.display = 'block';
  if (title) title.textContent = 'Edit Profile';
  if (subtitle) subtitle.textContent = 'Update your profile information';

  // Pre-fill form with current user data
  document.getElementById('editUserId').value = AUTH_USER.id;
  document.getElementById('userName').value = AUTH_USER.name;
  document.getElementById('userEmail').value = AUTH_USER.email;
  document.getElementById('userDepartment').value = AUTH_USER.department || '';
  document.getElementById('userPassword').value = '';
  document.getElementById('userPassword').required = false;
  document.getElementById('passwordOptional').style.display = 'inline';
  document.getElementById('submitUserBtnText').textContent = 'Update Profile';

  // Handle role - for regular users, role might not be editable
  var roleSelect = document.getElementById('userRole');
  var predefinedRoles = ['Developer', 'Designer', 'Manager', 'Analyst', 'Tester', 'Engineer', 'Architect', 'Administrator'];

  if (predefinedRoles.indexOf(AUTH_USER.role) !== -1) {
    roleSelect.value = AUTH_USER.role;
  } else {
    // Custom role
    roleSelect.value = 'Other';
    document.getElementById('userRoleCustom').value = AUTH_USER.role;
    document.getElementById('userRoleCustomWrapper').style.display = 'block';
  }

  // Disable role field for non-admin users (they can't change their own role)
  if (roleSelect) roleSelect.disabled = true;
}

function resetUserForm() {
  var form = document.getElementById('addUserForm');
  if (form) form.reset();

  // Reset to add mode
  document.getElementById('editUserId').value = '';
  document.getElementById('submitUserBtnText').textContent = 'Add User';
  document.getElementById('userPassword').required = true;
  document.getElementById('passwordOptional').style.display = 'none';

  // Re-enable role field (in case it was disabled for non-admin edit)
  var roleSelect = document.getElementById('userRole');
  if (roleSelect) roleSelect.disabled = false;

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
    credentials: 'same-origin',
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
    credentials: 'same-origin',
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
  // First, open the modal
  openUserManagementModal();

  // Get CSRF token
  var csrfToken = document.querySelector('meta[name="csrf-token"]');
  var token = csrfToken ? csrfToken.getAttribute('content') : '';

  // Fetch user data
  fetch('/admin/users', {
    method: 'GET',
    credentials: 'same-origin',
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
        // Wait a bit for modal to be fully rendered
        setTimeout(function() {
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
          var mdBody = document.querySelector('.md-body');
          if (mdBody) mdBody.scrollTop = 0;
        }, 100);
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
    credentials: 'same-origin',
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

// Bulk Upload Functions
function downloadUserTemplate() {
  // Download template from backend
  window.location.href = '/admin/users/template/download';
  toast('Downloading template...', 's');
}

function handleBulkUpload(event) {
  var file = event.target.files[0];
  if (!file) return;

  // Validate file type
  var fileExtension = file.name.split('.').pop().toLowerCase();
  if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
    toast('Please upload a valid Excel file (.xlsx or .xls)', 'e');
    event.target.value = '';
    return;
  }

  // Show progress indicator
  var progress = document.getElementById('bulkUploadProgress');
  if (progress) progress.style.display = 'block';

  // Create FormData to send file
  var formData = new FormData();
  formData.append('excel_file', file);

  // Get CSRF token
  var csrfToken = document.querySelector('meta[name="csrf-token"]');
  var token = csrfToken ? csrfToken.getAttribute('content') : '';

  // Send file to backend for server-side processing
  fetch('/admin/users/import-excel', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'X-CSRF-TOKEN': token,
      'Accept': 'application/json'
    },
    body: formData
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(result) {
    if (progress) progress.style.display = 'none';

    if (result.success) {
      var message = 'Successfully imported ' + result.count + ' user(s)!';

      if (result.skipped && result.skipped.length > 0) {
        message += ' (Skipped ' + result.skipped.length + ' duplicate email(s))';
      }

      if (result.invalid_rows && result.invalid_rows.length > 0) {
        message += ' (Found ' + result.invalid_rows.length + ' invalid row(s))';
      }

      toast(message, 's');

      // Reset file input
      event.target.value = '';

      // Reload users list
      loadUsers();

      // Refresh main view if needed
      if (typeof renderContent === 'function' && S.view === 'tasks') {
        setTimeout(renderContent, 300);
      }
    } else {
      toast(result.message || 'Failed to import users', 'e');
      event.target.value = '';
    }
  })
  .catch(function(error) {
    console.error('Error:', error);
    if (progress) progress.style.display = 'none';
    toast('An error occurred during import. Please try again.', 'e');
    event.target.value = '';
  });
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
  var profileModal = document.getElementById('profileModal');
  var userModal = document.getElementById('userManagementModal');

  if (e.target === profileModal) closeProfileModal();
  if (e.target === userModal) closeUserManagementModal();
});
