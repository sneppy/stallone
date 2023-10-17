import path from "path"
import alias from "@rollup/plugin-alias"
import nodeResolve from "@rollup/plugin-node-resolve"
import pkg from "./package.json"

export default [
    {
        input: pkg.input,
        plugins: [
            alias({
                entries: [
                    {
                        find: "vue",
                        replacement: path.resolve(__dirname, "src/vue.js"),
                    },
                ],
            }),
            nodeResolve(),
        ],
        output: [
            {
                file: pkg.main,
                name: "Stallone",
                format: "umd",
                sourcemap: true,
            },
            {
                file: pkg.module,
                format: "es",
            },
        ],
    },
    {
        input: pkg.input,
        plugins: [nodeResolve()],
        external: ["vue"],
        output: [
            {
                file: "vue/index.js",
                format: "es",
            },
        ],
    },
]
