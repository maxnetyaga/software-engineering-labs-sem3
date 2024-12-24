"use strict";

const fs = require("fs");
const readline = require("readline");

// const measureExecutionTime = async (fn, label) => {
//     const start = performance.now();
//     try {
//         const result = await fn();
//         const end = performance.now();
//         console.log(`${label} execution time: ${(end - start).toFixed(2)} ms`);
//         return result;
//     } catch (err) {
//         console.error(`${label} encountered an error:`, err);
//         throw err;
//     }
// };

const wrapAsyncAbortable = (fn) => (data, signal, timeout=400) =>
    new Promise((resolve, reject) => {
        if (signal?.aborted) {
            return reject(new Error("Operation aborted"));
        }

        const timer = setTimeout(() => {
            fn(data, (err, result) => {
                if (signal?.aborted) {
                    clearTimeout(timer);
                    return reject(new Error("Operation aborted"));
                }
                if (err) reject(err);
                else resolve(result);
            });
        }, timeout);

        signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new Error("Operation aborted"));
        });
    });

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const asyncEmailPredicate = wrapAsyncAbortable((line, cb) => {
    cb(null, emailRegex.test(line));
});
// ######################################################################### //

const readFileLinesAsync = async function* (filePath, signal) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    signal?.addEventListener("abort", () => {
        rl.close();
        fileStream.destroy();
    });

    for await (const line of rl) {
        if (signal?.aborted) {
            throw new Error("Operation aborted");
        }
        yield line;
    }
};

const checkForEmail = async (filePath, signal) => {
    const lineIterator = readFileLinesAsync(filePath, signal);
    let index = 0;

    for await (const line of lineIterator) {
        index++;
        console.log(`Verifying ${line} of ${filePath}`);
        const result = await asyncEmailPredicate(line, signal);

        if (result) {
            console.log(
                `Email found in file ${filePath} at line ${index}: ${line}\n`
            );
            return true;
        }
    }

    return false;
};

const checkFilesForEmail = async (filePaths, signal) => {
    const filePromises = filePaths.map((filePath) =>
        checkForEmail(filePath, signal).then((result) => ({
            filePath,
            result,
        }))
    );

    const results = await Promise.all(filePromises);

    results.forEach(({ filePath, result }) => {
        if (result) {
            console.log(`${filePath} contains an email address`);
        } else {
            console.log(`${filePath} does not contain an email address`);
        }
    });
};

(async () => {
    const filePaths = [
        "../tests/file1.txt",
        "../tests/file2.txt",
        "../tests/file3.txt",
    ];
    const controller = new AbortController();
    const { signal } = controller;

    // setTimeout(() => controller.abort(), 5000);

    try {
        await checkFilesForEmail(filePaths, signal);
    } catch (err) {
        console.error("Error during file processing:", err.message);
    }
})();
