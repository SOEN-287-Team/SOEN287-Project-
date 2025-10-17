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