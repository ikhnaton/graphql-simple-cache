const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const MATCH_ALL_NON_RELATIVE_IMPORTS = /^\w.*$/i;

const pluginConfigs = {
	UglifyJsPlugin:	new UglifyJsPlugin(),
	EnvironmentPlugin: new webpack.DefinePlugin({
		'process.env': {
			'NODE_ENV': JSON.stringify('production')
		}
	})
};

const baseConfig = {
	output: {
		filename: 'index.js',
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
		backend: path.join(__dirname, '/src/index.js')
	},
	target: 'node',
	plugins: [
		pluginConfigs.UglifyJsPlugin
	]
//	externals: ['vcap.local.js']
})

module.exports = [ serverConfig ]
module.exports.pluginConfigs = pluginConfigs;
