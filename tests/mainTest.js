var assert = require('assert');
// var path = require('path');
var fs = require('fs');
var SearchInDir = require('../node/main.js');


describe('テキストを検索する', function() {

	it("ディレクトリから文字列を検索", function(done) {
		this.timeout(1*60*1000);
		var searchInDir = new SearchInDir(
			[
				__dirname+'/../**/*'
			] ,
			{
				'keyword': 'test',
				'filter': [
					/./i
				] ,
				'ignore': [
					/deep/,
					/node_modules/
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
					searchInDir = null;
					assert.equal(1, 1);
					done();
				}
			}
		);
	});

});


describe('テキスト検索を中止する', function() {

	it("cancel() する", function(done) {
		this.timeout(1*60*1000);
		var searchInDir = new SearchInDir(
			[
				__dirname+'/../**/*'
			] ,
			{
				'keyword': 'test',
				'filter': [
					/./i
				] ,
				'progress': function( done, max ){
					console.log( done +'/'+ max + ' done.' );
				} ,
				'match': function( file, result ){
					// console.log('matche: ' + file);
					// console.log(result);
				} ,
				'unmatch': function( file, result ){
					// console.log('unmatch: ' + file);
					// console.log(result);
				} ,
				'error': function( file, error ){
					// console.log('error: ' + file);
					// console.log(result);
				} ,
				'complete': function(){
					console.log('all done!');
					assert.equal(1, 1);
					done();
				}
			}
		);

		setTimeout(function(){
			var canceled = searchInDir.cancel();
			assert.ok(canceled);
		}, 1500);

	});

});
