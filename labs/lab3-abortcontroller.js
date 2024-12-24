"use strict";

const measureExecutionTime = async (fn, label) => {
    const start = performance.now();
    try {
        const result = await fn();
        const end = performance.now();
        console.log(`${label} execution time: ${(end - start).toFixed(2)} ms`);
        return result;
    } catch (err) {
        console.error(`${label} encountered an error:`, err);
        throw err;
    }
};

const wrapAsyncAbortable = (fn) => (data, signal) =>
    new Promise((resolve, reject) => {
        if (signal?.aborted) {
            return reject(new Error("Operation aborted"));
        }

        const timeout = setTimeout(() => {
            fn(data, (err, result) => {
                if (signal?.aborted) {
                    clearTimeout(timeout);
                    return reject(new Error("Operation aborted"));
                }
                if (err) reject(err);
                else resolve(result);
            });
        }, 100);

        signal?.addEventListener("abort", () => {
            clearTimeout(timeout);
            reject(new Error("Operation aborted"));
        });
    });
// ######################################################################### //

const asyncSequentialSome = async function (predicate, signal) {
    for (let i = 0; i < this.length; i++) {
        if (await predicate(this[i], signal)) {
            return true;
        }
    }
    return false;
};

const asyncParallelSome = async function (predicate, signal) {
    const promises = this.map((item) => predicate(item, signal));
    let resolved = false;

    await Promise.all(
        promises.map((p) =>
            p.then((result) => {
                if (result && !resolved) {
                    resolved = true;
                    return true;
                }
            })
        )
    );

    return resolved;
};

// Examples
const x = [1, 2, 3, 4, 5];

const asyncImpossiblePredicate = wrapAsyncAbortable((data, cb) =>
    cb(null, data >= 10)
);
const asyncPossiblePredicate = wrapAsyncAbortable((data, cb) =>
    cb(null, data == 2)
);

(async () => {
    const controller = new AbortController();
    const { signal } = controller;

    setTimeout(() => controller.abort(), 900);

    try {
        const result1 = await measureExecutionTime(
            asyncSequentialSome.bind(x, asyncImpossiblePredicate, signal),
            "asyncSequentialSome | asyncImpossiblePredicate"
        );
        console.log(
            "asyncSequentialSome | asyncImpossiblePredicate: ",
            "result: " + result1,
            "\n"
        );
    } catch (err) {
        console.error(
            "Error in asyncSequentialSome | asyncImpossiblePredicate:",
            err.message
        );
    }

    try {
        const result2 = await measureExecutionTime(
            asyncSequentialSome.bind(x, asyncPossiblePredicate, signal),
            "asyncSequentialSome | asyncPossiblePredicate"
        );
        console.log(
            "asyncSequentialSome | asyncPossiblePredicate: ",
            "result: " + result2,
            "\n"
        );
    } catch (err) {
        console.error(
            "Error in asyncSequentialSome | asyncPossiblePredicate:",
            err.message
        );
    }

    try {
        const result3 = await measureExecutionTime(
            asyncParallelSome.bind(x, asyncImpossiblePredicate, signal),
            "asyncParallelSome | asyncImpossiblePredicate"
        );
        console.log(
            "asyncParallelSome | asyncImpossiblePredicate: ",
            "result: " + result3,
            "\n"
        );
    } catch (err) {
        console.error(
            "Error in asyncParallelSome | asyncImpossiblePredicate:",
            err.message
        );
    }

    try {
        const result4 = await measureExecutionTime(
            asyncParallelSome.bind(x, asyncPossiblePredicate, signal),
            "asyncParallelSome | asyncPossiblePredicate"
        );
        console.log(
            "asyncParallelSome | asyncPossiblePredicate: ",
            "result: " + result4,
            "\n"
        );
    } catch (err) {
        console.error(
            "Error in asyncParallelSome | asyncPossiblePredicate:",
            err.message
        );
    }
})();
