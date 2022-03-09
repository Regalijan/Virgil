import { execSync } from "child_process";

try {
  execSync("DEBIAN_FRONTEND=noninteractive apt install -y ffmpeg");
} catch (e) {
  console.error("Unable to install FFmpeg:\n", e);
}
