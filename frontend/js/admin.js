// Admin Dashboard JavaScript
const API_BASE = 'http://localhost:5000/api';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Check if user is admin
async function checkAdminAccess() {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const user = await res.json();
    
    if (user.user_type !== 'admin') {
      alert('Access denied. Admin privileges required.');
      window.location.href = 'index.html';
      return false;
    }
    return true;
  } catch (err) {
    console.error('Auth check failed:', err);
    window.location.href = 'login.html';
    return false;
  }
}

// Fetch helper with auth
async function fetchAPI(endpoint, options = {}) {
  const token = getToken();
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  };
  
  const res = await fetch(`${API_BASE}${endpoint}`, config);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'API request failed');
  }
  return res.json();
}

// ============================================
// STATISTICS SECTION
// ============================================
async function loadStatistics() {
  try {
    const stats = await fetchAPI('/admin/stats');
    
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card');
    
    // Total Resources
    statCards[0].querySelector('.stat-number').textContent = stats.totalResources || 0;
    
    // Active Bookings
    statCards[1].querySelector('.stat-number').textContent = stats.activeBookings || 0;
    
    // Pending
    statCards[2].querySelector('.stat-number').textContent = stats.pendingBookings || 0;
    
    // Total Users
    statCards[3].querySelector('.stat-number').textContent = stats.totalUsers || 0;
    
  } catch (err) {
    console.error('Failed to load statistics:', err);
  }
}

// ============================================
// RESOURCES SECTION
// ============================================
async function loadResources() {
  try {
    const resources = await fetchAPI('/resources');
    renderResourceCards(resources);
  } catch (err) {
    console.error('Failed to load resources:', err);
  }
}

