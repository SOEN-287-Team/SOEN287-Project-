// js/student-login.js

const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("studentloginform");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // stop normal form submit

    const email = document.getElementById("studentEmail").value.trim();
    const password = document.getElementById("studentPassword").value.trim();

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",              // 🔥 VERY IMPORTANT
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // Login OK → go to profile page
      window.location.href = "profile.html";
    } catch (err) {
      console.error("Login request error:", err);
      alert("Network error during login.");
    }
  });
});
