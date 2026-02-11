<?php
session_start();

$error = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    if (isset($_POST["admin_login"])) {
        if ($_POST["username"]=="Admin" && $_POST["key"]=="kuc123") {
            $_SESSION["admin"]=true;
            header("Location: admin/admin_room.php");
            exit;
        } else {
            $error = "Invalid admin credentials";
        }
    }

    if (isset($_POST["user_login"])) {
        require "api/db.php";
        $u=$_POST["username"];
        $p=$_POST["password"];

        $stmt=$conn->prepare("SELECT id,password FROM users WHERE username=?");
        $stmt->bind_param("s",$u);
        $stmt->execute();
        $res=$stmt->get_result();

        if($row=$res->fetch_assoc()){
            if(password_verify($p,$row["password"])){
                $_SESSION["user_id"]=$row["id"];
                header("Location: user/room.html");
                exit;
            } else {
                $error = "Wrong password";
            }
        } else {
            $error = "User not found";
        }
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Login - Treasure Hunt</title>
    <link rel="stylesheet" href="index.css">
</head>
<body>

<div class="login">

    <div class="logo">
        <img src="./treasure2.png" alt="Treasure Hunt Logo" width="100%">
    </div>

    <div class="login-content">
        <h1>The Quest Begins</h1>
        <p>Enter your credentials to start tracking clues and uncovering secrets.</p>
    </div>

    <div class="roll">
        <div class="slider" id="slider"></div>
        <button class="tab1" id="userTab">USER</button>
        <button class="tab2" id="adminTab">ADMIN</button>
    </div>

    <!-- USER FORM -->
    <form method="POST" id="userForm">
        <div class="input-box">
            <input name="username" placeholder="Username" required>
        </div>
        <div class="input-box">
            <input name="password" type="password" placeholder="Password" required>
        </div>
        <button name="user_login" class="signin-btn">Sign In</button>
    </form>

    <!-- ADMIN FORM -->
    <form method="POST" id="adminForm" style="display:none;">
        <div class="input-box">
            <input name="username" placeholder="Admin Username" required>
        </div>
        <div class="input-box">
            <input name="key" type="password" placeholder="Secret Access Key" required>
        </div>
        <button name="admin_login" class="signin-btn">Sign In</button>
    </form>

    <div class="form-footer">
        Not a member? <a href="signup.html" class="signup-link">Sign up now</a>
    </div>

    <?php if ($error): ?>
        <div style="color:red;text-align:center;"><?php echo $error; ?></div>
    <?php endif; ?>

</div>

<script>
const userTab = document.getElementById("userTab");
const adminTab = document.getElementById("adminTab");
const slider = document.getElementById("slider");
const userForm = document.getElementById("userForm");
const adminForm = document.getElementById("adminForm");

userTab.onclick = () => {
    slider.style.transform = "translateX(0)";
    userForm.style.display = "block";
    adminForm.style.display = "none";
};

adminTab.onclick = () => {
    slider.style.transform = "translateX(100%)";
    userForm.style.display = "none";
    adminForm.style.display = "block";
};
</script>

</body>
</html>
