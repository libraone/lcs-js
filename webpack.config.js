const path = require('path')
const node_externals = require('webpack-node-externals')

const TARGETS = ['lib']
const PLATFORMS = ['web', 'node']

module.exports = function (env) {
    env = env || {}

    const cfg_common = {
        mode: 'production',
        module: {
            rules: [
                { test: /\.tsx?$/, loader: "ts-loader" }
            ]
        },
        devtool: false,
        externals: node_externals(),
    }

    const target = env.target || 'lib'
    const platform = env.platform || 'web'

    if (TARGETS.indexOf(target) < 0) {
        throw new Error(`target must be one of [${TARGETS.join(', ')}]`)
    }
    if (PLATFORMS.indexOf(platform) < 0) {
        throw new Error(`platform must be one of [${PLATFORMS.join(', ')}]`)
    }

    let cfg = Object.assign({}, cfg_common, {
        entry: '',
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
            alias: {
                app: path.resolve(__dirname, 'src'),
                platform: path.resolve(__dirname, 'src', 'platform', platform),
            }
        },
        output: {
            filename: '',
            path: path.resolve(__dirname, 'dist'),
            libraryTarget: 'umd',
            globalObject: 'this',
            library: '',
        },
        target: platform,
    })

    if (target == 'lib') {
        cfg['entry'] = './src/index.ts'
        cfg['output']['filename'] = `index.js`
        cfg.output.library = 'lcs'
    }

    if (platform == 'node') {
        cfg.target = 'node'
        cfg.node = {
            __dirname: false,
            __filename: false,
        }
    }

    return cfg
}
