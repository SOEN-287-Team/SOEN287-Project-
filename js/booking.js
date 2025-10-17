 // Simple date navigation 
  let currentDateObj = new Date(2025, 9, 16); // October 16, 2025

  // Initialize date picker
  const datePicker = document.getElementById('datePicker');
  
  // When user selects a date from the picker
  datePicker.addEventListener('change', function() {
    currentDateObj = new Date(this.value + 'T00:00:00');
    updateDateDisplay();  // THIS LINE WAS MISSING OR NOT WORKING
  });

  function changeDate(days) {
    currentDateObj.setDate(currentDateObj.getDate() + days);
    updateDateDisplay();
    updateDatePicker();
  }

  function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = currentDateObj.toLocaleDateString('en-US', options);
  }

  function updateDatePicker() {
    // Update the date picker input value
    const year = currentDateObj.getFullYear();
    const month = String(currentDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(currentDateObj.getDate()).padStart(2, '0');
    datePicker.value = `${year}-${month}-${day}`;
  }

  // Initialize
  updateDateDisplay();

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