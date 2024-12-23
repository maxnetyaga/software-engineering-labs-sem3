# Tasks

## Task 0
* Prepare GitHub repo for Tasks

## Task 1
* Choose array fn (map/filter/filterMap/some/find/findIndex)
* Prepare its callback based async counterpart
* Prepare demo cases for the usage
* Add new on-demend feature during review
e.g.: Add support for debounce (if the task took less then X time to
complete -- add an additional execution delya)

## Task 2
* Prepare promise based alternative
* Write use cases for the promise based solution
* Write use cases for the async-await
* Add new on-demend feature during review
e.g.: Add support for parallelism

Note: for technologies that do not have the native Future-like async functionalities
You may combine Task 1 and 2 into a single Task that will showcase the idiomatic way of handling concurrency.

## Task 3
* Integrate AbortController or other Cancallable approach

## Task 4 (Stream/AsyncIterator/Alternative) -- Ongoing processing of large data sets that do not fit in memory

## Task 5 (Observable/EventEmitter/Alternative) -- Reactive message based communication between entities

```
// Sync Ops
// if, while, sum, arithemetic
//
// Async Ops
// API, Data Base select, OS access, FS
//
//
// NOTE; this are conceptual examples, not a valid Node.js code

const filesToRead = ["a.txt", "b.txt"];

const a = fs.readFileSync(filesToRead[1]);
const b = fs.readFileSync(filesToRead[2]);

// Issues
// * error handling
// * parralelisation

setTimeout(() => {}, 1000);

// Task Queue
// Micro / Macro

// Either/Optional
asyncfns((err, ...data) => {
  if (err !== null) {
    // Tprcess error
    return;
  }
});

// Callback hell
//
let cb = () => {};
asyncfns1((err, ...data) => {
  if (err !== null) {
    return cb(err);
  }

  asyncfns2(data, (err, ...data) => {
    if (err !== null) {
      // Tprcess error
      return cb(err);
    }

    cb(data);
  });
});

// Compose
//
asyncCompose(asyncfns1, asyncfns2, cb);

// Task 1 expected example

asyncMap(
  [1, 2, 3],
  (data, cb) => {
    setTimeout(() => {
      cb(null, data * 2);
    }, 1000);
  },
  (err, result) => {
    console.log(err, result); // null [2, 4, 6]
  },
);
```
