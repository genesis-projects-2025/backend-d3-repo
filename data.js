require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const finalMessage = require('./templates/finalMessage');
const d3result=require('./templates/d3result')
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/send-final-message', async (req, res) => {
    try {
        const { to, name, score, riskLevel } = req.body;

        // Basic validation
        if (!to || !name || score === undefined) {
            return res.status(400).json({ 
                error: "Missing required fields: 'to', 'name', and 'score' are required" 
            });
        }

        // Calculate riskLevel if not provided (based on conditions: < 5 is Adequate, >= 5 is Inadequate)
        const finalRiskLevel = riskLevel || (score < 5 ? "Adequate" : "Inadequate");

        console.log(`📤 Sending final message to: ${to}, name: ${name}, score: ${score}, riskLevel: ${finalRiskLevel}`);

        const result = await d3result(to, name, score, finalRiskLevel);
        res.json({ 
            success: true, 
            data: result 
        });

    } catch (error) {
        console.error("❌ Server Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`🚀 Server is running on port ${process.env.PORT}`);
});