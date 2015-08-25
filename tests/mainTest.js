var assert = require('assert');
// var path = require('path');
var fs = require('fs');
var SearchInDir = require('../node/main.js');

function getMain( options ){
	return new SearchInDir;
}

describe('テキストを検索する', function() {
	var searchInDir = getMain();

	it("ディレクトリから文字列を検索", function(done) {
		this.timeout(2*60*1000);
		searchInDir.find(
			[
				__dirname+'/../**/*'
				// __dirname+'/data/standard/**/*'
			] ,
			{
				'keyword': /test/i,
				'filter': [
					/./i
				] ,
				'ignore': [
					/deep/
				] ,
				'progress': function( done, max ){
					console.log( done +'/'+ max + ' done.' );
				} ,
				'match': function( file, result ){
					console.log('matche: ' + file);
					console.log(result);
				} ,
				'unmatch': function( file, result ){
					console.log('unmatch: ' + file);
					console.log(result);
				} ,
				'error': function( file, error ){
					console.log('error: ' + file);
					console.log(result);
				} ,
				'complete': function(){
					console.log('all done!');
					assert.equal(0, 0);
					done();
				}
			}
		);
	});

});
