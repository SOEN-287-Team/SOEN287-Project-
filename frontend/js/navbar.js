const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  const loginLogoutLink = document.querySelector('nav.navbar a[href="login.html"]');

  if (!loginLogoutLink) {
    console.error("Login/Logout link not found in navbar.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      method: "GET",
      credentials: "include"
    });

    if (res.ok) {
      // --- USER IS LOGGED IN ---
      loginLogoutLink.textContent = "Logout";
      loginLogoutLink.href = "#";

      // Remove any existing listener, then set new onclick
      loginLogoutLink.onclick = async (e) => {
        e.preventDefault();

        try {
          const logoutRes = await fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
            credentials: "include"
          });

          const data = await logoutRes.json();
          console.log("Logout result:", data);

          // Redirect after logout
          window.location.href = "login.html";
        } catch (logoutError) {
          console.error("Logout failed:", logoutError);
        }
      };

    } else {
      // --- USER NOT LOGGED IN ---
      loginLogoutLink.textContent = "Login";
      loginLogoutLink.href = "login.html";
      loginLogoutLink.onclick = null;
    }

  } catch (err) {
    console.error("navbar auth check error:", err);
  }
});
