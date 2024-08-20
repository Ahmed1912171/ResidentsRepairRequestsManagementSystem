const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // For password hashing
dotenv.config();

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

let db;
let collection;

const port = 3000;

async function main() {
const client = new MongoClient(process.env.MONGODB_URI);

try {
await client.connect();
console.log('Connected to MongoDB Atlas');

db = client.db('RRMMS');  // Your database name
collection = db.collection('Userdata');  // Replace with your collection name

// Route to get all data
app.get('/data', async (req, res) => {
try {
const repairRequests = await collection.find({}).toArray();
res.json(repairRequests);
} catch (err) {
res.status(500).send('Error fetching data');
console.error(err);
}
});
////// input contractor items

app.get('/contractoritems', async (req, res) => {
try {
await client.connect();
const db = client.db('RRMMS');
const collection = db.collection('ContractorItems');
const items = await collection.find().toArray();
res.json(items);
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Error fetching data' });
}
});

app.post('/submit', async (req, res) => {
try {
await client.connect();
const database = client.db("RRMMS");
const collection = database.collection("ContractorItems");

// Ensure req.body is an array and contains data
if (Array.isArray(req.body) && req.body.length > 0) {
    // Insert the entire array into MongoDB as a single document
    const result = await collection.insertOne({ items: req.body });

    res.status(200).json({ message: 'Data inserted successfully', id: result.insertedId });
} else {
    res.status(400).json({ message: 'No data to insert' });
}
} catch (error) {
res.status(500).json({ message: 'An error occurred', error: error.message });
}
});

// Route to update status
app.patch('/data/:id/status', async (req, res) => {
const { id } = req.params;
const { status } = req.body;

if (!status) {
return res.status(400).send('Status field is required');
}

try {
const database = client.db('RRMMS');
const collection = database.collection('Userdata');

const result = await collection.findOneAndUpdate(
    { Request_ID: id },  // Ensure the ID is in the correct format
    { $set: { Status: status } },
    { returnDocument: 'after' }  // Return the updated document
);

if (result.value) {
    res.json(result.value);
} else {
    res.status(404).send('Request not found');
}
} catch (error) {
console.error('Error updating status:', error);
res.status(500).send('Error updating status');
}
});

// Handle registration form submission
app.post('/register', async (req, res) => {
const userInfo = {
username: req.body.username,
password: req.body.password // Consider hashing the password before storing
};

try {
const userCollection = db.collection('Userinfo');
// Hash the password before storing it
userInfo.password = await bcrypt.hash(userInfo.password, 10);
await userCollection.insertOne(userInfo);
console.log('User Registered');
res.status(200).send('Registration successful');
} catch (error) {
console.error(error);
res.status(500).send('Registration failed');
}
});

// Handle login form submission
app.post('/login', async (req, res) => {
const { username, password } = req.body;

try {
const userCollection = db.collection('Userinfo');
const user = await userCollection.findOne({ username: username });

if (!user) {
    return res.status(401).send('Invalid username or password');
}

const passwordMatch = await bcrypt.compare(password, user.password);

if (passwordMatch) {
    // Login successful, redirect to dashboard
    res.status(200).send('Login successful');
} else {
    // Incorrect password
    res.status(401).send('Invalid username or password');
}
} catch (error) {
console.error(error);
res.status(500).send('Login failed');
}
});

///for user registration form
app.post('/register-resident', async (req, res) => {
const residentInfo = {
first_name: req.body.first_name,
last_name: req.body.last_name,
email: req.body.email,
password: req.body.password,  // Consider hashing the password before storing
house_no: req.body.house_no,
colony: req.body.colony,
phone_no: req.body.phone_no,
user_type: req.body.user_type
};

try {
const result = await db.collection('Residentinfo').insertOne(residentInfo);
console.log('Resident Registered:', result);
res.json({ message: 'Registration successful!' }); // Send a JSON response with a message
} catch (error) {
console.error('Error during registration:', error);
res.status(500).json({ message: 'Error during registration' }); // Send an error response with a message
}
});




////////For Rejection reason saving

/// fetch user from residentsinfo

app.get('/residents', async (req, res) => {
try {
await client.connect();
const database = client.db('RRMMS');
const collection = database.collection('Residentinfo');
const residents = await collection.find({}).toArray();
res.json(residents);
} catch (error) {
console.error(error);
res.status(500).send('Error fetching residents data');
}
});

///////// for dashboard1


app.get('/status-count', async (req, res) => {
try {
const { status, nature } = req.query;

// Build the query object based on filters
let query = {};
if (status) {
query.Status = status;
}
if (nature) {
query.Nature_of_Request = nature;
}

// for approved, rejected, resolved, pending
const Approvedno = await collection.countDocuments({ ...query, Status: 'Approved' });
const Rejectedno = await collection.countDocuments({ ...query, Status: 'Rejected' });
const Resolvedno = await collection.countDocuments({ ...query, Status: 'Resolved' });
const Pendingno = await collection.countDocuments({ ...query, Status: 'Pending' });

// for Nature of requests
const Plumbingno = await collection.countDocuments({ ...query, Nature_of_Request: 'Plumbing' });
const RefrigeratorACno = await collection.countDocuments({ ...query, Nature_of_Request: 'Refrigerator/AC' });
const Masonryno = await collection.countDocuments({ ...query, Nature_of_Request: 'Masonry' });
const Telephoneno = await collection.countDocuments({ ...query, Nature_of_Request: 'Telephone' });
const Carpentryno = await collection.countDocuments({ ...query, Nature_of_Request: 'Carpentry' });
const Electricityno = await collection.countDocuments({ ...query, Nature_of_Request: 'Electricity' });
const Flooringno = await collection.countDocuments({ ...query, Nature_of_Request: 'Flooring' });
const Pestno = await collection.countDocuments({ ...query, Nature_of_Request: 'Pest Control' });
const Civilno = await collection.countDocuments({ ...query, Nature_of_Request: 'Civil' });
const Miscellaneousno = await collection.countDocuments({ ...query, Nature_of_Request: 'Miscellaneous' });
const Securityno = await collection.countDocuments({ ...query, Nature_of_Request: 'Security System Installation' });
const Gardeningno = await collection.countDocuments({ ...query, Nature_of_Request: 'Gardening' });
const Gutterno = await collection.countDocuments({ ...query, Nature_of_Request: 'Gutter' });
// for plumbing 
const PlumbingApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Plumbing', Status: 'Approved' });
const PlumbingRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Plumbing', Status: 'Rejected' });
const PlumbingResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Plumbing', Status: 'Resolved' });
const PlumbingPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Plumbing', Status: 'Pending' });

const RefrigeratorACApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Refrigerator/AC', Status: 'Approved' });
const RefrigeratorACRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Refrigerator/AC', Status: 'Rejected' });
const RefrigeratorACResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Refrigerator/AC', Status: 'Resolved' });
const RefrigeratorACPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Refrigerator/AC', Status: 'Pending' });

const MasonryApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Masonry', Status: 'Approved' });
const MasonryRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Masonry', Status: 'Rejected' });
const MasonryResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Masonry', Status: 'Resolved' });
const MasonryPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Masonry', Status: 'Pending' });

const TelephoneApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Telephone', Status: 'Approved' });
const TelephoneRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Telephone', Status: 'Rejected' });
const TelephoneResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Telephone', Status: 'Resolved' });
const TelephonePending = await collection.countDocuments({ ...query, Nature_of_Request: 'Telephone', Status: 'Pending' });

const CarpentryApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Carpentry', Status: 'Approved' });
const CarpentryRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Carpentry', Status: 'Rejected' });
const CarpentryResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Carpentry', Status: 'Resolved' });
const CarpentryPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Carpentry', Status: 'Pending' });

const ElectricityApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Electricity', Status: 'Approved' });
const ElectricityRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Electricity', Status: 'Rejected' });
const ElectricityResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Electricity', Status: 'Resolved' });
const ElectricityPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Electricity', Status: 'Pending' });

const FlooringApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Flooring', Status: 'Approved' });
const FlooringRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Flooring', Status: 'Rejected' });
const FlooringResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Flooring', Status: 'Resolved' });
const FlooringPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Flooring', Status: 'Pending' });

const PestApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Pest Control', Status: 'Approved' });
const PestRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Pest Control', Status: 'Rejected' });
const PestResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Pest Control', Status: 'Resolved' });
const PestPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Pest Control', Status: 'Pending' });

const CivilApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Civil', Status: 'Approved' });
const CivilRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Civil', Status: 'Rejected' });
const CivilResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Civil', Status: 'Resolved' });
const CivilPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Civil', Status: 'Pending' });

const MiscellaneousApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Miscellaneous', Status: 'Approved' });
const MiscellaneousRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Miscellaneous', Status: 'Rejected' });
const MiscellaneousResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Miscellaneous', Status: 'Resolved' });
const MiscellaneousPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Miscellaneous', Status: 'Pending' });

const SecurityApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Security System Installation', Status: 'Approved' });
const SecurityRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Security System Installation', Status: 'Rejected' });
const SecurityResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Security System Installation', Status: 'Resolved' });
const SecurityPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Security System Installation', Status: 'Pending' });

const GardeningApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Gardening', Status: 'Approved' });
const GardeningRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Gardening', Status: 'Rejected' });
const GardeningResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Gardening', Status: 'Resolved' });
const GardeningPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Gardening', Status: 'Pending' });

const GutterApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Gutter', Status: 'Approved' });
const GutterRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Gutter', Status: 'Rejected' });
const GutterResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Gutter', Status: 'Resolved' });
const GutterPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Gutter', Status: 'Pending' });

res.json({ 
Approvedno, Rejectedno, Resolvedno, Pendingno, 
Plumbingno, RefrigeratorACno, Masonryno, Telephoneno, 
Carpentryno, Electricityno, Flooringno, Pestno, 
Civilno, Miscellaneousno, Securityno, Gardeningno, Gutterno, PlumbingApproved,PlumbingRejected,PlumbingResolved, PlumbingPending,PlumbingApproved, PlumbingRejected, PlumbingResolved, PlumbingPending,
RefrigeratorACApproved, RefrigeratorACRejected, RefrigeratorACResolved, RefrigeratorACPending,
MasonryApproved, MasonryRejected, MasonryResolved, MasonryPending,
TelephoneApproved, TelephoneRejected, TelephoneResolved, TelephonePending,
CarpentryApproved, CarpentryRejected, CarpentryResolved, CarpentryPending,
ElectricityApproved, ElectricityRejected, ElectricityResolved, ElectricityPending,
FlooringApproved, FlooringRejected, FlooringResolved, FlooringPending,
PestApproved, PestRejected, PestResolved, PestPending,
CivilApproved, CivilRejected, CivilResolved, CivilPending,
MiscellaneousApproved, MiscellaneousRejected, MiscellaneousResolved, MiscellaneousPending,
SecurityApproved, SecurityRejected, SecurityResolved, SecurityPending,
GardeningApproved, GardeningRejected, GardeningResolved, GardeningPending,
GutterApproved, GutterRejected, GutterResolved, GutterPending

});

} catch (error) {
res.status(500).send('Error occurred while fetching data');
}
});


//////////// getting contractor items
const mongoose = require('mongoose');


mongoose.connect('mongodb+srv://ahmedhasan1319:californiaxyz@cluster0.w1olag9.mongodb.net/RRMMS?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });


const contractorItemSchema = new mongoose.Schema({
    serialNumber: String,
    category: String,
    item: String,
    quantity: String,
    measuringQuantity: String,
    misc: String
});

const ContractorItem = mongoose.model('ContractorItem', contractorItemSchema, 'ContractorItems');

app.get('/fetch-request/:id', async (req, res) => {
    try {
        const request = await ContractorItem.findById(req.params.id);
        if (request) {
            res.json(request);
        } else {
            res.status(404).send('Request not found');
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/fetch-all', async (req, res) => {
    try {
        const requests = await ContractorItem.find();
        res.json(requests);
    } catch (err) {
        res.status(500).send(err);
    }
});


app.listen(port, () => {
console.log(`Server running on http://localhost:${port}/dashboard.html`);
console.log(`Server running on http://localhost:${port}/miv.html`);
console.log(`Server running on http://localhost:${port}/userscreen.html`);

});

} catch (err) {
console.error(err);
} 
}
main().catch(console.error);


