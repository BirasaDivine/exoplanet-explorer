const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8080;

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff": "application/font-woff",
  ".ttf": "application/font-ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "application/font-otf",
  ".wasm": "application/wasm",
};

http
  .createServer((request, response) => {
    console.log("Request:", request.url);

    let filePath;
    // Check if request is for a bower component
    if (request.url.startsWith("/bower_components/")) {
      filePath = "." + request.url; // Use the root project directory
      console.log("Bower component requested:", filePath);
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log("File doesn't exist at:", filePath);
        console.log("Also checking in:", "./app" + request.url);
        if (fs.existsSync("./app" + request.url)) {
          filePath = "./app" + request.url;
          console.log("Found file in app directory instead");
        }
      }
    } else {
      filePath = "./app" + request.url; // Use the app directory
      if (filePath === "./app/") {
        filePath = "./app/index.html";
      }
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || "application/octet-stream";

    // Special case for webcomponents polyfill
    if (request.url === "/bower_components/webcomponentsjs/webcomponents-lite.js") {
      const possiblePaths = [
        "./bower_components/webcomponentsjs/webcomponents-lite.js",
        "./app/bower_components/webcomponentsjs/webcomponents-lite.js"
      ];
      
      for (const tryPath of possiblePaths) {
        if (fs.existsSync(tryPath)) {
          filePath = tryPath;
          console.log("Found webcomponents polyfill at:", filePath);
          break;
        }
      }
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === "ENOENT") {
          console.log("File not found:", filePath);
          fs.readFile("./app/404.html", (error, content) => {
            if (error) {
              response.writeHead(404);
              response.end("File not found");
            } else {
              response.writeHead(404, { "Content-Type": "text/html" });
              response.end(content, "utf-8");
            }
          });
        } else {
          response.writeHead(500);
          response.end(
            `Sorry, check with the site admin for error: ${error.code} ..\n`
          );
        }
      } else {
        response.writeHead(200, { "Content-Type": contentType });
        response.end(content, "utf-8");
      }
    });
  })
  .listen(PORT);

console.log(`Server running at http://localhost:${PORT}/`);
console.log("Press Ctrl+C to stop the server");
