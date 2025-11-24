// Simple date navigation and bookings loader
let currentDateObj = new Date(); // local current date

// Initialize date picker
const datePicker = document.getElementById('datePicker');

// When user selects a date from the picker
datePicker.addEventListener('change', function() {
  currentDateObj = new Date(this.value + 'T00:00:00');
  updateDateDisplay();
  loadBookingsForCurrentDate();
});

function changeDate(days) {
  currentDateObj.setDate(currentDateObj.getDate() + days);
  updateDateDisplay();
  updateDatePicker();
  loadBookingsForCurrentDate();
}

function updateDateDisplay() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = currentDateObj.toLocaleDateString(undefined, options);
}

function updateDatePicker() {
  // Update the date picker input value
  const year = currentDateObj.getFullYear();
  const month = String(currentDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(currentDateObj.getDate()).padStart(2, '0');
  datePicker.value = `${year}-${month}-${day}`;
}

// Fetch bookings from backend for current date and render into table
async function loadBookingsForCurrentDate() {
  const year = currentDateObj.getFullYear();
  const month = String(currentDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(currentDateObj.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  try {
    const resp = await fetch(`/api/bookings?date=${dateStr}`);
    if (!resp.ok) throw new Error('Failed to load bookings');
    const bookings = await resp.json();
    renderBookings(bookings);
  } catch (err) {
    console.error('Error loading bookings', err);
  }
}

// Fetch resources and build table rows dynamically
const timeSlots = ['10:00am','11:00am','12:00pm','1:00pm','2:00pm','3:00pm','4:00pm','5:00pm','6:00pm','7:00pm','8:00pm','9:00pm'];

async function loadResourcesAndRenderTable() {
  try {
    const resp = await fetch('/api/resources');
    if (!resp.ok) throw new Error('Failed to load resources');
    const resources = await resp.json();

    const tbody = document.querySelector('.availability-table tbody');
    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    // Group resources by type simple mapping
    const groups = {};
    resources.forEach(r => {
      const type = (r.type || r.category || 'other').toLowerCase();
      const key = type.includes('room') ? 'study-rooms' : (type.includes('computer') || type.includes('work') || type.includes('equipment') ? 'equipment' : 'other');
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    // Helper to render a group
    function renderGroup(headerHtmlClass, title, items) {
      if (!items || items.length === 0) return;
      const headerRow = document.createElement('tr');
      headerRow.className = `category-header ${headerHtmlClass}`;
      const td = document.createElement('td');
      td.colSpan = 13;
      td.innerHTML = `<h3>${title}</h3>`;
      headerRow.appendChild(td);
      tbody.appendChild(headerRow);

      items.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = headerHtmlClass === 'study-rooms-header' ? 'study-room-row' : 'equipment-row';
        tr.setAttribute('data-category', headerHtmlClass === 'study-rooms-header' ? 'study-rooms' : 'equipment');

        const nameTd = document.createElement('td');
        nameTd.innerHTML = `<div class="resource-name"><span class="resource-icon">${(r.type||'').slice(0,2).toUpperCase()}</span> ${r.name}</div>`;
        tr.appendChild(nameTd);

        timeSlots.forEach(ts => {
          const td = document.createElement('td');
          const div = document.createElement('div');
          div.className = 'time-slot available';
          div.setAttribute('data-time', ts);
          td.appendChild(div);
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
    }

    // Render study rooms then equipment then others
    renderGroup('study-rooms-header', '📚 Group Study Rooms', groups['study-rooms']);
    renderGroup('equipment-header', '💻 Computer Workstations', groups['equipment']);
    // render 'other' as generic
    if (groups['other']) renderGroup('other-header', 'Other Resources', groups['other']);

    // After resources rendered, load bookings to mark slots
    await loadBookingsForCurrentDate();
  } catch (err) {
    console.error('Error loading resources', err);
  }
}

function normalizeCellTime(cellTime) {
  // cellTime examples: "10:00am", "12:00pm", "1:00pm"
  const m = cellTime.toLowerCase().match(/(\d{1,2}):(\d{2})(am|pm)?/);
  if (!m) return cellTime;
  let hh = parseInt(m[1], 10);
  const mm = m[2];
  const ampm = m[3];
  if (ampm === 'pm' && hh !== 12) hh += 12;
  if (ampm === 'am' && hh === 12) hh = 0;
  return `${String(hh).padStart(2,'0')}:${mm}`;
}

function bookingMatchesCell(bookingSlot, cellTime) {
  // bookingSlot can be '09:00-11:00' or '10:00am' etc. We'll compare the start hour.
  const cell = normalizeCellTime(cellTime);
  const bs = bookingSlot.trim();
  // if bookingSlot contains a '-', take start
  const start = bs.includes('-') ? bs.split('-')[0] : bs;
  // normalize start (may already be in 24h like 09:00)
  const s = start.toLowerCase().replace(/\s/g, '').replace(/am|pm/, '');
  // if start contains am/pm, convert
  const sMatch = start.match(/(\d{1,2}):(\d{2})(am|pm)?/i);
  let startNorm = s;
  if (sMatch) {
    let hh = parseInt(sMatch[1], 10);
    const mm = sMatch[2];
    const ap = (sMatch[3] || '').toLowerCase();
    if (ap === 'pm' && hh !== 12) hh += 12;
    if (ap === 'am' && hh === 12) hh = 0;
    startNorm = `${String(hh).padStart(2,'0')}:${mm}`;
  }
  return startNorm === cell;
}

function clearBookingMarks() {
  document.querySelectorAll('.time-slot').forEach(el => {
    el.classList.remove('your-booking', 'unavailable');
    el.classList.add('available');
  });
}

function renderBookings(bookings) {
  // bookings: array with fields including resource_name, time_slot, status
  clearBookingMarks();

  bookings.forEach(b => {
    const resourceName = (b.resource_name || '').trim();
    // find row containing resource name
    const rows = Array.from(document.querySelectorAll('tbody tr'))
      .filter(r => r.querySelector('.resource-name'));
    const row = rows.find(r => r.querySelector('.resource-name').textContent.includes(resourceName));
    if (!row) return;
    // find cell whose .time-slot data-time matches booking
    const slots = row.querySelectorAll('.time-slot');
    slots.forEach(slot => {
      const cellTime = slot.getAttribute('data-time');
      if (!cellTime) return;
      if (bookingMatchesCell(b.time_slot, cellTime)) {
        // mark based on status
        slot.classList.remove('available');
        if (b.status && b.status.toLowerCase() === 'approved') {
          slot.classList.add('your-booking');
        } else {
          slot.classList.add('unavailable');
        }
      }
    });
  });
}

// Initialize
updateDatePicker();
updateDateDisplay();
loadResourcesAndRenderTable();

// Category Filter Function
document.getElementById('categoryFilter').addEventListener('change', function() {
  const selectedCategory = this.value;
  
  // Get all rows and headers
  const studyRoomRows = document.querySelectorAll('.study-room-row');
  const equipmentRows = document.querySelectorAll('.equipment-row');
  const studyRoomsHeader = document.querySelector('.study-rooms-header');
  const equipmentHeader = document.querySelector('.equipment-header');
  
  if (selectedCategory === 'all') {
    // Show everything
    studyRoomRows.forEach(row => row.style.display = '');
    equipmentRows.forEach(row => row.style.display = '');
    studyRoomsHeader.style.display = '';
    equipmentHeader.style.display = '';
    
  } else if (selectedCategory === 'study-rooms') {
    // Show only study rooms
    studyRoomRows.forEach(row => row.style.display = '');
    equipmentRows.forEach(row => row.style.display = 'none');
    studyRoomsHeader.style.display = '';
    equipmentHeader.style.display = 'none';
    
  } else if (selectedCategory === 'equipment') {
    // Show only equipment
    studyRoomRows.forEach(row => row.style.display = 'none');
    equipmentRows.forEach(row => row.style.display = '');
    studyRoomsHeader.style.display = 'none';
    equipmentHeader.style.display = '';
  }
});