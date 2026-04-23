require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const finalMessage = require('./templates/finalMessage');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/send-final-message', async (req, res) => {
    try {
        const { to, name } = req.body;

        // Basic validation
        if (!to || !name) {
            return res.status(400).json({ 
                error: "Missing required fields: 'to' and 'name' are required" 
            });
        }

        console.log(`📤 Sending final message to: ${to}, name: ${name}`);

        const result = await finalMessage(to, name);
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