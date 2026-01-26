<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Treasure Hunt</title>
    <link rel="stylesheet" href="index.css">
</head>
<body>

<div class="login">
    <h1 class="top">Treasure Hunt</h1>

    <div class="header">
        <img src="./treasure-hunt-removebg-preview.png" width="100%">
    </div>

    <div class="login-content">
        <h1>The Quest Begins</h1>
        <p>Enter your credentials to start tracking clues and uncovering secrets.</p>
    </div>

    <!-- TOGGLE -->
    <div class="roll">
        <div class="slider"></div>
        <button type="button" class="tab1 active">USER</button>
        <button type="button" class="tab2">ADMIN</button>
    </div>

    <!-- FORM -->
    <form id="loginForm">
        <div class="input-box">
            <span class="icon">👤</span>
            <input type="text" placeholder="Hunter Name" required>
        </div>

        <div class="input-box">
            <span class="icon">🔒</span>
            <input type="password" placeholder="Secret Access Key" required>
        </div>

        <button type="submit" class="signin-btn">Sign in</button>
    </form>
</div>

<script>
    const userBtn = document.querySelector(".tab1");
    const adminBtn = document.querySelector(".tab2");
    const slider = document.querySelector(".slider");

    userBtn.onclick = () => {
        userBtn.classList.add("active");
        adminBtn.classList.remove("active");
        slider.style.transform = "translateX(0%)";
    };

    adminBtn.onclick = () => {
        adminBtn.classList.add("active");
        userBtn.classList.remove("active");
        slider.style.transform = "translateX(100%)";
    };

    document.getElementById("loginForm").onsubmit = function (e) {
        e.preventDefault();

        // ✅ RELIABLE CHECK
        if (userBtn.classList.contains("active")) {
            window.location.href = "./user/room.html";
        } else {
            window.location.href = "./admin/admin_room.html";
        }
    };
</script>

</body>
</html>
