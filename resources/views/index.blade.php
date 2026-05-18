<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>Work Monitor</title>
<link rel="icon" type="image/png" href="{{ asset('storage/images/logo.png') }}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('css/workmonitor.css') }}?v={{ time() }}">
</head>
<body>
<div class="shell">
  <aside id="lp"></aside>
  <div class="rpane">
    <header class="topbar" id="tb"></header>
    <div class="consol-bar" id="cbar"></div>
    <div class="tab-bar" id="tbar" style="display:none"></div>
    <div class="content" id="ct"></div>
  </div>
</div>
<div class="tw" id="tw"></div>

<!-- User Profile Dropdown Menu -->
<div class="user-dropdown" id="userDropdown">
  <div class="dropdown-header">
    <div class="dropdown-user">
      <div class="ava ava-lg" style="background:var(--grad);color:#fff;border:2px solid var(--white)"></div>
      <div class="dropdown-user-info">
        <div class="dropdown-name"></div>
        <div class="dropdown-email"></div>
        <span class="dropdown-role-badge">ADMINISTRATOR</span>
      </div>
    </div>
  </div>
  <div class="dropdown-menu">
    <button class="dropdown-item" onclick="openProfileModal()">
      <svg style="width:18px;height:18px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>
      <span class="dropdown-item-text">My Profile</span>
    </button>
    <button class="dropdown-item" onclick="openUserManagementModal()">
      <svg style="width:18px;height:18px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
      </svg>
      <span class="dropdown-item-text">User Management</span>
    </button>
    <div class="dropdown-divider"></div>
    <form method="POST" action="{{ route('admin.logout') }}" style="margin:0;padding:0">
      @csrf
      <button type="submit" class="dropdown-item logout">
        <svg style="width:18px;height:18px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
        </svg>
        <span class="dropdown-item-text">Logout</span>
      </button>
    </form>
  </div>
</div>

<!-- Profile Modal -->
<div class="ov" id="profileModal" style="display:none">
  <div class="md" style="max-width:500px;width:100%">
    <div class="md-hdr">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="ava ava-lg" style="background:var(--grad);color:#fff"></div>
        <div>
          <div style="font-size:18px;font-weight:600;color:var(--t1)">{{ Auth::user()->name ?? "Admin" }}</div>
          <div style="font-size:12px;color:var(--t3)">{{ Auth::user()->email }}</div>
        </div>
      </div>
      <button class="md-close" onclick="closeProfileModal()">&times;</button>
    </div>
    <div class="md-body">
      <div style="display:grid;gap:20px">
        <div>
          <div style="font-size:12px;color:var(--t3);font-weight:600;margin-bottom:6px">Full Name</div>
          <div id="profile-name" style="font-size:15px;color:var(--t1);font-weight:500">{{ Auth::user()->name ?? "Admin" }}</div>
        </div>
        <div>
          <div style="font-size:12px;color:var(--t3);font-weight:600;margin-bottom:6px">Email Address</div>
          <div id="profile-email" style="font-size:15px;color:var(--t1);font-weight:500">{{ Auth::user()->email }}</div>
        </div>
        <div>
          <div style="font-size:12px;color:var(--t3);font-weight:600;margin-bottom:6px">Role</div>
          <div id="profile-role" style="font-size:15px;color:var(--t1);font-weight:500;text-transform:uppercase">{{ Auth::user()->role ?? "admin" }}</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- User Management Modal -->
