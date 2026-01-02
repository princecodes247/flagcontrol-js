import { describe, it, expect, afterEach } from 'vitest';
import { generateTypes } from './generate';
import * as fs from 'fs';
import * as path from 'path';

const TEST_OUTPUT_PATH = './test-flagcontrol.d.ts';

describe('Generator', () => {
    afterEach(() => {
        if (fs.existsSync(TEST_OUTPUT_PATH)) {
            // fs.unlinkSync(TEST_OUTPUT_PATH);
        }
    });

    it('should generate types for boolean flags', async () => {
        const mockFlags = [
            {
                key: 'test-bool-flag',
                type: 'boolean',
                variants: [true, false],
                defaults: [true],
            },
        ];

        await generateTypes({ sdkKey: 'test' }, TEST_OUTPUT_PATH, mockFlags);

        const content = fs.readFileSync(TEST_OUTPUT_PATH, 'utf-8');
        expect(content).toContain('"test-bool-flag": true | false;');
    });

    it('should generate types for string flags', async () => {
        const mockFlags = [
            {
                key: 'test-string-flag',
                type: 'string',
                variants: ['a', 'b'],
                defaults: ['a'],
            },
        ];

        await generateTypes({ sdkKey: 'test' }, TEST_OUTPUT_PATH, mockFlags);

        const content = fs.readFileSync(TEST_OUTPUT_PATH, 'utf-8');
        expect(content).toContain('"test-string-flag": "a" | "b" | ({} & string);');
    });

    it('should generate types for number flags', async () => {
        const mockFlags = [
            {
                key: 'test-number-flag',
                type: 'number',
                variants: [1, 2],
                defaults: [1],
            },
        ];

        await generateTypes({ sdkKey: 'test' }, TEST_OUTPUT_PATH, mockFlags);

        const content = fs.readFileSync(TEST_OUTPUT_PATH, 'utf-8');
        expect(content).toContain('"test-number-flag": 1 | 2 | ({} & number);');
    });

    it('should generate types for json flags', async () => {
        const mockFlags = [
            {
                key: 'test-json-flag',
                type: 'json',
                variants: [{ a: 1 }, { b: 2 }],
                defaults: [{ a: 1 }],
            },
        ];

        await generateTypes({ sdkKey: 'test' }, TEST_OUTPUT_PATH, mockFlags);

        const content = fs.readFileSync(TEST_OUTPUT_PATH, 'utf-8');
        expect(content).toContain('"test-json-flag": Record<string, unknown> | ({} & Record<string, unknown>);');
    });

    it('should append flagcontrol.d.ts if output path is a directory', async () => {
        const mockFlags = [
            {
                key: 'test-bool-flag',
                type: 'boolean',
                variants: [true, false],
                defaults: [true],
            },
        ];

        const dirPath = './test-output-dir';
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }

        try {
            await generateTypes({ sdkKey: 'test' }, dirPath, mockFlags);
            const expectedPath = path.join(dirPath, 'flagcontrol.d.ts');
            expect(fs.existsSync(expectedPath)).toBe(true);
            const content = fs.readFileSync(expectedPath, 'utf-8');
            expect(content).toContain('"test-bool-flag": true | false;');
        } finally {
            if (fs.existsSync(path.join(dirPath, 'flagcontrol.d.ts'))) {
                fs.unlinkSync(path.join(dirPath, 'flagcontrol.d.ts'));
            }
            if (fs.existsSync(dirPath)) {
                fs.rmdirSync(dirPath);
            }
        }
    });
});
