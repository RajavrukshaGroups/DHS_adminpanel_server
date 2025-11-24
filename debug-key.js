// debug-key.js
import dotenv from "dotenv";
dotenv.config();

let key = process.env.GOOGLE_PRIVATE_KEY || "";
// trim possible surrounding quotes
if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
// show lengths and start/end so you can confirm formatting
console.log("KEY length:", key.length);
console.log("KEY startsWith BEGIN:", key.trim().startsWith("-----BEGIN"));
console.log("KEY endsWith END:", key.trim().endsWith("-----END PRIVATE KEY-----"));
console.log("KEY snippet start:", key.slice(0, 40).replace(/\n/g, "\\n"));
console.log("KEY snippet end:", key.slice(-40).replace(/\n/g, "\\n"));
