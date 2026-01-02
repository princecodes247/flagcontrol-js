import { createFlagControlClient } from "./client";

// Mock config
const config = { sdkKey: "my-sdk-key" };


export type AppFlags = {
    "new-checkout-flow": false | true;
    "hero-banner-color": "blue" | "red" | "green";
    "max-items-in-cart": 10 | 50 | ({} & number);
};

// Initialize client
const client = createFlagControlClient<AppFlags>(config);

const isCheckoutNew = client.get("new-checkout-flow", {}, false);
console.log("New Checkout Flow:", isCheckoutNew);

const bannerColor = client.get("hero-banner-color", {}, "green");
console.log("Banner Color:", bannerColor);

// 3. Number flag
const maxItems = client.get("max-items-in-cart", {}, 5039);
console.log("Max Items:", maxItems);

// 4. Error case - invalid flag
// @ts-expect-error
const invalid = client.get("invalid-flag", {}, true); // Error: Argument of type '"invalid-flag"' is not assignable...
