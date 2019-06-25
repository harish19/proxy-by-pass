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

    const setCookies = function(req,cookies){
    	if(cookies){
    		for (var i = 0; i < cookies.length; i++) {
	    		let cDetails = cookies[i].split(';')[0],rawCookie=cDetails.split('=');
	    		// console.log('rawCookierawCookierawCookierawCookie',rawCookie);
	    		// req.header('set-cookie',cookies);
	    		req.state(rawCookie[0],rawCookie[1],{ httpOnly: false,secure:false });
	    	}
	    	// req.header('Cookie',cookies);
    	}

    	return req
    }
   
	try{
		await server.register(H2o2);
		await server.register(Inert);
		await server.register({
	      plugin: require('hapi-cors'),
	      options: {
	        origins: ['http://localhost:4200','http://check.brandsmartusa.com:4200']
	      }
	    });
		server.route({
		  method: '*',
		  path: '/{param*}',
		  options: {
	        state: {
	            parse: true,
	            failAction: 'ignore'
	        }
	    },
		  handler: async function(req,h){
		  		var url = remote + req.url.href.replace("http://localhost:3000", ''),
		  		reqHeaders = req.headers;
		  		let finalRes;
		  		delete reqHeaders.host;
		  		delete reqHeaders.referer;
		  		delete reqHeaders.origin;
		  		delete reqHeaders.pragma;
		  		reqHeaders['cache-control'] = 'max-age=0';
		  		reqHeaders['Host'] = 'localhost:4200';
		  		reqHeaders['accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3';
		  		// console.log('url------',url);
		  		console.log('req',reqHeaders);
		  		if(req.method==='get'){
		  			var res = await Wreck.get(url,{headers:{cookie:reqHeaders.cookie||""},'content-type': 'application/json'});
	
		  		 finalRes =  h.response(res.payload).header('content-type','application/json').header('Access-Control-Allow-Origin','*').header('set-cookie',res.res.headers['set-cookie']);
		  		// finalRes.header('set-cookie',res.res.headers['set-cookie']);
		  		finalRes = setCookies(finalRes,res.res.headers['set-cookie']);
		  		}else if(req.method==='post'){
		  			var res = await Wreck.post( url, {payload:req.payload,headers:{cookie:reqHeaders.cookie||""},'content-type': 'application/json'});
		  		 finalRes =  h.response(res.payload).header('content-type','application/json').header('Access-Control-Allow-Origin','*').header('set-cookie',res.res.headers['set-cookie']);
		  		finalRes = setCookies(finalRes,res.res.headers['set-cookie']);
		  		}else if(req.method==='OPTIONS' || req.method==='options'){
		  			// console.log('reqreqreqreqreqreq',req.state)
		  			finalRes = h.response().header('Access-Control-Allow-Origin','*')
		  									.header('Access-Control-Allow-Headers','cache-control,content-type')
		  									.header('Access-Control-Allow-Method',req.method)
		  									.header('Access-Control-Expose-Headers','access-control-allow-origin,access-control-allow-methods,access-control-allow-headers,access-control-allow-credentials')
		  									.header('Connection','keep-alive')
		  									.header('Transfer-Encoding','chunked');
		  		}
		  		// console.log('finalRes',finalRes.headers);
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
