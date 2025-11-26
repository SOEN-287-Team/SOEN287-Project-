// js/profile.js

const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      method: "GET",
      credentials: "include" // send session cookie
    });

    if (!res.ok) {
      console.log("User not logged in, redirecting to login.");
      window.location.href = "login.html";
      return;
    }

    const data = await res.json();
    console.log("Profile GET response:", data);

    const user = data.user;

    // Fill profile info
    document.getElementById("profileName").textContent =
      user.full_name || "";
    document.getElementById("profileEmail").textContent =
      user.email || "";
    document.getElementById("profileStudentId").textContent =
      user.student_id || "";

    // Major + Year stay hard-coded in HTML for now

  } catch (err) {
    console.error("Profile fetch error:", err);
  }
});
