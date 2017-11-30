const exec = require('child_process').exec;

const hugo = () => {
  return new Promise((resolve, reject) => {
    exec('hugo', (err, stdout) => {
      if (err) { return reject(err); }
      return resolve(stdout);
    });
  });
};

module.exports = hugo;
