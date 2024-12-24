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

const measureExecutionTime = (fn, label) => {
    return (...args) => {
        const start = performance.now();
        return fn(...args)
            .then((result) => {
                const end = performance.now();
                console.log(
                    `${label} execution time: ${(end - start).toFixed(2)} ms`
                );
                return result;
            })
            .catch((err) => {
                console.error(`${label} encountered an error:`, err);
                throw err;
            });
    };
};
// ######################################################################### //

const asyncSequentialSome = function (predicate) {
    let promise = Promise.resolve(false);

    for (let i = 0; i < this.length; i++) {
        promise = promise.then((flag) => {
            if (flag) return true;
            return predicate(this[i]);
        });
    }

    return promise;
};

const asyncParallelSome = function (predicate) {
    const promises = this.map((item) => predicate(item));

    return new Promise((resolve, reject) => {
        let resolved = false;

        promises.forEach((p) => {
            p.then((result) => {
                if (result && !resolved) {
                    resolved = true;
                    resolve(true);
                }
            }).catch((err) => {
                reject(new Error("Some promise rejected"));
            });
        });

        Promise.allSettled(promises).then(() => {
            if (!resolved) resolve(false);
        });
    });
};

// Examples
const x = [1, 2, 3, 4, 5];

const asyncImpossiblePredicate = wrapAsync((data, cb) => cb(null, data >= 10));
const asyncPossiblePredicate = wrapAsync((data, cb) => cb(null, data == 2));

const measuredAsyncSequentialSomeImpossible = measureExecutionTime(
    asyncSequentialSome.bind(x, asyncImpossiblePredicate),
    "asyncSequentialSome | asyncImpossiblePredicate"
);

const measuredAsyncSequentialSomePossible = measureExecutionTime(
    asyncSequentialSome.bind(x, asyncPossiblePredicate),
    "asyncSequentialSome | asyncPossiblePredicate"
);

const measuredAsyncParallelSomeImpossible = measureExecutionTime(
    asyncParallelSome.bind(x, asyncImpossiblePredicate),
    "asyncParallelSome | asyncImpossiblePredicate"
);

const measuredAsyncParallelSomePossible = measureExecutionTime(
    asyncParallelSome.bind(x, asyncPossiblePredicate),
    "asyncParallelSome | asyncPossiblePredicate"
);

measuredAsyncSequentialSomeImpossible()
    .then((result) => {
        console.log(
            "asyncSequentialSome | asyncImpossiblePredicate: ",
            "result: " + result,
            "\n"
        );
        return measuredAsyncSequentialSomePossible();
    })
    .then((result) => {
        console.log(
            "asyncSequentialSome | asyncPossiblePredicate: ",
            "result: " + result,
            "\n"
        );
        return measuredAsyncParallelSomeImpossible();
    })
    .then((result) => {
        console.log(
            "asyncParallelSome | asyncImpossiblePredicate: ",
            "result: " + result,
            "\n"
        );
        return measuredAsyncParallelSomePossible();
    })
    .then((result) => {
        console.log(
            "asyncParallelSome | asyncPossiblePredicate: ",
            "result: " + result,
            "\n"
        );
    })
    .catch((err) => {
        console.error("Error:", err);
    });
