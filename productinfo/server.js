process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var restify = require('restify');
var https = require('follow-redirects').https;
var esc = require('xml-escape');
var xml2js = require('xml2js');
var JSONPath = require('JSONPath');

var server = restify.createServer({
    name: 'productinfo',
    version: '1.0.0'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

var parser = new xml2js.Parser({explicitArray: false});

var http_options = {
    hostname: 'ptseelm-lx4635.ikeadt.com',
    port: 9512,
    path: '/eicwsproxy01EbcFwkWeb/wsproxy',
    method: 'POST'
}

if (process.argv[2] === "debug") {
    http_options = {
        hostname: 'drive.google.com',
        path: '/uc?export=download&id=0BxwS8DFxJH4yTjBjckZXNkdIeVk'
    }
}

server.get('/articles/:id', function (req, restres, next) {
    var xml = createSOAPData(req.params.id);
    console.log(xml);
    var buffer = [];
    var req = https.request(http_options, (res) => {
        //console.log(`STATUS: ${res.statusCode}`);
        //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            buffer.push(chunk);
        });

        res.on('end', () => {
            console.log(buffer.join(''));
            parser.parseString(buffer.join(''), function (err, result) {
                var jp = JSONPath({json: result, path: "$..VoItem", resultType: 'all'});
                console.log(JSON.stringify(jp[0]['value']));
                restres.send(JSON.stringify(jp[0]['value']));
                return next();
            });
        })
    });

    req.on('error', (e) => {
        console.log(`problem with request: ${e.message}`);
        var myErr = new errors.InternalServerError({
            statusCode: 500,
            message: `Something went wrong: ${e.message}`
        });
        restres.send(myErr);
        return next();
    });

    // write data to request body
    req.write(xml); // xml would have been set somewhere to a complete xml document in the form of a string
    req.end();


});

server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});

function createSOAPData(id) {
    var escapedId = esc(id);
    return `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bus="http://ws.fwk.ikea.com/business-call" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
               <soapenv:Header>
                  <wsse:Security>
                     <wsse:UsernameToken>
                        <wsse:Username>theuserid</wsse:Username>
                        <wsse:Password>thepassword</wsse:Password>
                     </wsse:UsernameToken>
                  </wsse:Security>
               </soapenv:Header>
               <soapenv:Body>
                  <bus:BsGetItemRequest>
                     <bus:EBCHeader>
                        <bus:clientId>?</bus:clientId>
                        <bus:ebcname>EBCCRC01</bus:ebcname>
                        <bus:consumerId>testConsumerId</bus:consumerId>
                        <bus:providerId>testProviderId</bus:providerId>
                        <bus:contractId>testContractId</bus:contractId>
                        <bus:environmentId>?</bus:environmentId>
                        <bus:originator>?</bus:originator>
                        <bus:invocationStyle>SYNCH</bus:invocationStyle>
                        <bus:wsproxyProtocolVersion>1.1</bus:wsproxyProtocolVersion>
                        <bus:ebccontractVersion>2.7.6</bus:ebccontractVersion>
                        <!--Optional:-->
                        <bus:locality/>
                     </bus:EBCHeader>
                     <bus:BsGetItemRequestPayload>
                        <!--Optional:-->
                        <bus:VoGetItemFilterList>
                           <!--Zero or more repetitions:-->
                           <bus:VoGetItemFilter>
                              <!--Optional:-->
                              <bus:ItemNo>${escapedId}</bus:ItemNo>
                              <bus:DisplayLanguage>DE</bus:DisplayLanguage>
                           </bus:VoGetItemFilter>
                        </bus:VoGetItemFilterList>
                     </bus:BsGetItemRequestPayload>
                  </bus:BsGetItemRequest>
               </soapenv:Body>
            </soapenv:Envelope>
        `
}
