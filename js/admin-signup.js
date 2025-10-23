const adminForm = document.getElementById('adminSignUpForm');

if (adminForm) {
  adminForm.addEventListener('submit', function(e) {
    if (!adminForm.checkValidity()) {
      adminForm.reportValidity();
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
    window.location.href = 'admin-login.html';
  });
}
