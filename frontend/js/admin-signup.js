const API_BASE = "http://localhost:3000";

const adminForm = document.getElementById('adminSignUpForm');

if (adminForm) {
  adminForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!adminForm.checkValidity()) {
      adminForm.reportValidity();
      return;
    }

    const firstName = document.getElementById('adminFirstName').value.trim();
    const lastName = document.getElementById('adminLastName').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('Password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Password kontrolü
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const full_name = `${firstName} ${lastName}`;

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          full_name,
          email,
          password,
          role: "admin"  // ADMIN olarak kayıt
        })
      });

      const data = await response.json();
      console.log("Admin register response:", data);

      if (!response.ok) {
        alert(data.message || "Registration failed.");
        return;
      }

      alert("Admin registration successful! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "admin-login.html";
      }, 1000);

    } catch (error) {
      console.error("Error during admin signup:", error);
      alert("Network or server error.");
    }
  });
}