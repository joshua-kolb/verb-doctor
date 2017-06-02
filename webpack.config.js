var webpack = require('webpack');

module.exports = {
	entry: [
		'webpack-dev-server/client?http://localhost:8080',
		'webpack/hot/only-dev-server',
		'./src/client/index.js'
	],
	module: {
		loaders: [{
			test: /^\.\/src\/client\/.*\.js$/,
			exclude: /node_modules/,
			loader: 'react-hot-loader!babel-loader'
		}, {
			test: /^\.\/src\/client\/content\/.*\.css$/,
			loader: 'style-loader!css-loader'
		}]
	},
	output: {
		path: __dirname + '/dist',
		publicPath: '/',
		filename: 'bundle.js'
	},
	devServer: {
		contentBase: './dist',
		hot: true
	},
	plugins: [
		new webpack.HotModuleReplacementPlugin()
	]
}