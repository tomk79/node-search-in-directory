var assert = require('assert');
// var path = require('path');
var fs = require('fs');

function getMain( options ){
	return require('../node/main.js');
}

describe('検索対象のファイルリストを作成する', function() {
	var searchInDir = getMain();

	it("検索対象をリストアップする", function(done) {
		searchInDir.ls( __dirname+'/data/standard/' );
		assert.equal(0, 0);
		done();
	});

});

describe('テキストを検索する', function() {
	var searchInDir = getMain();

	it("ディレクトリから文字列を検索", function(done) {
		searchInDir.find( 'DOCTYPE', __dirname+'/data/standard/' );
		assert.equal(0, 0);
		done();
	});

});
