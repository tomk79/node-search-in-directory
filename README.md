# search-in-directory

指定ディレクトリ内のファイルをスキャンし、文字列を検索します。

## インストール - Install

```
$ npm install --save search-in-directory
```

## 使い方 - Usage

```js
var SearchInDir = require('search-in-directory');

var searchInDir = new SearchInDir(
	[
		'/path/to/target/**/*' // <- use glob format.
	] ,
	{
		'keyword': 'test', // <- keyword (string)
		'filter': [
			/./i // <- path filters (RegExp)
		] ,
		'ignore': [
			/deep/ // <- ignore path filters (RegExp)
		] ,
		'allowRegExp': false,
		'ignoreCase': false,
		'matchFileName': false,
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
			console.log(error);
		} ,
		'complete': function(){
			console.log('all done!');
		}
	}
);
```

## Change log

### search-in-directory@0.1.0 (2016-11-21)

- パッケージ名を `node-search-in-directory` から `search-in-directory` に変更。
- パフォーマンス改善。5件ずつ並列処理するように変更。

### node-search-in-directory@0.0.1 (2015-09-04)

- initial release.

## ライセンス - License

MIT License https://opensource.org/licenses/mit-license.php


## 作者 - Author

- Tomoya Koyanagi <tomk79@gmail.com>
- website: <http://www.pxt.jp/>
- Twitter: @tomk79 <http://twitter.com/tomk79/>
