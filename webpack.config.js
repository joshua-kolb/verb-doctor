var webpack = require('webpack');
var path = require('path');

module.exports = {
	entry: [
		'webpack-dev-server/client?http://localhost:8080',
		'webpack/hot/only-dev-server',
		'./src/client/index.js'
	],
	module: {
		loaders: [{
			test: /\.js$/,
			include: path.resolve(__dirname, 'src/client'),
			loader: 'react-hot-loader!babel-loader'
		}, {
			test: /\.css$/,
			include: path.resolve(__dirname, 'src/client/content'),
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