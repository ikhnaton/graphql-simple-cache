const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const MATCH_ALL_NON_RELATIVE_IMPORTS = /^\w.*$/i;

const pluginConfigs = {
	UglifyJsPlugin:	new UglifyJsPlugin()
};

const baseConfig = {
	output: {
		filename: '[name].js',
		path: path.join(__dirname, '/dist'),
		library: '',
		libraryTarget: 'commonjs'
	},
    watch: false,
	stats: "errors-only",
	mode: 'production',
	externals: [MATCH_ALL_NON_RELATIVE_IMPORTS, {
		'./src/index.js': './src/index.js'
	}],
	module: {
		rules: [
			{
				test: [/\.js$/],
				exclude: /node_modules/,
				loader: "babel-loader"
			}
		]
	}
};

const serverConfig = Object.assign({}, baseConfig, {
	entry: {
		"index": ['@babel/polyfill', path.join(__dirname, '/src/index.js')],
		"external/redis": ['@babel/polyfill', path.join(__dirname, '/src/external/redis.js')]
	},
	target: 'node',
	plugins: [
		pluginConfigs.UglifyJsPlugin
	]
})

module.exports = [ serverConfig ]
module.exports.pluginConfigs = pluginConfigs;
