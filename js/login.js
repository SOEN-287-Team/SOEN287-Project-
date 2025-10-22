document.addEventListener("DOMContentLoaded", function() {

    const continueButton = document.getElementById("continueButton");
    if (continueButton) {
        continueButton.addEventListener("click", function() {
            const selected = document.querySelector('input[name="userType"]:checked');

            if (!selected) {
                alert("Please select user type");
                return;
            }

            if (selected.value === "student") {
                window.location.href = "student-login.html";
            } else if (selected.value === "admin") {
                window.location.href = "admin-login.html";
            }
        });
    }
});

