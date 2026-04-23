require('dotenv').config();
const express = require('express');
const axios = require('axios');
// const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const app = express();

const finalMessage = require('./templates/finalMessage');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/send-final-message', async (req, res) => {
    try {
        const { to,name } = req.body;
        console.log(to);
        const result = await finalMessage(to, name);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});