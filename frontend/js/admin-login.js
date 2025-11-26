const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", function() {
    const adminLoginForm = document.getElementById("adminloginform");

    if (!adminLoginForm) return;

    adminLoginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        if (!this.checkValidity()) {
            this.reportValidity();
            return;
        }

        const email = document.getElementById("adminEmail").value.trim();
        const password = document.getElementById("adminPassword").value;

        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            console.log("Admin login response:", data);

            if (!res.ok) {
                alert(data.message || "Login failed.");
                return;
            }

            // Admin olduğunu kontrol et
            if (data.user.role !== 'admin') {
                alert("Access denied. Admin privileges required.");
                return;
            }

            alert("Admin login successful!");
            window.location.href = "admin.html";

        } catch (err) {
            console.error("Admin login error:", err);
            alert("Network or server error.");
        }
    });
});