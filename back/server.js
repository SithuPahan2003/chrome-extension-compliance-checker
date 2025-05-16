// server.js
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const uri = 'mongodb+srv://dsaps0115:OcNBxXVK2TFK1p4M@cluster0.mnfxpqe.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri, { tlsAllowInvalidCertificates: true });
const dbName = 'compliance_scanner';

app.get('/', (req, res) => {
    res.send('Compliance Scanner Backend is running.');
});

app.post('/save-scan', async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const scans = db.collection('scans');
        const result = await scans.insertOne(req.body);
        res.json({ success: true, id: result.insertedId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/get-scans', async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const scans = db.collection('scans');
        const allScans = await scans.find({}).toArray();
        res.json(allScans);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(3000, () => console.log('Backend running on http://localhost:3000'));