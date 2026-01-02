import express from 'express';
import { createFlagControlClient } from '@flagcontrol/node';

const app = express();
const port = 3000;

// Initialize FlagControl SDK
// In a real scenario, you would provide a valid SDK key
const flagControl = createFlagControlClient({
    sdkKey: 'test-sdk-key',
    // For testing purposes, we might want to configure it to use local mode or a mock
});

app.get('/', async (req, res) => {
    try {
        // Example flag evaluation
        const isFeatureEnabled = flagControl.isEnabled('new-feature', {
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
