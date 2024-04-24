const { nodeResolve: resolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const terser = require("@rollup/plugin-terser");
const typescript = require("@rollup/plugin-typescript");
const pkg = require("./package.json");

const production = process.env.BUILD === "production";
const outputFile = pkg.main;
const plugins = production
    ? [
          terser({
              mangle: {
                  properties: {
                      regex: /^_/,
                      keep_quoted: true,
                      reserved: ["on", "once", "off"],
                  },
              },
              output: {
                  keep_quoted_props: true,
                  beautify: false,
                  comments: "/^!/",
              },
          }),
      ]
    : [];

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${
    pkg.license
}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;

let outro = pkg.name + " v" + pkg.version;
if (pkg.peerDependencies && pkg.peerDependencies["maptalks"]) {
    outro += `, requires maptalks@${pkg.peerDependencies.maptalks}.`;
}

outro = `typeof console !== 'undefined' && console.log('${outro}');`;

const basePlugins = [
    resolve({
        module: true,
        jsnext: true,
        main: true,
    }),
    commonjs(),
    typescript(),
];

module.exports = [
    {
        input: "src/index.js",
        external: ["maptalks", "@maptalks/gltf-layer", "turf"],
        plugins: basePlugins.concat(plugins),
        output: {
            globals: {
                maptalks: "maptalks",
                "@maptalks/gltf-layer": "maptalks",
                turf: "turf",
            },
            sourcemap: production ? false : "inline",
            format: "umd",
            name: "maptalks",
            banner: banner,
            outro: outro,
            extend: true,
            file: outputFile,
        },
    },
    {
        input: "src/index.js",
        plugins: basePlugins.concat(
            production
                ? [
                      terser({
                          output: { comments: "/^!/", beautify: true },
                          mangle: {
                              properties: {
                                  regex: /^_/,
                                  keep_quoted: true,
                              },
                          },
                      }),
                  ]
                : []
        ),
        external: ["maptalks", "@maptalks/gltf-layer", "turf"],
        output: {
            globals: {
                maptalks: "maptalks",
                "@maptalks/gltf-layer": "maptalks",
                turf: "turf",
            },
            sourcemap: false,
            format: "es",
            banner: banner,
            extend: true,
            name: "maptalks",
            outro: outro,
            file: pkg.module,
        },
    },
];
