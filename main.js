var fs = require('fs'),
    xml2js = require('xml2js');
var parseString = require('xml2js').parseString;
var Guid = require('node-uuid');
var xmlParser = require("node-xml-lite");
var parser = new xml2js.Parser();

module.exports = {
    getDestinationFormat,
    getDestinationRequest,
    readFile,
    parseContent,
    writeOutput,
    validateContent,
    initiateParsing,
    processContent
};

function getDestinationFormat() {
    return {
        id: null,
        name: null,
        description: null,
        hasRequests: true,
        requests: []
    };
}

function getDestinationRequest() {
    return {
        id: null,
        headers: "",
        url: "",
        name: "",
        dataMode: "raw",
        rawModeData: "",
        collectionId: null


    };
}

function readFile(path) {
    return new Promise(function (fulfill, reject) {
        fs.readFile(path, function (err, res) {
            if (err) reject(err);
            else fulfill(res.toString());
        });
    });
}

function parseContent(content) {
    return new Promise(function (fulfill, reject) {
        parser.parseString(content, function (err, result) {
            if (err) reject(err);
            else fulfill(result);
        });
    });
}

function validateContent(contentObject) {
    return new Promise(function (fulfill, reject) {

        var project = contentObject['con:soapui-project'];
        if (!project) {
            reject(new Error('SOAP UI Project not found.'));
        }
        var soapInterface = project['con:interface'];
        if (!soapInterface || soapInterface.length <= 0) {
            reject(new Error('No soapInterface in the project.'));
        }

        var resource = soapInterface[0]['con:resource'];
        if (!resource || resource.length <= 0) {
            reject(new Error('No resource in the project.'));
        }
        fulfill(contentObject);

    });
}

function writeOutput(finalObject, outFile) {
    return new Promise(function (fulfill, reject) {
        fs.writeFile(outFile, JSON.stringify(finalObject), function (err) {
            if (err) reject(err);
            fulfill(outFile);
        });
    });
}

function initiateParsing(result) {

    return new Promise(function (fulfill, reject) {

        try {
            var project = result['con:soapui-project'];
            var soapInterface = project['con:interface'];

            var response = getDestinationFormat();

            var collectionId = Guid.v1();

            processContent(soapInterface, response, collectionId);

            fulfill(response);

        } catch (e) {
            console.log(soapInterface, response, collectionId);
            reject(e);
        }

    });

}

function processContent(soapInterface, response, collectionId) {
    for (var index = 0; index < soapInterface.length; index++) {
        var requestObject = soapInterface[index]['con:resource'];

        for (var requestIndex = 0; requestIndex < requestObject.length; requestIndex++) {
            var internalRequestObject = requestObject[requestIndex];

            response.id = requestObject[0].$.id;
            response.name = requestObject[0].$.name;
            response.id = collectionId;

            var methods = internalRequestObject['con:method'];

            for (var methodIndex = 0; methodIndex < methods.length; methodIndex++) {

                var httpMethodType = methods[0].$.method;
                var method = methods[methodIndex]['con:request'][0];
                var allRequests = methods[methodIndex]['con:request'];

                for (var requestIndex = 0; requestIndex < allRequests.length; requestIndex++) {

                    var destinationRequest = getDestinationRequest();

                    var actualRequest = allRequests[requestIndex];

                    destinationRequest.name = actualRequest.$.name;
                    destinationRequest.id = actualRequest.$.id;
                    destinationRequest.method = httpMethodType;

                    destinationRequest.url = actualRequest['con:originalUri'][0];
                    destinationRequest.rawModeData = actualRequest['con:request'][0];

                    destinationRequest.collectionId = collectionId;

                    var requestSettings = actualRequest['con:settings'];
                    var headerText = '';
                    destinationRequest.headers = headerText;

                    if (!!requestSettings && requestSettings.length > 0) {
                        for (var headerIndex = 0; headerIndex < requestSettings.length; headerIndex++) {
                            var element = requestSettings[headerIndex]['con:setting'][0];

                            var stuff = xmlParser.parseBuffer(new Buffer(element._));
                            headerText = stuff.attrib.key + ':' + stuff.attrib.value + '\n' + headerText;
                        }
                    }
                    destinationRequest.headers = headerText;

                    response.requests.push(destinationRequest);
                }
            }
        }
    }
}

function main(inFile, outFile) {

    readFile(inFile)
        .then(parseContent)
        .then(validateContent)
        .then(initiateParsing)
        .then(function (finalObject) {
            return writeOutput(finalObject, outFile);
        }).then(function (finalFile) {
        console.log('file written at:', finalFile);
    }).catch(function (err) {
        console.log(err);
    });
}

if (process.argv.length < 4) {
    console.log("Usage: " + __filename + " inputFile.ext outputFile.ext");
    process.exit(-1);
} else {
    main(process.argv[2], process.argv[3]);
}

//for testing
//main('xlargeFile.xml', 'largeFile.json');

