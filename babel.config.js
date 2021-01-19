module.exports = {
  env: {
    testing: {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" }}],
      ],
      "plugins": [
        "@babel/plugin-proposal-object-rest-spread",
      ],
    },
  },
};
