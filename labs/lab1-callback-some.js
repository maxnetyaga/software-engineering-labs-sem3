"use strict";

const wrapAsync =
    (fn) =>
    (...args) =>
        setTimeout(() => fn(...args), Math.floor(Math.random() * 1000));

const measureExecutionTime = (fn, label, cb) => {
    const start = performance.now();

    fn((err, result) => {
        if (err) {
            return cb(err);
        }

        const end = performance.now();
        console.log(`${label} execution time: ${(end - start).toFixed(2)} ms`);

        cb(null, result);
    });
};
// ######################################################################### //

const asyncSequentialSome = function (predicate, cb) {
    let id = 0;

    const next = () => {
        if (id < this.length) {
            predicate(this[id], (err, flag) => {
                if (err) cb(err);

                if (flag) {
                    cb(null, true);
                } else {
                    id += 1;
                    next();
                }
            });
        } else cb(null, false);
    };

    next();
};

// Examples
const x = [1, 2, 3, 4, 5];

const asyncImpossiblePredicate = wrapAsync((data, cb) => cb(null, data >= 10));
const asyncPossiblePredicate = wrapAsync((data, cb) => cb(null, data == 2));

measureExecutionTime(
    asyncSequentialSome.bind(x, asyncImpossiblePredicate),
    "asyncSequentialSome | asyncImpossiblePredicate",
    (err, result) =>
        console.log(
            "asyncSequentialSome | asyncImpossiblePredicate: ",
            "error: " + err,
            " # ",
            "result: " + result
        )
);

measureExecutionTime(
    asyncSequentialSome.bind(x, asyncPossiblePredicate),
    "asyncSequentialSome | asyncPossiblePredicate",
    (err, result) =>
        console.log(
            "asyncSequentialSome | asyncPossiblePredicate: ",
            "error: " + err,
            " # ",
            "result: " + result
        )
);
