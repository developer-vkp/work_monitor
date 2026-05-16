<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Work Monitor</title>
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
  <div class="md" style="max-width:600px;width:100%">
    <div class="md-hdr">
      <div style="display:flex;align-items:center;gap:12px">
        <svg style="width:24px;height:24px;color:var(--blue)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
        <div>
          <div style="font-size:18px;font-weight:600;color:var(--t1)">User Management</div>
          <div style="font-size:12px;color:var(--t3)">Add new user to the system</div>
        </div>
      </div>
      <button class="md-close" onclick="closeUserManagementModal()">&times;</button>
    </div>
    <div class="md-body">
      <form id="addUserForm" onsubmit="handleAddUser(event)">
        <div style="display:grid;gap:18px">
          <div>
            <label style="display:block;font-size:13px;color:var(--t2);font-weight:600;margin-bottom:6px">Full Name</label>
            <input type="text" name="name" required placeholder="Enter full name" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;color:var(--t1);background:var(--bg2)">
          </div>
          <div>
            <label style="display:block;font-size:13px;color:var(--t2);font-weight:600;margin-bottom:6px">Email Address</label>
            <input type="email" name="email" required placeholder="user@example.com" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;color:var(--t1);background:var(--bg2)">
          </div>
          <div>
            <label style="display:block;font-size:13px;color:var(--t2);font-weight:600;margin-bottom:6px">Role</label>
            <select name="role" required style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;color:var(--t1);background:var(--bg2)">
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:13px;color:var(--t2);font-weight:600;margin-bottom:6px">Password</label>
            <input type="password" name="password" required placeholder="Minimum 8 characters" minlength="8" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;color:var(--t1);background:var(--bg2)">
          </div>
          <div>
            <label style="display:block;font-size:13px;color:var(--t2);font-weight:600;margin-bottom:6px">Confirm Password</label>
            <input type="password" name="password_confirmation" required placeholder="Re-enter password" minlength="8" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;color:var(--t1);background:var(--bg2)">
          </div>
          <div style="display:flex;gap:10px;margin-top:8px">
            <button type="submit" class="btn btn-primary" style="flex:1">
              <svg style="width:18px;height:18px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add User
            </button>
            <button type="button" onclick="closeUserManagementModal()" class="btn" style="flex:1;background:var(--bg3);color:var(--t2)">Cancel</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
// Laravel Auth User Data - defined inline to access Blade variables
var AUTH_USER = {
  name: '{{ Auth::user()->name ?? "Admin" }}',
  email: '{{ Auth::user()->email }}',
  role: '{{ Auth::user()->role ?? "admin" }}',
  initials: '{{ strtoupper(substr(Auth::user()->name ?? Auth::user()->email, 0, 2)) }}'
};
console.log('AUTH_USER initialized:', AUTH_USER);
</script>
<script src="{{ asset('js/workmonitor.js') }}?v={{ time() }}"></script>
</body>
</html>
