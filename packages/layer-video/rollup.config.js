const { nodeResolve: resolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const terser = require("@rollup/plugin-terser");
const typescript = require("@rollup/plugin-typescript");
const pkg = require("./package.json");

const production = process.env.BUILD === "production";
const outputFile = pkg.main;
const plugins = [].concat(
    production
        ? [
              terser({
                  mangle: true,
                  output: {
                      keep_quoted_props: true,
                      beautify: false,
                      comments: "/^!/",
                  },
              }),
          ]
        : []
);

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${
    pkg.license
}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;

let outro = pkg.name + " v" + pkg.version;

outro = `typeof console !== 'undefined' && console.log('${outro}');`;

function glsl() {
    return {
        transform(code, id) {
            if (/\.vert$/.test(id) === false && /\.frag$/.test(id) === false && /\.glsl$/.test(id) === false) return null;
            let transformedCode = JSON.stringify(code.trim()
                .replace(/\r/g, '')
                .replace(/[ \t]*\/\/.*\n/g, '') // remove //
                .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
                .replace(/\n{2,}/g, '\n')); // # \n+ to \n;;
            transformedCode = `export default ${transformedCode};`;
            return {
                code: transformedCode,
                map: { mappings: '' }
            };
        }
    };
}

const basePlugins = [
    glsl(),
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
        input: "index.js",
        plugins: basePlugins.concat(plugins),
        external: ["maptalks", "@maptalks/gl"],
        output: {
            sourcemap: true,
            format: "umd",
            name: "maptalks",
            banner: banner,
            outro: outro,
            extend: true,
            globals: {
                "maptalks": "maptalks",
                "@maptalks/gl": "maptalks",
            },
            file: outputFile,
        },
    },
    {
        input: "index.js",
        plugins: basePlugins.concat(
            production
                ? [
                      terser({
                          output: { comments: "/^!/" },
                          mangle: true
                      }),
                  ]
                : []
        ),
        external: ["maptalks", "@maptalks/gl"],
        output: {
            sourcemap: true,
            format: "es",
            banner: banner,
            outro: outro,
            file: pkg.module,
        },
    },
];
