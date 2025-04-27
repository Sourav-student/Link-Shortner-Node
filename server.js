import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto'

const port = 5000;
const FILE_PATH = path.join("data", "link.json");

const fileData = async (res, filePath, textType) => {
  try {
    const data = await fs.promises.readFile(filePath);
    res.writeHead(200, { "Content-Type": textType })
    return res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "text/html" })
    return res.end("404 page not found");
  }
}

const loadLinks = async () => {
    try {
      const data = await fs.promises.readFile(FILE_PATH, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      if(error.code === "ENOENT"){
        await fs.promises.writeFile(FILE_PATH, JSON.stringify({}));
        return {};
      }
      throw error;
    }
}

const saveLinks = async (links) => {
    await fs.promises.writeFile(FILE_PATH, JSON.stringify(links))
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      await fileData(res, path.join("public", "index.html"), "text/html");
    }
    else if (req.url === "/style.css") {
      await fileData(res, path.join("public", "style.css"), "text/css");
    }
    else if(req.url === "/links"){
      const links = await loadLinks();
      res.writeHead(200, {"Content-Type" : "application/json"});
      return res.end(JSON.stringify(links));
    }
    else{
      const links = await loadLinks();
      const shortenCode = req.url.slice(1);
      if(links[shortenCode]){
        res.writeHead(302, { location : links[shortenCode]})
        return res.end();
      }

      res.writeHead(404, {"Content-Type" : "text/plain"});
      return res.end("Shorten URL is not found");
    }
  }

  if(req.method === "POST" && req.url === "/shorten"){
    
    const links = await loadLinks();
    let body = "";
    req.on("data", (chunk) => (body += chunk))

    req.on("end",async ()=>{
      console.log(body);
      let { url, shortCode } = JSON.parse(body);
      console.log(shortCode)
      if(!url){
        res.writeHead(404, {"Content-Type" : "text/html"})
        return res.end("404 url is invalid");
      }

      const finalShortCode = shortCode && shortCode.trim() !== "" ? shortCode : crypto.randomBytes(4).toString('hex');

      if(links[finalShortCode]){
        res.writeHead(404, {"Content-Type" : "text/html"})
        return res.end("Short code already exist please try again.");
      }

      links[finalShortCode] = url;
      await saveLinks(links);

      res.writeHead(200, {"Content-Type" : "Application/json"});
      res.end(JSON.stringify({success: true, shortCode : finalShortCode}))
    })
  }
  
  
})

server.listen(port, () => {
  console.log(`Run at ${port} port!`);
})