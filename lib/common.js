function promise(cb, val1, val2) {
  return new Promise((resolve, reject) => {
    return cb(resolve, reject, val1, val2);
  });
}

exports.promise = promise;