<div class="ov" id="userManagementModal" style="display:none">
  <div class="md" style="max-width:700px;width:100%;background:#ffffff;border-radius:12px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04);overflow:hidden;position:relative">
    <div class="md-hdr" style="background:#ffffff;border-bottom:1px solid #e5e7eb;padding:20px 24px;position:relative">
      <div style="display:flex;align-items:center;gap:12px;padding-right:40px">
        <svg style="width:24px;height:24px;color:#3b82f6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
        <div>
          <div id="userMgmtTitle" style="font-size:18px;font-weight:600;color:#1f2937">User Management</div>
          <div id="userMgmtSubtitle" style="font-size:12px;color:#6b7280">Add new user to the system</div>
        </div>
      </div>
      <button onclick="closeUserManagementModal()" style="position:absolute;top:50%;right:24px;transform:translateY(-50%);background:#f3f4f6;border:none;width:32px;height:32px;border-radius:6px;color:#6b7280;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;transition:all 0.2s" onmouseover="this.style.background='#e5e7eb';this.style.color='#374151'" onmouseout="this.style.background='#f3f4f6';this.style.color='#6b7280'">&times;</button>
    </div>
    <div class="md-body" style="background:#ffffff;padding:24px;max-height:70vh;overflow-y:auto">
      <form id="addUserForm" onsubmit="handleSaveUser(event)" style="display:none">
        <input type="hidden" id="editUserId" name="userId">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <div>
            <label style="display:block;font-size:13px;color:#374151;font-weight:600;margin-bottom:6px">Full Name</label>
            <input type="text" id="userName" name="name" required placeholder="Enter full name" style="width:100%;padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;color:#1f2937;background:#f9fafb;outline:none">
          </div>
          <div>
            <label style="display:block;font-size:13px;color:#374151;font-weight:600;margin-bottom:6px">Email Address</label>
            <input type="email" id="userEmail" name="email" required placeholder="user@example.com" style="width:100%;padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;color:#1f2937;background:#f9fafb;outline:none">
          </div>
          <div>
            <label style="display:block;font-size:13px;color:#374151;font-weight:600;margin-bottom:6px">Role / Designation</label>
            <select id="userRole" name="role" required style="width:100%;padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;color:#1f2937;background:#f9fafb;outline:none;cursor:pointer" onchange="toggleRoleCustomInput()">
              <option value="">Select Role</option>
              <option value="Developer">Developer</option>
              <option value="Designer">Designer</option>
              <option value="Manager">Manager</option>
              <option value="Analyst">Analyst</option>
              <option value="Tester">Tester</option>
              <option value="Engineer">Engineer</option>
              <option value="Architect">Architect</option>
              <option value="Administrator">Administrator</option>
              <option value="Other">Other (type manually)</option>
            </select>
            <div id="userRoleCustomWrapper" style="display:none;margin-top:6px">
              <input type="text" id="userRoleCustom" placeholder="Type your role" style="width:100%;padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;color:#1f2937;background:#f9fafb;outline:none">
            </div>
          </div>
          <div>
            <label style="display:block;font-size:13px;color:#374151;font-weight:600;margin-bottom:6px">Department</label>
            <select id="userDepartment" name="department" required style="width:100%;padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;color:#1f2937;background:#f9fafb;outline:none;cursor:pointer">
              <option value="">Select Department</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Support">Support</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style="grid-column:1/-1">
            <label style="display:block;font-size:13px;color:#374151;font-weight:600;margin-bottom:6px">
              Password <span id="passwordOptional" style="color:#6b7280;font-weight:400">(Leave empty to keep current)</span>
            </label>
            <input type="password" id="userPassword" name="password" placeholder="Minimum 8 characters" minlength="8" style="width:100%;padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;color:#1f2937;background:#f9fafb;outline:none">
          </div>
        </div>
        <button type="submit" id="submitUserBtn" class="btn" style="background:#14b8a6;color:white;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 20px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='#0d9488'" onmouseout="this.style.background='#14b8a6'">
          <svg style="width:16px;height:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span id="submitUserBtnText">Add User</span>
        </button>
      </form>

      <!-- Users List -->
      <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:20px">
        <div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:12px">Existing Users</div>
        <div id="usersList" style="display:grid;gap:10px">
          <!-- Users will be loaded here dynamically -->
          <div style="text-align:center;padding:20px;color:#6b7280;font-size:13px">Loading users...</div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
// Laravel Auth User Data - defined inline to access Blade variables
var AUTH_USER = {
  id: '{{ Auth::user()->id }}',
  name: '{{ Auth::user()->name ?? "Admin" }}',
  email: '{{ Auth::user()->email }}',
  role: '{{ Auth::user()->role ?? "admin" }}',
  initials: '{{ strtoupper(substr(Auth::user()->name ?? Auth::user()->email, 0, 2)) }}',
  isAdmin: {{ in_array(strtolower(Auth::user()->role ?? 'admin'), ['admin', 'administrator']) ? 'true' : 'false' }}
};
</script>
<script src="{{ asset('js/workmonitor.js') }}?v={{ time() }}"></script>
@if(session('login_success'))
<script>
// Show login success toast
setTimeout(function() {
  toast('{{ session('login_success') }}', 's');
}, 500);
</script>
@endif
</body>
</html>
