const API_BASE = "http://localhost:3000";

const form = document.getElementById("studentSignUpForm");
const messageBox = document.getElementById("studentSignUpMessage");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const firstName = document.getElementById("studentFirstName").value.trim();
    const lastName = document.getElementById("studentLastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const studentID = document.getElementById("studentID").value.trim();
    const password = document.getElementById("Password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      if (messageBox) {
        messageBox.textContent = "Passwords do not match.";
        messageBox.style.color = "red";
      } else {
        alert("Passwords do not match.");
      }
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
          student_id: studentID
        })
      });

      const data = await response.json();
      console.log("Register response:", data);

      if (!response.ok) {
        if (messageBox) {
          messageBox.textContent = data.message || "Registration failed.";
          messageBox.style.color = "red";
        } else {
          alert(data.message || "Registration failed.");
        }
      } else {
        if (messageBox) {
          messageBox.textContent = "Registration successful! Redirecting to login...";
          messageBox.style.color = "green";
        }

        // This is what actually redirects
        setTimeout(() => {
          window.location.href = "student-login.html";
        }, 1000);
      }
    } catch (error) {
      console.error("Error during signup:", error);
      if (messageBox) {
        messageBox.textContent = "Network or server error.";
        messageBox.style.color = "red";
      } else {
        alert("Network or server error.");
      }
    }
  });
}
