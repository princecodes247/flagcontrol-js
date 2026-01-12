import 'dotenv/config';
import express from 'express';
import { createFlagControlClient } from '@flagcontrol/node';

const app = express();
const port = 3005;

// Initialize FlagControl SDK
const flagControl = createFlagControlClient({
    apiBaseUrl: process.env.FLAGCONTROL_API_URL || 'https://api.flagcontrol.com/v1',
    sdkKey: process.env.FLAGCONTROL_SDK_KEY || 'test-sdk-key',
    pollingIntervalMs: 50000,
});

app.get('/', async (req, res) => {
    try {

        const flags = flagControl.forContext({
            id: 'user-123',
        });

        // Example flag evaluation
        const isFeatureEnabled = flags.get("aasd");
        console.log({ isFeatureEnabled })
        res.json({
            message: 'Hello from Backend!',
            featureEnabled: isFeatureEnabled,
        });
    } catch (error) {
        console.error('Error evaluating flag:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Backend app listening at http://localhost:${port}`);
});
