import 'dotenv/config';
import express from 'express';
import { createFlagControlClient } from '@flagcontrol/node';

const app = express();
const port = 3005;

// Initialize FlagControl SDK
const flagControl = createFlagControlClient({
    sdkKey: process.env.FLAGCONTROL_SDK_KEY || 'test-sdk-key',
});

app.get('/', async (req, res) => {
    try {
        // Example flag evaluation
        const isFeatureEnabled = flagControl.get("prince-sss", {
            userId: 'user-123',
        });

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
