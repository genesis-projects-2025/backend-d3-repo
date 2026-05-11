require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const finalMessage = require('./templates/finalMessage');
const d3result=require('./templates/d3result')


// ---------- CORS ----------
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3001' ;
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
// const allowedOrigins = [
//   'http://localhost:3000',
//   'http://127.0.0.1:3000',
//   process.env.FRONTEND_ORIGIN // optional: for production
// ].filter(Boolean);

// app.use(cors({
//   origin: allowedOrigins,
//   credentials: true
// }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
let pool;

try {
  // decide sslOptions based on env
  let sslOptions = undefined;

  if (process.env.DB_SSL === "true") {
    // DEV-FRIENDLY: allow self-signed chain
    // For strict production, replace with CA file + rejectUnauthorized: true
    const certPath = path.resolve(__dirname, "certs", "aiven-ca.pem");
    if (fs.existsSync(certPath)) {
      sslOptions = {
        ca: fs.readFileSync(certPath),
        rejectUnauthorized: false, // allow self-signed in chain
      };
      console.log("🔐 Using Aiven CA certificate for SSL (relaxed verification)");
    } else {
      sslOptions = {
        rejectUnauthorized: false, // no CA file, but still use TLS without strict verify
      };
      console.log("🔐 Using SSL with relaxed verification (no CA file found)");
    }
  } else {
    console.log("🔓 DB_SSL is false or not set, connecting without SSL");
  }

  if (process.env.DATABASE_URL) {
    const dbUrl = new URL(process.env.DATABASE_URL);
    pool = mysql.createPool({
      host: dbUrl.hostname,
      port: dbUrl.port ? Number(dbUrl.port) : 3306,
      user: decodeURIComponent(dbUrl.username),
      password: decodeURIComponent(dbUrl.password),
      database: dbUrl.pathname.replace("/", ""),
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 50),
      timezone: '+05:30',
      ssl: sslOptions,
    });
  } else {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "root",
      database: process.env.DB_NAME || "material_request_promotion",
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 50),
       timezone: '+05:30',
      ssl: sslOptions,
    });
  }
} catch (err) {
  console.error("❌ Error creating DB pool:", err);
  process.exit(1);
}

// Test connection
pool
  .getConnection()
  .then((conn) => {
    console.log("✅ MySQL connected successfully!");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MySQL:", err.message);
    process.exit(1);
  });

// ---------- Health check ----------
app.get("/healthz", (_, res) => res.send("ok"));

app.get('/webhook', (req, res) => {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);  // Must send back the challenge
    } else {
        console.error('❌ Webhook verification failed');
        res.status(403).send('Forbidden');
    }
});

app.post('/send-final-message', async (req, res) => {
    try {
        const { to, name, score, riskLevel } = req.body;

        // Basic validation
        if (!to || !name || score === undefined) {
            return res.status(400).json({ 
                error: "Missing required fields: 'to', 'name', and 'score' are required" 
            });
        }

        // Calculate riskLevel if not provided
        const finalRiskLevel = riskLevel || (score < 5 ? "Adequate" : "Inadequate");

        console.log(`📤 Sending final message to: ${to}, name: ${name}, score: ${score}, riskLevel: ${finalRiskLevel}`);

        // Send WhatsApp message & save to DB in parallel
        const [result] = await Promise.all([
            d3result(to, name, score, finalRiskLevel),
            pool.query(
                `INSERT INTO d3_campaign (phone_number, name, risk_level, total_score) 
                 VALUES (?, ?, ?, ?)`,
                [to, name, finalRiskLevel, score]
            )
        ]);

        console.log(`✅ Data saved to DB for: ${to}`);

        res.json({ 
            success: true, 
            data: result 
        });

    } catch (error) {
        console.error("❌ Server Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/d3-campaign-data', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM d3_campaign ORDER BY id`
        );
        res.json(rows);
    } catch (err) {
        console.error("❌ Error fetching d3_campaign data:", err);
        res.status(500).json({ error: "Database error" });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`🚀 Server is running on port ${process.env.PORT}`);
});
