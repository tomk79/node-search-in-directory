var assert = require('assert');
// var path = require('path');
var fs = require('fs');

function getMain( options ){
	return new require('../node/main.js');
}

describe('テキストを検索する', function() {
	var searchInDir = getMain();

	it("ディレクトリから文字列を検索", function(done) {
		searchInDir.find(
			[
				__dirname+'/data/**/*'
				// __dirname+'/data/standard/**/*'
			] ,
			{
				'keyword': /./i,
				'filter': [
					/\./i
				] ,
				'ignore': [
					/deep/
				] ,
				'progress': function( file, result ){
console.log(file);
console.log(result);
				} ,
				'error': function( file, error ){
				} ,
				'complete': function(){
					assert.equal(0, 0);
					done();
				}
			}
		);
	});

});
