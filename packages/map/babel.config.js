module.exports = {
  "presets": [
    ["@babel/env", {
      "loose": true,
      "modules": false,
      "exclude": [
        "transform-destructuring",
        "transform-spread",
        "transform-parameters"
      ]
    }]
  ],
  "plugins": [
  ],
  "ignore": [
    "dist/*.js"
  ],
  "comments": false
};
