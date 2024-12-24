"use strict";

const fs = require("fs");
const readline = require("readline");

class Observable {
    constructor() {
        this.subscribers = [];
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    async notify(data) {
        for (const callback of this.subscribers) {
            await callback(data);
        }
    }
}

const wrapAsyncAbortable =
    (fn) =>
    (data, signal, timeout = 400) =>
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

const createLineIterator = async function* (filePath, signal, lineObservable) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    signal?.addEventListener("abort", () => {
        rl.close();
        fileStream.destroy();
    });

    let index = 0;
    for await (const line of rl) {
        if (signal?.aborted) {
            throw new Error("Operation aborted");
        }

        index++;
        console.log(`Reading line ${index} of ${filePath}: ${line}`);
        await lineObservable.notify({ line, filePath });

        yield line;
    }
};

const subscribeForEmailCheck = (lineObservable) => {
    let emailFound = false;

    lineObservable.subscribe(async ({ line, filePath }) => {
        if (emailFound) return;

        const result = await asyncEmailPredicate(line);
        if (result) {
            emailFound = true;
            console.log(`Email found in file ${filePath}: ${line}\n`);
        }
    });

    return () => emailFound;
};

const checkFilesForEmail = async (filePaths, signal, lineObservable) => {
    const results = [];

    for (const filePath of filePaths) {
        const isEmailFound = subscribeForEmailCheck(lineObservable);

        const lineIterator = createLineIterator(
            filePath,
            signal,
            lineObservable
        );
        for await (const line of lineIterator) {
            if (isEmailFound()) break;
        }

        results.push({ filePath, result: isEmailFound() });
    }

    results.forEach(({ filePath, result }) => {
        if (result) {
            console.log(`${filePath} contains an email address`);
        } else {
            console.log(`${filePath} does not contain an email address`);
        }
    });
};

// Examples
(async () => {
    const filePaths = [
        "../tests/file1.txt",
        "../tests/file2.txt",
        "../tests/file3.txt",
    ];
    const controller = new AbortController();
    const { signal } = controller;

    const lineObservable = new Observable();

    // setTimeout(() => controller.abort(), 5000);

    try {
        await checkFilesForEmail(filePaths, signal, lineObservable);
    } catch (err) {
        console.error("Error during file processing:", err.message);
    }
})();
