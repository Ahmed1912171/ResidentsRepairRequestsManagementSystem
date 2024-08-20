const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // For password hashing
dotenv.config();
const mongoose = require('mongoose');

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
mongoose.connect('mongodb+srv://ahmedhasan1319:californiaxyz@cluster0.w1olag9.mongodb.net/RRMMS2?retryWrites=true&w=majority');

try {
await client.connect();
console.log('Connected to MongoDB Atlas db name RRMMS2');

db = client.db('RRMMS2');  // Your database name
collection = db.collection('newrequests');  // Replace with your collection name





// Route to get all data

app.get('/data', async (req, res) => {
    try {
        const data = await collection.find().toArray();
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});



//////////////////////////////for new clerk
app.get('/newrequests', async (req, res) => {
    try {
        const data = await collection.find({ Status: 'Approved By Housing Officer' }).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});


/////////// display data on miv screen
app.get('/clerk', async (req, res) => {
    try {
        const data = await collection.find({ Status: 'Approved By Housing Clerk' }).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});


// post miv approval  for MIV

app.get('/miv', async (req, res) => {
    try {
        const data = await collection.find({ Status: 'Approved By Warehouse Incharge' }).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

//////////// for rejected requests

app.get('/rejectedreqs', async (req, res) => {
    try {
        const data = await collection.find({ Status: 'Rejected' }).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

// Route to update status


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

//////////////////////////////////// for contractoritems

const itemSchema = new mongoose.Schema({
    Request_ID: String,
    itemsData: [
        {
            items: String,
            quantity: String,
            misc: String
        }
    ]
});


const ContractorItem = mongoose.model('ContractorItem', itemSchema);

app.post('/api/items', async (req, res) => {
    try {
        const { Request_ID, itemsData } = req.body;

        // Find if there is already a record with the same Request_ID
        const existingItem = await ContractorItem.findOne({ Request_ID });

        if (existingItem) {
            // Update the existing record
            existingItem.itemsData = itemsData;
            await existingItem.save();
        } else {
            // Create a new record
            const newItem = new ContractorItem({ Request_ID, itemsData });
            await newItem.save();
        }

        res.status(201).send('Items added successfully');
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/api/items/:Request_ID', async (req, res) => {
    try {
        const contractorItem = await ContractorItem.findOne({ Request_ID: req.params.Request_ID });

        if (!contractorItem) {
            return res.status(404).send('No items found for this Request_ID');
        }

        // Send the itemsData array directly
        res.status(200).json(contractorItem.itemsData);
    } catch (err) {
        res.status(500).send(err);
    }
});


//////////////////////

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

// Define a schema and model
const RejectionReasonSchema = new mongoose.Schema({
    reason: String,
});

const RejectionReason = mongoose.model('RejectionReason', RejectionReasonSchema);

// Handle form submission
app.post('/submit-reason', (req, res) => {
    const newReason = new RejectionReason({
        reason: req.body.reason,
    });

    newReason.save()
        .then(() => {
            console.log('Rejection reason saved successfully.');
            res.redirect('/clerk.html'); // Redirect to another page after saving
        })
        .catch((err) => {
            console.error('Error saving rejection reason:', err);
            res.status(500).send('Internal Server Error');
        });
});


/// fetch user from residentsinfo

app.get('/residents', async (req, res) => {
try {
await client.connect();
const database = client.db('RRMMS2');
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
const Approvedno = await collection.countDocuments({ ...query, Status: 'Approved By Warehouse Incharge' });
const Rejectedno = await collection.countDocuments({ ...query, Status: 'Rejected' });
const Resolvedno = await collection.countDocuments({ ...query, Status: 'Approved By Housing Officer' });
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
const PlumbingApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Plumbing', Status: 'Approved By Warehouse Incharge' });
const PlumbingRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Plumbing', Status: 'Rejected' });
const PlumbingResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Plumbing', Status: 'Approved By Housing Officer' });
const PlumbingPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Plumbing', Status: 'Pending' });

const RefrigeratorACApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Refrigerator/AC', Status: 'Approved By Warehouse Incharge' });
const RefrigeratorACRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Refrigerator/AC', Status: 'Rejected' });
const RefrigeratorACResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Refrigerator/AC', Status: 'Approved By Housing Officer' });
const RefrigeratorACPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Refrigerator/AC', Status: 'Pending' });

const MasonryApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Masonry', Status: 'Approved By Warehouse Incharge' });
const MasonryRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Masonry', Status: 'Rejected' });
const MasonryResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Masonry', Status: 'Approved By Housing Officer' });
const MasonryPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Masonry', Status: 'Pending' });

const TelephoneApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Telephone', Status: 'Approved By Warehouse Incharge' });
const TelephoneRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Telephone', Status: 'Rejected' });
const TelephoneResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Telephone', Status: 'Approved By Housing Officer' });
const TelephonePending = await collection.countDocuments({ ...query, Nature_of_Request: 'Telephone', Status: 'Pending' });

const CarpentryApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Carpentry', Status: 'Approved By Warehouse Incharge' });
const CarpentryRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Carpentry', Status: 'Rejected' });
const CarpentryResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Carpentry', Status: 'Approved By Housing Officer' });
const CarpentryPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Carpentry', Status: 'Pending' });

const ElectricityApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Electricity', Status: 'Approved By Warehouse Incharge' });
const ElectricityRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Electricity', Status: 'Rejected' });
const ElectricityResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Electricity', Status: 'Approved By Housing Officer' });
const ElectricityPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Electricity', Status: 'Pending' });

const FlooringApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Flooring', Status: 'Approved By Warehouse Incharge' });
const FlooringRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Flooring', Status: 'Rejected' });
const FlooringResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Flooring', Status: 'Approved By Housing Officer' });
const FlooringPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Flooring', Status: 'Pending' });

const PestApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Pest Control', Status: 'Approved By Warehouse Incharge' });
const PestRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Pest Control', Status: 'Rejected' });
const PestResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Pest Control', Status: 'Approved By Housing Officer' });
const PestPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Pest Control', Status: 'Pending' });

const CivilApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Civil', Status: 'Approved By Warehouse Incharge' });
const CivilRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Civil', Status: 'Rejected' });
const CivilResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Civil', Status: 'Approved By Housing Officer' });
const CivilPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Civil', Status: 'Pending' });

const MiscellaneousApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Miscellaneous', Status: 'Approved By Warehouse Incharge' });
const MiscellaneousRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Miscellaneous', Status: 'Rejected' });
const MiscellaneousResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Miscellaneous', Status: 'Approved By Housing Officer' });
const MiscellaneousPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Miscellaneous', Status: 'Pending' });

const SecurityApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Security System Installation', Status: 'Approved By Warehouse Incharge' });
const SecurityRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Security System Installation', Status: 'Rejected' });
const SecurityResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Security System Installation', Status: 'Approved By Housing Officer' });
const SecurityPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Security System Installation', Status: 'Pending' });

const GardeningApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Gardening', Status: 'Approved By Warehouse Incharge' });
const GardeningRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Gardening', Status: 'Rejected' });
const GardeningResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Gardening', Status: 'Approved By Housing Officer' });
const GardeningPending = await collection.countDocuments({ ...query, Nature_of_Request: 'Gardening', Status: 'Pending' });

const GutterApproved = await collection.countDocuments({ ...query, Nature_of_Request: 'Gutter', Status: 'Approved By Warehouse Incharge' });
const GutterRejected = await collection.countDocuments({ ...query, Nature_of_Request: 'Gutter', Status: 'Rejected' });
const GutterResolved = await collection.countDocuments({ ...query, Nature_of_Request: 'Gutter', Status: 'Approved By Housing Officer' });
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


