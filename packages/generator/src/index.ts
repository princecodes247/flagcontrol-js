#!/usr/bin/env node
import { generateTypes } from "./generate";
import * as dotenv from "dotenv";

dotenv.config();
const args = process.argv.slice(2);
const outputPath = args[0] || "./src/flagcontrol.d.ts";

const sdkKey = process.env.FLAGCONTROL_SDK_KEY;
const apiBaseUrl = process.env.FLAGCONTROL_API_URL;

if (!sdkKey) {
    console.error("Error: FLAGCONTROL_SDK_KEY environment variable is required.");
    process.exit(1);
}

generateTypes({ sdkKey, apiBaseUrl }, outputPath).catch((err) => {
    console.error("Error generating types:", err);
    process.exit(1);
});
