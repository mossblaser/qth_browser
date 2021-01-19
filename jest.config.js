module.exports = {
  // *Do* build the Qth library (since it uses ES6 imports and Node doesn't
  // like these yet...
  transformIgnorePatterns: [
    "node_modules/(?!(qth)/)",
  ],
};
