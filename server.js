'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const H2o2 = require('@hapi/h2o2');
const Wreck = require('@hapi/wreck');


const remote = "https://uat-www.brandsmartusa.com";

const setHeaders = function(test,finalRes){
	for(let k in test.res.headers){
		finalRes.header(k,test.res.headers[k]);
	}
	return finalRes;
}
const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

   
	try{
		await server.register(H2o2);
		await server.register(Inert);

		server.route({
		  method: '*',
		  path: '/{param*}',
		  handler: async function(req,h){
		  		var url = remote + req.url.href.replace("http://localhost:3000", ''),
		  		reqHeaders = req.headers;
		  		let finalRes;
		  		delete reqHeaders.host;
		  		delete reqHeaders.referer;
		  		delete reqHeaders.origin;
		  		delete reqHeaders.pragma;
		  		reqHeaders['cache-control'] = 'max-age=0';
		  		reqHeaders['accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3';
		  		console.log('url------',url);
		  		console.log(reqHeaders);
		  		console.log('reqHeaders.cookie',req);
		  		if(req.method==='get'){
		  			var res = await Wreck.get(url,{headers:{cookie:reqHeaders.cookie||""},'content-type': 'application/json'});
		  			console.log('res cookies-----',res.res.headers['set-cookie'])
		  		 finalRes =  h.response(res.payload).header('set-cookie',res.res.headers['set-cookie']).header('content-type','application/json').header('Access-Control-Allow-Origin','*');
		  		}else if(req.method==='post'){
		  			var res = await Wreck.post( url, {payload:req.payload,headers:{cookie:reqHeaders.cookie||""},'content-type': 'application/json'});
		  			console.log('res cookies-----',res.res.headers['set-cookie'])
		  		 finalRes =  h.response(res.payload).header('set-cookie',res.res.headers['set-cookie']).header('content-type','application/json').header('Access-Control-Allow-Origin','*');
		  		}else if(req.method==='OPTIONS' || req.method==='options'){
		  			finalRes = h.response().header('Access-Control-Allow-Origin','*')
		  									.header('Access-Control-Allow-Headers','cache-control,content-type')
		  									.header('Access-Control-Allow-Method',req.method)
		  									.header('Access-Control-Expose-Headers','access-control-allow-origin,access-control-allow-methods,access-control-allow-headers')
		  									.header('Connection','keep-alive')
		  									.header('Server','test')
		  									.header('Transfer-Encoding','chunked');
		  		}
		  		
			    return finalRes;
		  }
		});
	    await server.start();
	    console.log('Server running on ', server.info.uri);
	}catch(e){
	    console.log('Server running on %ss', e);
	}
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
