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
loadBookingsForCurrentDate();

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