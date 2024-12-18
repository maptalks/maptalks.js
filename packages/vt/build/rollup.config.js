const { nodeResolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const terser = require("@rollup/plugin-terser");
const typescript = require("@rollup/plugin-typescript");
const glslMinify = require("@maptalks/rollup-plugin-glsl-minify");
const replace = require("@rollup/plugin-replace");
const { dts } = require("rollup-plugin-dts");
const pkg = require("../package.json");

const production = process.env.BUILD === "production";
const outputFile = pkg.main;
const reserves = ["on", "once", "off", "_drawTiles"];
const plugins = production
    ? [
          terser({
              module: true,
              mangle: {
                  properties: {
                      regex: /^_/,
                      keep_quoted: true,
                      reserved: reserves,
                  },
              },
              output: {
                  beautify: true,
                  comments: "/^!/",
              },
          }),
      ]
    : [];

const pluginsWorker = production
    ? [
          terser({
              module: true,
              mangle: {
                  properties: {
                      regex: /^_/,
                      keep_quoted: true,
                      reserved: reserves,
                  },
              },
              output: {
                  beautify: false,
              },
          }),
      ]
    : [];
//worker.js中的global可能被webpack替换为全局变量，造成worker代码执行失败，所以这里统一把typeof global替换为typeof undefined
function removeGlobal() {
    return {
        transform(code, id) {
            if (id.indexOf("worker.js") === -1) return null;
            const commonjsCode = /typeof global/g;
            var transformedCode = code.replace(
                commonjsCode,
                "typeof undefined"
            );
            return {
                code: transformedCode,
                map: { mappings: "" },
            };
        },
    };
}

function transformBackQuote() {
    return {
        renderChunk(code) {
            // if (/\.js/.test(id) === false) return null;
            // var transformedCode = 'const code = `' + code.replace(/`/g, '\\`') + '`';
            code = code
                .substring("export default ".length)
                .replace(/\\/g, "\\\\")
                .replace(/`/g, "\\`")
                .replace(/\$\{/g, "${e}");
            var transformedCode =
                'const e = "${"; const code = `' + code + "`;\n";
            transformedCode += "export default code";
            return {
                code: transformedCode,
                map: { mappings: "" },
            };
        },
    };
}

function glsl() {
    return {
        transform(code, id) {
            if (
                /\.vert$/.test(id) === false &&
                /\.frag$/.test(id) === false &&
                /\.glsl$/.test(id) === false
            )
                return null;
            var transformedCode = code
                .replace(/\r{1,}/g, "\\n") // # \r+ to \n
                .replace(/[ \t]*\/\/.*\n/g, "") // remove //
                .replace(/[ \t]*\/\*[\s\S]*?\*\//g, "") // remove /* */
                .replace(/\n{1,}/g, "\\n") // # \n+ to \n
                .replace(/"/g, '\\"');
            transformedCode = `export default "${transformedCode}";`;
            return {
                code: transformedCode,
                map: { mappings: "" },
            };
        },
    };
}

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${
    pkg.license
}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;
const outro = `typeof console !== 'undefined' && console.log('${pkg.name} v${pkg.version}');`;

const globalFunc = `
const getGlobal = function () {
  if (typeof globalThis !== 'undefined') { return globalThis; }
  if (typeof self !== "undefined") { return self; }
  if (typeof window !== "undefined") { return window; }
  if (typeof global !== "undefined") { return global; }
};`

module.exports = [
    {
        input: "src/packer/index.js",
        plugins: [
            json(),
            nodeResolve({
                mainFields: ["module", "main"],
            }),
            commonjs(),
            replace({
                // 'this.exports = this.exports || {}': '',
                "(function (exports) {": "export function packerExport(exports) {"+ globalFunc + ";if (getGlobal()['maptalks_vt_packers']) return;\n",
                "})(this.exports = this.exports || {});": "getGlobal()['maptalks_vt_packers'] = exports;}\npackerExport({});",
                preventAssignment: false,
                delimiters: ["", ""],
            }),
        ]
            .concat(pluginsWorker),
            // .concat([transformBackQuote()]),
        output: {
            strict: false,
            format: "iife",
            name: "exports",
            globals: ["exports"],
            extend: true,
            file: "build/packer.js"
            // footer: ``
        },
    },
    {
        input: "src/worker/index.js",
        external: ["maptalks"],
        plugins: [
            json(),
            nodeResolve({
                mainFields: ["module", "main"],
            }),
            commonjs(),
            replace({
                // 'this.exports = this.exports || {}': '',
                "(function (exports) {": "function (exports) {",
                "})(this.exports = this.exports || {});": "}",
                preventAssignment: false,
                delimiters: ["", ""],
            }),
        ]
            .concat(pluginsWorker)
            .concat([transformBackQuote()]),
        output: {
            strict: false,
            format: "iife",
            name: "exports",
            globals: ["exports"],
            extend: true,
            file: "build/worker.js",
            banner: `export default `,
            // footer: ``
        },
    },
    {
        input: "./build/index.js",
        external: ["maptalks", "@maptalks/gl"],
        output: {
            globals: {
                maptalks: "maptalks",
                "@maptalks/gl": "maptalks",
            },
            banner,
            outro,
            extend: true,
            name: "maptalks",
            file: outputFile,
            format: "umd",
            sourcemap: true
        },
        plugins: [
            json(),
            production
                ? glslMinify({
                      commons: ["src/layer/plugins/painters/includes"],
                  })
                : glsl(),
            nodeResolve({
                mainFields: ["module", "main"],
            }),
            commonjs(),
            typescript(),
            removeGlobal(),
        ].concat(plugins),
    },
    {
        input: "./build/index.js",
        external: [
            // point-geometry中因为调用了 _开头的方法，所以不能包含在external里，否则会被错误的混淆
            "maptalks",
            "@maptalks/gl",
            "@mapbox/vector-tile",
            "@maptalks/feature-filter",
            "@maptalks/function-type",
            "@maptalks/geojson-bbox",
            "@maptalks/tbn-packer",
            "@maptalks/vt-plugin",
            "animation-easings",
            "color",
            "earcut",
            "fast-deep-equal",
            "geojson-vt",
            "gl-matrix",
            "pbf",
            "quickselect",
            "rbush",
            "vt-pbf",
        ],
        output: {
            globals: {
                maptalks: "maptalks",
                "@maptalks/gl": "maptalks",
            },
            banner,
            outro,
            extend: true,
            name: "maptalks",
            file: pkg.module,
            format: "es",
            sourcemap: true
        },
        plugins: [
            json(),
            production
                ? glslMinify({
                      commons: ["src/layer/plugins/painters/includes"],
                  })
                : glsl(),
            nodeResolve({
                mainFields: ["module", "main"],
            }),
            commonjs(),
            typescript(),
            removeGlobal(),
        ].concat(plugins),
        watch: {
            include: "build/**/*.js",
        },
    },
];
if (production) {
    module.exports.push({
        input: './dist/layer/types.d.ts',
        plugins: [dts()],
        output: [
            {
                'sourcemap': true,
                'format': 'es',
                'name': 'maptalks',
                banner,
                'file': pkg['types']
            }
        ]
    });
}
