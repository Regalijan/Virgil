require("dotenv").config();
const { execSync } = require("child_process");

if (typeof process.env.INSTALL_FFMPEG === "undefined") process.exit();

try {
  execSync("apt-get update && apt-get install -y ffmpeg");
} catch (e) {
  console.error("Failed to install FFmpeg:\n", e);
}
