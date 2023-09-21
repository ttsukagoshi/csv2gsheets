// Generate 200,000 fake data entries (or the number specified by ENTRIES)
// in CSV in the `./faker/data/` directory using @faker-js/faker
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
// Variables
const OUTPUT_DIR = path.join(process.cwd(), 'faker', 'data'); // Directory to output CSV
const ENTRIES = 200000; // Number of entries to generate
function generateFakeData() {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }
    // Generate fake data
    const data = [
        ['ID', 'Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Zip'],
    ];
    for (let i = 0; i < ENTRIES; i++) {
        data.push([
            faker.string.uuid(),
            faker.person.fullName(),
            faker.internet.email(),
            faker.phone.number(),
            faker.location.streetAddress(),
            faker.location.city(),
            faker.location.state(),
            faker.location.zipCode(), // Zip
        ]);
    }
    // Save the data to a CSV file
    const timestamp = new Date().toISOString().replace(/:/g, '');
    const csv = data.map((row) => row.join(',')).join('\n');
    fs.writeFileSync(path.join(OUTPUT_DIR, `fake_data_${timestamp}.csv`), csv);
}
generateFakeData();
//# sourceMappingURL=faker.mjs.map