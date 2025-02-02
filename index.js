const http = require("http");
const express = require("express");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const { query, validationResult } = require("express-validator");

const app = express();
const port = 1336;

// Obtain your API token from https://docs.henrikdev.xyz/authentication-and-authorization
const API_TOKEN = "TOKEN";

const limiter = rateLimit({
  windowMs: 30 * 1000,
  max: 10,
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter);

app.get(
  "/rank",
  [
    query("name").isString().trim().escape(),
    query("tag").isString().trim().escape(),
    query("region").isIn(["eu", "na", "ap", "kr", "latam", "br"]),
    query("format").optional().isIn(["message", null]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, tag, region, format } = req.query;

    // https://docs.henrikdev.xyz/valorant/api-reference/mmr
    try {
      const url = `https://api.henrikdev.xyz/valorant/v1/mmr/${encodeURIComponent(
        region
      )}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;

      const response = await axios.get(url, {
        headers: { Authorization: API_TOKEN },
        timeout: 5000,
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
        error.response?.data?.error || error.message
      );
      res.status(500).json({ error: "Failed to retrieve rank information." });
    }
  }
);

http.createServer(app).listen(port, () => {
  console.log(
    `HTTP server is running on http://localhost:${port} (listening on all interfaces/0.0.0.0)`
  );
});
