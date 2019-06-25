var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
app.use(cookieParser());
const Wreck = require('@hapi/wreck');
const remote = "https://uat-www.brandsmartusa.com";
var cors = require('cors')
app.use(cors())
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
const axios = require('axios');

const setCookies = function(req,cookies){
    	if(cookies){
    		for (var i = 0; i < cookies.length; i++) {
	    		let cDetails = cookies[i].split(';')[0],rawCookie=cDetails.split('=');
	    		// console.log('rawCookierawCookierawCookierawCookie',rawCookie);
	    		req.cookie(rawCookie[0],rawCookie[1],{ httpOnly: false,secure:false });
	    	}
	    	// req.header('Cookie',cookies);
    	}

    	return req
    }
app.get('*', async function(req, res){
	var url = remote + req.url.replace("http://localhost:3000", ''),
	reqHeaders = req.headers;
	delete reqHeaders.host;
	delete reqHeaders.referer;
	delete reqHeaders.origin;
	delete reqHeaders.pragma;
	delete reqHeaders['dom-cookie'];
	reqHeaders.withCredentials=true;
	// console.log(reqHeaders);
	var response = await Wreck.get(url,reqHeaders);
	res = setCookies(res,response.res.headers['set-cookie']);
   res.json(JSON.parse(response.payload)); 
});

app.post('*', async function(req, res){
	var url = remote + req.url.replace("http://localhost:3000", ''),
	reqHeaders = req.headers;
	cookies = reqHeaders['dom-cookie'];
	delete reqHeaders.host;
	delete reqHeaders.referer;
	delete reqHeaders.origin;
	delete reqHeaders.pragma;
	delete reqHeaders['dom-cookie'];
	reqHeaders['Cookie'] = cookies;
	// console.log(req.url+'----------post---------------------',reqHeaders);
	// var response = await Wreck.post( url, {payload:req.body,headers:reqHeaders,'content-type': 'application/json'});
	// console.log(JSON.parse(response.payload));
	// res.json(JSON.parse(response.payload)); 
	try{
		var response= await axios({method: 'post',url: url,
			// headers:reqHeaders
			headers:{
				         Cookie: cookies || ''
				     }
     , data: req.body});
		res = await setCookies(res,response.headers['set-cookie']);
	    res.json(response.data); 
	}catch(e){
		console.log(e);
	}

});

app.listen(3000);