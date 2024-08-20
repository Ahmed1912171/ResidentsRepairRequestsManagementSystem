const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = 3000;
const client = new MongoClient(process.env.MONGODB_URI);

async function main() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('RRMMS2');
        const collection = db.collection('newrequests');

        app.get('/data', async (req, res) => {
            try {
                const data = await collection.find({ Status: 'Pending' }).toArray();
                res.json(data);
            } catch (error) {
                res.status(500).send('Error fetching data');
            }
        });

        app.get('/newrequests', async (req, res) => {
            try {
                const data = await collection.find({ Status: 'Approved By Housing Officer' }).toArray();
                res.json(data);
            } catch (error) {
                res.status(500).send('Error fetching data');
            }
        });

        app.get('/clerk', async (req, res) => {
            try {
                const data = await collection.find({ Status: 'Approved By Housing Clerk' }).toArray();
                res.json(data);
            } catch (error) {
                res.status(500).send('Error fetching data');
            }
        });

        app.get('/miv', async (req, res) => {
            try {
                const data = await collection.find({ Status: 'Approved By MIV Officer' }).toArray();
                res.json(data);
            } catch (error) {
                res.status(500).send('Error fetching data');
            }
        });

        app.patch('/data/:requestId/status', async (req, res) => {
            try {
                const requestId = req.params.requestId;
                const { status } = req.body;
                const result = await collection.updateOne(
                    { Request_ID: requestId },
                    { $set: { Status: status } }
                );
                if (result.modifiedCount > 0) {
                    res.json({ message: 'Request updated successfully' });
                } else {
                    res.status(404).send('Request Not Found');
                }
            } catch (error) {
                console.error('Error updating request status:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

main();
