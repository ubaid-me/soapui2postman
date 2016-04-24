var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var should = chai.should();
var expect = require("chai").expect;
var main = require('../main');

chai.use(chaiAsPromised);

describe('Soap UI to Postman Conversion', function () {
    it('should fail if input file is not provided', function (done) {
        expect(main.readFile('XlargeFile.xml'))
            .to.eventually.be.rejectedWith(Error)
            .notify(done);
    });

    it('should continue if proper file is provided', function (done) {
        expect(main.readFile('largeFile.xml'))
            .to.eventually.be.a('string')
            .notify(done);
    });

    it('should fail if invalid XML is passed as content', function (done) {
        expect(main.parseContent('AAABBAAD@@##R##$#$#'))
            .to.eventually.be.rejectedWith(Error)
            .notify(done);
    });

    it('should continue work if XML is passed as content', function (done) {
        expect(main.parseContent('<?xml version="1.0" encoding="UTF-8"?><test></test>'))
            .to.eventually.be.a('object')
            .notify(done);
    });
    
    it('should fail if con:soapui-project element is not present in parsed object', function (done) {
        expect(main.validateContent({}))
            .to.eventually.be.rejectedWith(Error)
            .notify(done);
    });

    it('should fail if con:soapui-project is present but con:interface is not found', function (done) {
        expect(main.validateContent({'con:soapui-project': {}}))
            .to.eventually.be.rejectedWith(Error)
            .notify(done);
    });

    it('should fail if con:soapui-project and con:interface are present but con:interface has 0 elements', function (done) {
        expect(main.validateContent({'con:soapui-project': {'con:interface': []}}))
            .to.eventually.be.rejectedWith(Error)
            .notify(done);
    });

    it('should continue if both con:soapui-project and con:interface elements are found', function (done) {
        expect(main.validateContent({'con:soapui-project': {'con:interface': [{'con:resource': [{}]}]}}))
            .to.eventually.be.a('object')
            .notify(done);
    });

    it('should generate destinaation object on proper input', function (done) {
        expect(main.validateContent({'con:soapui-project': {'con:interface': [{'con:resource': [{}]}]}}))
            .to.eventually.be.a('object')
            .notify(done);
    });
});