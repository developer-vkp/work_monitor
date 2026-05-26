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
  <div class="md" style="max-width:500px;width:100%;background:#ffffff;border-radius:12px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04);overflow:hidden;position:relative">
    <div class="md-hdr" style="background:#ffffff;border-bottom:1px solid #e5e7eb;padding:20px 24px;position:relative">
      <div style="display:flex;align-items:center;gap:12px;padding-right:40px">
        <div class="ava ava-lg" style="background:var(--grad);color:#fff">{{ strtoupper(substr(Auth::user()->name ?? Auth::user()->email, 0, 2)) }}</div>
        <div>
          <div style="font-size:18px;font-weight:600;color:#1f2937">{{ Auth::user()->name ?? "Admin" }}</div>
          <div style="font-size:12px;color:#6b7280">{{ Auth::user()->email }}</div>
        </div>
      </div>
      <button onclick="closeProfileModal()" style="position:absolute;top:50%;right:24px;transform:translateY(-50%);background:#f3f4f6;border:none;width:32px;height:32px;border-radius:6px;color:#6b7280;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;transition:all 0.2s" onmouseover="this.style.background='#e5e7eb';this.style.color='#374151'" onmouseout="this.style.background='#f3f4f6';this.style.color='#6b7280'">&times;</button>
    </div>
    <div class="md-body" style="background:#ffffff;padding:24px">
      <div style="display:grid;gap:20px">
        <div>
          <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">Full Name</div>
          <div id="profile-name" style="font-size:15px;color:#1f2937;font-weight:500">{{ Auth::user()->name ?? "Admin" }}</div>
        </div>
        <div>
          <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">Email Address</div>
          <div id="profile-email" style="font-size:15px;color:#1f2937;font-weight:500">{{ Auth::user()->email }}</div>
        </div>
        <div>
          <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">Role</div>
          <div id="profile-role" style="font-size:15px;color:#1f2937;font-weight:500;text-transform:capitalize">
            <span style="display:inline-block;background:#eff6ff;color:#1e40af;padding:4px 12px;border-radius:6px;font-size:13px;font-weight:600">{{ Auth::user()->role ?? "admin" }}</span>
          </div>
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
      <!-- Bulk Upload Section -->
      <div id="bulkUploadSection" style="display:none;background:#f9fafb;border:2px dashed #d1d5db;border-radius:10px;padding:20px;margin-bottom:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <svg style="width:20px;height:20px;color:#3b82f6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <div>
              <div style="font-size:14px;font-weight:600;color:#1f2937">Bulk Import Users</div>
              <div style="font-size:12px;color:#6b7280">Upload Excel file with user data</div>
            </div>
          </div>
          <a href="javascript:void(0)" onclick="downloadUserTemplate()" style="font-size:12px;color:#3b82f6;text-decoration:none;display:flex;align-items:center;gap:4px;font-weight:500;padding:6px 12px;background:#eff6ff;border-radius:6px;transition:background 0.2s" onmouseover="this.style.background='#dbeafe'" onmouseout="this.style.background='#eff6ff'">
            <svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Download Template
          </a>
        </div>
        <input type="file" id="bulkUserUpload" accept=".xlsx,.xls" style="display:none" onchange="handleBulkUpload(event)">
        <button onclick="document.getElementById('bulkUserUpload').click()" style="width:100%;background:#ffffff;border:1.5px solid #e5e7eb;border-radius:8px;padding:14px;font-size:13px;color:#374151;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s" onmouseover="this.style.borderColor='#3b82f6';this.style.background='#f9fafb'" onmouseout="this.style.borderColor='#e5e7eb';this.style.background='#ffffff'">
          <svg style="width:18px;height:18px;color:#3b82f6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Choose Excel File to Upload
        </button>
        <div style="margin-top:10px;padding:12px;background:#fef3c7;border-radius:6px;font-size:12px;color:#92400e">
          <strong>Required:</strong> Name, Email &nbsp;|&nbsp; <strong>Optional:</strong> Password, Role, Department &nbsp;|&nbsp; <strong>Default Password:</strong> "12345678" (if not provided)
        </div>
        <div id="bulkUploadProgress" style="display:none;margin-top:10px;padding:12px;background:#dbeafe;border-radius:6px;font-size:12px;color:#1e40af">
          Processing... Please wait.
        </div>
      </div>

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

      <!-- User Profile Display (for non-admin users) -->
      <div id="userProfileDisplay" style="display:none;margin-top:20px">
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
            <div style="width:60px;height:60px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600;border-radius:50%;flex-shrink:0">
              {{ strtoupper(substr(Auth::user()->name ?? Auth::user()->email, 0, 2)) }}
            </div>
            <div style="flex:1">
              <div style="font-size:18px;font-weight:600;color:#1f2937;margin-bottom:4px">{{ Auth::user()->name }}</div>
              <div style="font-size:13px;color:#6b7280">{{ Auth::user()->email }}</div>
            </div>
          </div>

          <div style="display:grid;gap:12px;margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;padding:10px;background:#fff;border-radius:6px">
              <span style="font-size:13px;font-weight:600;color:#6b7280">Role:</span>
              <span style="font-size:13px;color:#1f2937">{{ Auth::user()->role ?? 'User' }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:10px;background:#fff;border-radius:6px">
              <span style="font-size:13px;font-weight:600;color:#6b7280">Department:</span>
              <span style="font-size:13px;color:#1f2937">{{ Auth::user()->department ?? 'N/A' }}</span>
            </div>
          </div>

          <button onclick="editMyProfile()" class="btn" style="width:100%;background:#14b8a6;color:white;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 20px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='#0d9488'" onmouseout="this.style.background='#14b8a6'">
            <svg style="width:16px;height:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Edit Profile
          </button>
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
<!-- SheetJS library for Excel parsing -->
<script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
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
