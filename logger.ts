import Sentry from "./sentry.js";

export default function (e: any) {
  process.env.DSN ? console.error(e) : Sentry.captureException(e);
}
