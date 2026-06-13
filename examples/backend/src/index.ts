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

        // await flagControl.addToList("testq", {
        //     key: "user-123"
        // })

        // await flagControl.removeFromList("testq","user-123")

        // Example flag evaluation
        flagControl.setContext
        const isPaymentAvailable = flags.get("dark-mode");
        console.log({ isPaymentAvailable })
        res.json({
            message: 'Hello from Backend!',
            featureEnabled: isPaymentAvailable,
        });
    } catch (error) {
        console.error('Error evaluating flag:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Backend app listening at http://localhost:${port}`);
});
