const pkg = require("./package.json");
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${
    pkg.license
}\n * (c) 2016-${new Date().getFullYear()} maptalks.com\n */`;

const production = process.env.BUILD === "production";

const plugins = [
    nodeResolve({
        module: true,
        jsnext: true,
        main: true,
    }),
    commonjs(),
];

if (production) {
    plugins.push(
        terser({
            mangle: {
                properties: {
                    regex: /^_/,
                    keep_quoted: true
                },
            },
            keep_classnames: true,
            output: {
                comments: "/^!/"
            },
        })
    );
}

module.exports = [
    {
        input: "./src/index.js",
        external: ["fast-deep-equal"],
        output: {
            sourcemap: false,
            banner,
            format: "es",
            file: pkg.module
        },
        plugins,
    }
];
