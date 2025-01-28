const fs = require("fs");
const https = require("https");
const http = require("http");
const express = require("express");
const axios = require("axios");

const app = express();
const port = 1336;
const sslFolder = "SSL_FOLDER";

// Obtain your API token from https://docs.henrikdev.xyz/authentication-and-authorization
const API_TOKEN = "TOKEN";

let sslOptions = null;
try {
  sslOptions = {
    key: fs.readFileSync(`${sslFolder}/privkey.pem`),
    cert: fs.readFileSync(`${sslFolder}/cert.pem`),
  };
  console.log("✅ SSL certificates found. HTTPS will be enabled.");
} catch (err) {
  console.warn(
    "⚠️ SSL certificates not found. Falling back to HTTP (insecure)."
  );
}

app.get("/rank", async (req, res) => {
  const { name, tag, region, format } = req.query;

  if (!region) {
    return res.status(400).json({
      error:
        "Please provide region as query parameter. (Available regions: eu/na/ap/kr/latam/br)",
    });
  }
  if (!name || !tag) {
    return res
      .status(400)
      .json({ error: "Please provide name and tag as query parameters." });
  }

  // https://docs.henrikdev.xyz/valorant/api-reference/mmr
  try {
    const url = `https://api.henrikdev.xyz/valorant/v1/mmr/${encodeURIComponent(
      region
    )}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
    const response = await axios.get(url, {
      headers: { Authorization: API_TOKEN },
    });

    const { currenttierpatched, ranking_in_tier } = response.data.data;

    if (format === "message") {
      return res.send(
        `${name}#${tag} (${region.toUpperCase()}) - ${currenttierpatched} - ${ranking_in_tier} RR`
      );
    }

    res.json({
      name,
      tag,
      nameAndTag: `${name}#${tag}`,
      region,
      rank: currenttierpatched,
      rankPoints: ranking_in_tier,
    });
  } catch (error) {
    console.error(
      "Error fetching rank:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to retrieve rank information." });
  }
});

if (sslOptions) {
  https.createServer(sslOptions, app).listen(port, () => {
    console.log(
      `✅ HTTPS server is running on https://localhost:${port} (listening on all interfaces/0.0.0.0)`
    );
  });
} else {
  http.createServer(app).listen(port, () => {
    console.log(
      `⚠️ HTTP server is running on http://localhost:${port} (listening on all interfaces/0.0.0.0 - !!!INSECURE!!!)`
    );
  });
}
