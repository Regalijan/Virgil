import { config as dotenv } from "dotenv";

dotenv();

const config = {
  mongodb: {
    url: process.env.MONGOURL ?? "mongodb://mongo:27017",
    databaseName: "bot",
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  lockCollectionName: "changelog_lock",
  lockTtl: 0,
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: "esm",
};

export default config;
