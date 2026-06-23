const crypto = require("crypto");

console.log(`auadm_${crypto.randomBytes(24).toString("hex")}`);
