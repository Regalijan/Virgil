import Sentry from "./sentry";

export default function (e: any) {
  process.env.DSN ? console.error(e) : Sentry.captureException(e);
}
