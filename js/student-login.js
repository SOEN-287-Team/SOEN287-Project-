document.addEventListener("DOMContentLoaded", function() {

    const studentLoginForm = document.getElementById("studentloginform");

    if (!studentLoginForm) {
        console.error("Student form not found!");
        return;
    }

    studentLoginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        if (!this.checkValidity()) {
            this.reportValidity();
            return;
        }
        else {
            window.location.href = "profile.html"; 
        }
        
    });
});
