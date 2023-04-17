const crypto = require("crypto");

// generate 16 bytes of random data


// our secret message
const message = "Hello There, I should be a secret";

// secret key
const key = "sotatek".padEnd(32, '0');
const iv = key.toString("hex").slice(0, 16);
console.log(iv);
// make the encrypter function
const encrypter = crypto.createCipheriv("aes-256-cbc", key, iv);

// encrypt the message
// set the input encoding
// and the output encoding
let encryptedMsg = encrypter.update(message, "utf-8", "hex");

// stop the encryption using
// the final method and set
// output encoding to hex
encryptedMsg += encrypter.final("hex");

console.log("Encrypted message: " + encryptedMsg);

// make the decrypter function
const decrypter = crypto.createDecipheriv("aes-256-cbc", key, iv);

// decrypt the message
// set the input encoding
// and the output encoding
let decryptedMsg = decrypter.update(encryptedMsg, "hex", "utf8");

// stop the decryption using
// the final method and set
// output encoding to utf8
decryptedMsg += decrypter.final("utf8");

console.log("Decrypted message: " + decryptedMsg);
