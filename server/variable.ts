//

import dotenv from "dotenv";


dotenv.config({path: "./variable.env"});

export const VERSION = process.env["npm_package_version"] || "?";
export const PORT = process.env["PORT"] || 8050;
export const COOKIE_SECRET = process.env["COOKIE_SECRET"] || "cookie-shaleian";
export const GOOGLE_CREDENTIALS = JSON.parse(process.env["GOOGLE_CREDENTIALS"] ?? "{}");
export const TWITTER_KEY = process.env["TWITTER_KEY"] || "dummy";
export const TWITTER_SECRET = process.env["TWITTER_SECRET"] || "dummy";
export const TWITTER_ACCESS_KEY = process.env["TWITTER_ACCESS_KEY"] || "dummy";
export const TWITTER_ACCESS_SECRET = process.env["TWITTER_ACCESS_SECRET"] || "dummy";
export const DICTIONARY_ID = process.env["DICTIONARY_ID"] || "dummy";
export const HISTORY_SPREADSHEET_ID = process.env["HISTORY_SPREADSHEET_ID"] || "dummy";
export const QUIZ_SPREADSHEET_ID = process.env["QUIZ_SPREADSHEET_ID"] || "dummy";