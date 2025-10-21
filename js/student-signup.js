const studentForm = document.getElementById('studentSignUpForm');

if (studentForm) {
  studentForm.addEventListener('submit', function(e) {
    if (!studentForm.checkValidity()) {
      studentForm.reportValidity();
      e.preventDefault();
      return;
    }

    const password = document.getElementById('Password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      e.preventDefault();
      return;
    }

    e.preventDefault();
    window.location.href = 'student-login.html';
  });
}
