let html5QrCode;
let isScanning = false;
let totalTasks = 10;

const scanStatus = document.getElementById("scanStatus");
const progressText = document.getElementById("progressText");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

// Load progress
let progress = parseInt(localStorage.getItem("progress")) || 0;
updateProgress();

startBtn.onclick = startScanner;
stopBtn.onclick = stopScanner;

function updateProgress() {
  progressText.innerText = `${progress} / ${totalTasks} Completed`;
}

function startScanner() {
  if (isScanning) return;

  html5QrCode = new Html5Qrcode("reader");

  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 }
  };

  html5QrCode.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      handleScan(decodedText);
    }
  );

  isScanning = true;
  scanStatus.innerText = "Scanner Started...";
}

function handleScan(decodedText) {

  if (!isScanning) return;

  // Example validation:
  if (decodedText.startsWith("TASK")) {

    progress++;
    if (progress > totalTasks) progress = totalTasks;

    localStorage.setItem("progress", progress);
    updateProgress();

    scanStatus.innerText = "✅ Task Completed!";
    scanStatus.style.color = "lime";

  } else {
    scanStatus.innerText = "❌ Invalid QR";
    scanStatus.style.color = "red";
  }

  setTimeout(() => {
    scanStatus.style.color = "#f5c542";
  }, 2000);
}

async function stopScanner() {
  if (html5QrCode && isScanning) {
    await html5QrCode.stop();
    isScanning = false;
    scanStatus.innerText = "Scanner Stopped.";
  }
}
