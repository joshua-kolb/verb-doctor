import http from 'http';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';

import Server from './src/server/server';


const serve = serveStatic('dist', {index: ['index.html']});
const httpServer = http.createServer(function (req, res) {
	serve(req, res, finalhandler(req, res));
});

new Server(httpServer);

httpServer.listen(process.env.npm_package_config_port);