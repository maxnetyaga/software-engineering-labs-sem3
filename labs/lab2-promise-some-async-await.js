"use strict";

const wrapAsync =
    (fn) =>
    (...args) =>
        new Promise((resolve, reject) => {
            setTimeout(() => {
                fn(...args, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
                // }, Math.floor(Math.random() * 500));
            }, 100);
        });

const measureExecutionTime = async (fn, label, ...args) => {
    const start = performance.now();
    try {
        const result = await fn(...args);
        const end = performance.now();
        console.log(`${label} execution time: ${(end - start).toFixed(2)} ms`);
        return result;
    } catch (err) {
        console.error(`${label} encountered an error:`, err);
        throw err;
    }
};

// ######################################################################### //

const asyncSequentialSome = async function (predicate) {
    for (let i = 0; i < this.length; i++) {
        if (await predicate(this[i])) {
            return true;
        }
    }
    return false;
};

const asyncParallelSome = async function (predicate) {
    const promises = this.map((item) => predicate(item));
    let resolved = false;

    try {
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
    } catch {
        throw new Error("Some promise rejected");
    }

    return resolved;
};

// Examples
const x = [1, 2, 3, 4, 5];

const asyncImpossiblePredicate = wrapAsync((data, cb) => cb(null, data >= 10));
const asyncPossiblePredicate = wrapAsync((data, cb) => cb(null, data == 2));

(async () => {
    try {
        const result1 = await measureExecutionTime(
            asyncSequentialSome.bind(x, asyncImpossiblePredicate),
            "asyncSequentialSome | asyncImpossiblePredicate"
        );
        console.log(
            "asyncSequentialSome | asyncImpossiblePredicate: ",
            "result: " + result1,
            "\n"
        );

        const result2 = await measureExecutionTime(
            asyncSequentialSome.bind(x, asyncPossiblePredicate),
            "asyncSequentialSome | asyncPossiblePredicate"
        );
        console.log(
            "asyncSequentialSome | asyncPossiblePredicate: ",
            "result: " + result2,
            "\n"
        );

        const result3 = await measureExecutionTime(
            asyncParallelSome.bind(x, asyncImpossiblePredicate),
            "asyncParallelSome | asyncImpossiblePredicate"
        );
        console.log(
            "asyncParallelSome | asyncImpossiblePredicate: ",
            "result: " + result3,
            "\n"
        );

        const result4 = await measureExecutionTime(
            asyncParallelSome.bind(x, asyncPossiblePredicate),
            "asyncParallelSome | asyncPossiblePredicate"
        );
        console.log(
            "asyncParallelSome | asyncPossiblePredicate: ",
            "result: " + result4,
            "\n"
        );
    } catch (err) {
        console.error("Error:", err);
    }
})();
