#!/usr/bin/env node
import minimist from "minimist";
import { generateTypes } from "./generate";
import * as dotenv from "dotenv";

dotenv.config();

const args = minimist(process.argv.slice(2));
const outputPath = args.o || args.output || "./src/flagcontrol.d.ts";

const sdkKey = args.key || process.env.FLAGCONTROL_SDK_KEY;
const apiBaseUrl = args.apiBaseUrl || process.env.FLAGCONTROL_API_URL;

if (!sdkKey) {
    console.error("FLAGCONTROL_SDK_KEY environment variable or --key argument is required.");
    process.exit(1);
}

generateTypes({ sdkKey, apiBaseUrl }, outputPath).catch((err: any) => {
    console.error("Error generating types:", err);
    process.exit(1);
});
