import { execSync } from "child_process";
import { config as dotenv } from "dotenv";

dotenv();

if (!process.env.INSTALL_FFMPEG) process.exit();

try {
  execSync("DEBIAN_FRONTEND=noninteractive apt install -y ffmpeg");
} catch (e) {
  console.error("Unable to install FFmpeg:\n", e);
}
