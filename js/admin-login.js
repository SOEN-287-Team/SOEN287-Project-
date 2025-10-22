document.addEventListener("DOMContentLoaded", function() {

    const adminLoginForm = document.getElementById("adminloginform");

    adminLoginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        if (!this.checkValidity()) {
            this.reportValidity();
            return;
        }
        else {
            window.location.href = "admin.html"; 
        }
    });
});
