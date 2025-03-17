import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Helper function to format date consistently for PV Live API
function formatDate(date) {
    // Ensure we're working with a Date object
    const d = new Date(date);
    // Format as YYYY-MM-DDTHH:mm:ssZ (ISO8601 with Z suffix for UTC)
    return d.toISOString().slice(0, 19) + 'Z';
}

// Middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Proxy endpoint for solar data
app.get('/api/solar', async (req, res) => {
    console.log('Solar API request received:', req.query);
    try {
        // Get start and end times from query parameters or default to last 24 hours
        let { start, end } = req.query;
        
        if (!start || !end) {
            const now = new Date();
            const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
            end = now.toISOString().split('.')[0] + 'Z';
            start = twentyFourHoursAgo.toISOString().split('.')[0] + 'Z';
        }
        
        // Using GSP ID 0 for national solar generation data
        const url = `https://api.pvlive.uk/pvlive/api/v4/gsp/0?start=${start}&end=${end}`;
        console.log('Fetching solar data from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`PV Live API responded with ${response.status}`);
        }

        const data = await response.json();
        
        // Add detailed logging
        console.log('Solar API response:', {
            endpoint: 'gsp/0 (national)',
            requestedTimeRange: { start, end },
            metaData: data.meta,
            dataPoints: data.data.length,
            allDataPoints: data.data.map(([gsp, time, gen]) => ({
                time: new Date(time).toISOString(),
                generation: gen
            }))
        });

        // Return the data as-is
        res.json(data);
    } catch (error) {
        console.error('Solar API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for generation data
app.get('/api/generation', async (req, res) => {
    try {
        const url = 'https://data.elexon.co.uk/bmrs/api/v1/generation/outturn/summary?includeNegativeGeneration=true&format=json';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Elexon API responded with ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Generation API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
});

// Catch-all handler for undefined routes
app.use((req, res) => {
    console.log('404 for route:', req.url);
    res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Available routes:');
    console.log('- /api/solar');
    console.log('- /api/generation');
});