function renderResourceCards(resources) {
  const grid = document.querySelector('.resource-grid');
  if (!grid) return;
  
  grid.innerHTML = resources.map(r => {
    const statusClass = getStatusClass(r.status);
    const statusIcon = getStatusIcon(r.status);
    const categoryIcon = getCategoryIcon(r.category);
    const imageStyle = getImageStyle(r.status);
    
    return `
      <div class="resource-card" data-id="${r.resource_id}">
        <div class="resource-image" ${imageStyle}>${categoryIcon}</div>
        <div class="resource-content">
          <h3>${escapeHtml(r.name)}</h3>
          <div class="resource-info">
            <span>📍 ${escapeHtml(r.location)}</span>
            <span>👥 Capacity: ${r.capacity} people</span>
            <span>⏰ ${formatAvailability(r.availability)}</span>
          </div>
          <span class="resource-status ${statusClass}">${statusIcon} ${capitalizeFirst(r.status)}</span>
          <div class="resource-actions">
            <button class="btn-small btn-edit" onclick="editResource(${r.resource_id})">✏️ Edit</button>
            ${r.status === 'available' 
              ? `<button class="btn-small btn-block" onclick="updateResourceStatus(${r.resource_id}, 'blocked')">🚫 Block</button>`
              : `<button class="btn-small btn-unblock" onclick="updateResourceStatus(${r.resource_id}, 'available')">✓ Unblock</button>`
            }
            <button class="btn-small btn-delete" onclick="deleteResource(${r.resource_id})">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getStatusClass(status) {
  const classes = {
    'available': 'status-available',
    'blocked': 'status-blocked',
    'maintenance': 'status-maintenance'
  };
  return classes[status] || 'status-available';
}

function getStatusIcon(status) {
  const icons = {
    'available': '✓',
    'blocked': '🚫',
    'maintenance': '🔧'
  };
  return icons[status] || '✓';
}

function getCategoryIcon(category) {
  const icons = {
    'study-room': '📚',
    'lab': '💻',
    'meeting-room': '🏢',
    'equipment': '🔧'
  };
  return icons[category] || '📚';
}

function getImageStyle(status) {
  if (status === 'blocked') {
    return 'style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%);"';
  }
  if (status === 'maintenance') {
    return 'style="background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%);"';
  }
  return '';
}

function formatAvailability(availability) {
  if (!availability || !Array.isArray(availability) || availability.length === 0) {
    return 'Schedule not set';
  }
  
  // Filter out null entries
  const validAvail = availability.filter(a => a && a.day_of_week !== null);
  if (validAvail.length === 0) return 'Schedule not set';
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstAvail = validAvail[0];
  
  // Format time
  const openTime = formatTime(firstAvail.open_time);
  const closeTime = formatTime(firstAvail.close_time);
  
  // Get day range
  const dayNums = validAvail.map(a => a.day_of_week).sort();
  let dayStr = '';
  
  if (dayNums.length === 7) {
    dayStr = 'Mon-Sun';
  } else if (dayNums.length === 5 && dayNums.includes(1) && dayNums.includes(5)) {
    dayStr = 'Mon-Fri';
  } else {
    dayStr = dayNums.map(d => days[d]).join(', ');
  }
  
  return `${dayStr}: ${openTime} - ${closeTime}`;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, mins] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${mins} ${ampm}`;
}

// Update resource status
async function updateResourceStatus(id, status) {
  try {
    await fetchAPI(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    loadResources();
    loadStatistics();
  } catch (err) {
    alert('Failed to update resource: ' + err.message);
  }
}

// Delete resource
async function deleteResource(id) {
  if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
    return;
  }
  
  try {
    await fetchAPI(`/resources/${id}`, { method: 'DELETE' });
    loadResources();
    loadStatistics();
  } catch (err) {
    alert('Failed to delete resource: ' + err.message);
  }
}

// Edit resource - populate form
async function editResource(id) {
  try {
    const resource = await fetchAPI(`/resources/${id}`);
    
    // Show form
    const form = document.getElementById('resourceForm');
    form.classList.add('active');
    form.style.display = 'block';
    
    // Update form title
    form.querySelector('h3').textContent = 'Edit Resource';
    
    // Populate fields
    document.getElementById('resourceName').value = resource.name;
    document.getElementById('category').value = resource.category;
    document.getElementById('location').value = resource.location;
    document.getElementById('capacity').value = resource.capacity;
    document.getElementById('description').value = resource.description || '';
    
    // Set availability checkboxes
    if (resource.availability && resource.availability.length > 0) {
      const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
      checkboxes.forEach((cb, index) => {
        const dayNum = index === 6 ? 0 : index + 1; // Convert to day number
        cb.checked = resource.availability.some(a => a.day_of_week === dayNum);
      });
      
      // Set times from first availability
      const firstAvail = resource.availability[0];
      if (firstAvail) {
        document.getElementById('openTime').value = firstAvail.open_time?.slice(0, 5) || '08:00';
        document.getElementById('closeTime').value = firstAvail.close_time?.slice(0, 5) || '22:00';
      }
    }
    
    // Store resource ID for update
    form.dataset.editId = id;
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert('Failed to load resource: ' + err.message);
  }
}

// Toggle form visibility
function toggleForm() {
  const form = document.getElementById('resourceForm');
  form.classList.toggle('active');
  
  if (form.classList.contains('active')) {
    form.style.display = 'block';
    // Reset form for new resource
    form.querySelector('h3').textContent = 'Add New Resource';
    form.querySelector('form').reset();
    delete form.dataset.editId;
  } else {
    form.style.display = 'none';
  }
}

// Handle form submission
async function handleResourceSubmit(e) {
  e.preventDefault();
  
  const form = document.getElementById('resourceForm');
  const isEdit = form.dataset.editId;
  
  // Get form data
  const name = document.getElementById('resourceName').value;
  const category = document.getElementById('category').value;
  const location = document.getElementById('location').value;
  const capacity = parseInt(document.getElementById('capacity').value);
  const description = document.getElementById('description').value;
  const openTime = document.getElementById('openTime').value;
  const closeTime = document.getElementById('closeTime').value;
  
  // Get selected days
  const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
  const availability = [];
  
  checkboxes.forEach((cb, index) => {
    if (cb.checked) {
      // Convert checkbox index to day_of_week (0=Sunday, 1=Monday, etc.)
      const dayNum = index === 6 ? 0 : index + 1;
      availability.push({
        day_of_week: dayNum,
        open_time: openTime,
        close_time: closeTime
      });
    }
  });
  
  const resourceData = {
    name,
    category,
    location,
    capacity,
    description,
    availability
  };
  
  try {
    if (isEdit) {
      await fetchAPI(`/resources/${isEdit}`, {
        method: 'PUT',
        body: JSON.stringify(resourceData)
      });
    } else {
      await fetchAPI('/resources', {
        method: 'POST',
        body: JSON.stringify(resourceData)
      });
    }
    
    toggleForm();
    loadResources();
    loadStatistics();
  } catch (err) {
    alert('Failed to save resource: ' + err.message);
  }
}

// ============================================
// PENDING APPROVALS SECTION
// ============================================
async function loadPendingBookings() {
  try {
    const bookings = await fetchAPI('/admin/pending-bookings');
    renderPendingTable(bookings);
    updatePendingCount(bookings.length);
  } catch (err) {
    console.error('Failed to load pending bookings:', err);
  }
}

function renderPendingTable(bookings) {
  const tbody = document.querySelector('.approval-table tbody');
  if (!tbody) return;
  
  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 30px; color: #666;">
          No pending bookings
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = bookings.map(b => `
    <tr data-id="${b.booking_id}">
      <td>
        <strong>${escapeHtml(b.first_name)} ${escapeHtml(b.last_name)}</strong><br>
        <small>${capitalizeFirst(b.user_type)}</small>
      </td>
      <td>${escapeHtml(b.resource_name)}</td>
      <td>${formatDate(b.booking_date)}</td>
      <td>${formatTime(b.start_time)} - ${formatTime(b.end_time)}</td>
      <td><span class="resource-status status-maintenance">Pending</span></td>
      <td>
        <button class="btn-small btn-unblock" onclick="approveBooking(${b.booking_id})">✓ Approve</button>
        <button class="btn-small btn-delete" onclick="rejectBooking(${b.booking_id})">✗ Reject</button>
      </td>
    </tr>
  `).join('');
}

function updatePendingCount(count) {
  const countSpan = document.querySelector('.calendar-container:nth-of-type(3) .date-controls span');
  if (countSpan) {
    countSpan.textContent = `${count} booking${count !== 1 ? 's' : ''} awaiting approval`;
  }
}

async function approveBooking(id) {
  try {
    await fetchAPI(`/admin/bookings/${id}/approve`, { method: 'PUT' });
    loadPendingBookings();
    loadStatistics();
  } catch (err) {
    alert('Failed to approve booking: ' + err.message);
  }
}

async function rejectBooking(id) {
  if (!confirm('Are you sure you want to reject this booking?')) return;
  
  try {
    await fetchAPI(`/admin/bookings/${id}/reject`, { method: 'PUT' });
    loadPendingBookings();
    loadStatistics();
  } catch (err) {
    alert('Failed to reject booking: ' + err.message);
  }
}

// ============================================
// UTILIZATION SECTION
// ============================================
async function loadUtilization(period = 'week') {
  try {
    const data = await fetchAPI(`/admin/utilization?period=${period}`);
    
    // Update week range display
    const weekRangeEl = document.getElementById('weekRange');
    if (weekRangeEl && data.weekRange) {
      weekRangeEl.textContent = `${data.weekRange.start_date} - ${data.weekRange.end_date}`;
    }
    
    renderPopularResources(data.resources || []);
    renderUtilizationBars(data.resources || []);
  } catch (err) {
    console.error('Failed to load utilization:', err);
  }
}

function renderPopularResources(resources) {
  const tbody = document.getElementById('popularTableBody');
  if (!tbody) return;
  
  if (!resources || resources.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 30px; color: #666;">
          No booking data available
        </td>
      </tr>
    `;
    return;
  }
  
  // Sort by booking count and take top 5
  const sorted = [...resources].sort((a, b) => b.booking_count - a.booking_count).slice(0, 5);
  
  tbody.innerHTML = sorted.map(r => {
    const pct = r.utilization_percentage || 0;
    const barClass = pct >= 75 ? 'bar-high' : pct >= 50 ? 'bar-medium' : 'bar-low';
    
    return `
      <tr>
        <td>
          <strong>${escapeHtml(r.name)}</strong><br>
          <small class="text-muted">${escapeHtml(r.location)}</small>
        </td>
        <td class="text-center">${r.booking_count} bookings</td>
        <td class="progress-cell">
          <div class="progress-track">
            <div class="progress-bar ${barClass}" style="width: ${Math.max(pct, 5)}%;">
              ${pct}%
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderUtilizationBars(resources) {
  const container = document.getElementById('utilizationList');
  if (!container) return;
  
  if (!resources || resources.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        No utilization data available
      </div>
    `;
    return;
  }
  
  // Sort by utilization
  const sorted = [...resources].sort((a, b) => (b.utilization_percentage || 0) - (a.utilization_percentage || 0));
  
  container.innerHTML = sorted.map(r => {
    const pct = r.utilization_percentage || 0;
    const barClass = pct >= 75 ? 'bar-high' : pct >= 50 ? 'bar-medium' : 'bar-low';
    const pctClass = pct >= 75 ? 'percent-high' : pct >= 50 ? 'percent-medium' : 'percent-low';
    
    return `
      <div class="utilization-item">
        <div class="utilization-header">
          <div class="utilization-label">
            <strong>${escapeHtml(r.name)}</strong>
            <span class="text-muted text-small"> - ${escapeHtml(r.location)}</span>
          </div>
          <strong class="${pctClass}">${pct}%</strong>
        </div>
        <div class="utilization-bar-track">
          <div class="utilization-bar ${barClass}" style="width: ${Math.max(pct, 2)}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Check admin access first
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) return;
  
  // Load all data
  loadStatistics();
  loadResources();
  loadPendingBookings();
  loadUtilization();
  
  // Set up form submission
  const resourceForm = document.querySelector('#resourceForm form');
  if (resourceForm) {
    resourceForm.addEventListener('submit', handleResourceSubmit);
  }
  
  // Set up Add Resource button
  const addBtn = document.querySelector('.date-controls .btn-primary');
  if (addBtn) {
    addBtn.addEventListener('click', toggleForm);
  }
  
  // Refresh data every 30 seconds
  setInterval(() => {
    loadStatistics();
    loadPendingBookings();
  }, 30000);
});