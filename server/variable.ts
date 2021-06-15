//

import dotenv from "dotenv";


dotenv.config({path: "./variable.env"});

export const VERSION = process.env["npm_package_version"] || "?";
export const PORT = process.env["PORT"] || 8050;
export const COOKIE_SECRET = process.env["COOKIE_SECRET"] || "cookie-shaleian";