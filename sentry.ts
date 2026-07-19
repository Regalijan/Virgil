import * as Sentry from "@sentry/node";
import { execSync } from "child_process";

Sentry.init({
  dsn: process.env.DSN,
  release: execSync("git rev-parse HEAD", { cwd: process.cwd() }).toString(),
});

export default Sentry;
