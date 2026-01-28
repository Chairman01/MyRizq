const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Usage: node scripts/export-users.js "your-mongodb-uri"
const uri = process.argv[2];

if (!uri) {
    console.error('Error: MongoDB Connection URI required.');
    console.error('Usage: node scripts/export-users.js "mongodb+srv://user:pass@cluster.mongodb.net"');
    process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await client.connect();
        console.log("Connected successfully.");

        // Based on your screenshot, the database name seems to be 'myRizq'
        const database = client.db('myRizq');
        const collection = database.collection('users');

        console.log("Fetching users...");
        const users = await collection.find({}).toArray();
        console.log(`Found ${users.length} user records.`);

        if (users.length === 0) {
            console.log("No users found. Exiting.");
            return;
        }

        // Fields to export (Customize as needed)
        const headers = ['_id', 'name', 'email', 'country', 'freeUser'];

        // Create CSV content
        const csvRows = [];

        // Add Header Row
        csvRows.push(headers.join(','));

        // Add Data Rows
        users.forEach(user => {
            const row = headers.map(header => {
                let val = user[header] || '';

                // Convert boolean/objects to string
                if (typeof val === 'boolean') val = val.toString();
                if (typeof val === 'object') val = JSON.stringify(val);

                // Escape quotes and handle commas
                val = String(val).replace(/"/g, '""');
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    val = `"${val}"`;
                }
                return val;
            });
            csvRows.push(row.join(','));
        });

        const outputPath = path.resolve(process.cwd(), 'users_export.csv');
        fs.writeFileSync(outputPath, csvRows.join('\n'));
        console.log(`✅ Data exported successfully to: ${outputPath}`);

    } catch (err) {
        console.error("An error occurred:", err);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
