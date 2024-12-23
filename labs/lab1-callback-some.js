const wrapAsync =
    (fn) =>
    (...args) =>
        setTimeout(() => fn(...args), Math.floor(Math.random() * 1000));

// ######################################################################### //

Array.prototype.asyncSequentialSome = function (predicate, cb) {

    let id = 0;

    const next = () => {
        if (id < this.length) {
            predicate(this[id], (err, flag) => {
                if (err) cb(err);

                if (flag) {
                    cb(null, true);
                } else {
                    console.log(id);
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

x.asyncSequentialSome(asyncImpossiblePredicate, (err, result) => {
    console.log(
        "asyncSequentialSome | asyncImpossiblePredicate: ",
        "error: " + err,
        " # ",
        "result: " + result
    );
});

x.asyncSequentialSome(asyncPossiblePredicate, (err, result) => {
    console.log(
        "asyncSequentialSome | asyncPossiblePredicate: ",
        "error: " + err,
        " # ",
        "result: " + result
    );
});
