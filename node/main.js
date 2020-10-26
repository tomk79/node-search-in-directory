/**
 * node-search-in-directory
 */
module.exports = function( target, cond ){
	var cProc = require('child_process');
	var fs = require('fs');
	var glob = require('glob');
	var php = require('phpjs');
	var it79 = require('iterate79');
	var _this = this;

	this.mainloopTimer;
	this.canceled = false;
	this.completed = false;
	var countTarget = 0;
	var countDone = 0;
	var statusFilelist = false;
	this.queue = [];

	this.target = target;
	this.cond = (function(cond){
		cond = cond || {};
		cond.progress      = cond.progress      || function(){};
		cond.match         = cond.match         || function(){};
		cond.unmatch       = cond.unmatch       || function(){};
		cond.error         = cond.error         || function(){};
		cond.complete      = cond.complete      || function(){};
		return cond;
	})(cond);
	if(this.queue.length){return this;}



	/**
	 * 検索を実行する
	 */
	this.start = function(keyword, options, complete){
		complete = complete || function(){};
		this.cond.complete = complete;

		this.cond = (function(cond, keyword, options){
			cond = cond || {};
			cond.keyword       = keyword            || /.*/gi;
			cond.filter        = options.filter        || [];
			cond.ignore        = options.ignore        || [];
			cond.allowRegExp   = options.allowRegExp   || false;
			cond.ignoreCase    = options.ignoreCase    || false;
			cond.matchFileName = options.matchFileName || false;
			try {
				if( cond.allowRegExp ){
					cond.keyword = new RegExp(cond.keyword, 'g'+(cond.ignoreCase ? 'i' : ''));
				}else{
					cond.keyword = new RegExp(php.preg_quote(cond.keyword), 'g'+(cond.ignoreCase ? 'i' : ''));
				}
			} catch (e) {
				cond.keyword = /.*/gi;
			}
			if( typeof(cond.filter) == typeof('') ){
				cond.filter = [cond.filter];
			}
			if( typeof(cond.ignore) == typeof('') ){
				cond.ignore = [cond.ignore];
			}
			return cond;
		})(this.cond, keyword, options);

		mainloop();

		// 対象ファイルの一覧を作成する
		it79.ary(this.target,
			function(it, row, idx){
				glob(row, {}, function(er, files){
					// console.log(files);
					it79.ary(
						files,
						5,
						function(it2ary, data, i){
							if( _this.canceled ){
								return;
							}
							if( _this.completed ){
								return;
							}

							var path = fs.realpathSync( files[i] );
							var type = ( fs.statSync(path).isDirectory() ? 'dir' : 'file' );

							if( !(function(){
								for(var idx in _this.cond.filter){
									if( !path.match(_this.cond.filter[idx]) ){
										return false;
									}
								}
								for(var idx in _this.cond.ignore){
									if(path.match(_this.cond.ignore[idx])){
										return false;
									}
								}
								return true;
							})() ){
								setTimeout(function(){
									it2ary.next();
								}, 0);
								return;
							}

							// 対象を追加
							countTarget ++;
							_this.queue.push({
								'path': path,
								'type': type
							});
							_this.cond.progress(countDone, countTarget);
							setTimeout(function(){
								it2ary.next();
							}, 0);
							return;
						} ,
						function(){
							it.next();
						}
					);
				});
			},
			function(){
				statusFilelist = true;
			}
		);

	}


	/**
	 * ファイルパスからファイルを開き、検索する
	 * 検索結果は match(), または unmatch() にコールバックする。
	 */
	function searchInFile(row, callback){
		// console.log(row);

		var result = {
			'matched': false,
			'type': row.type,
			'count': 0,
			'highlights': []
		};

		if( _this.cond.matchFileName ){
			if( php.basename(row.path).match( _this.cond.keyword ) ){
				// ファイル名にキーワードマッチング
				result.matched = true;
				result.highlights.push( php.basename(row.path) );
			}
		}

		var tmpHighlights = result.highlights;

		if( row.type == 'file' ){
			// ファイルの場合
			fs.readFile( row.path, function( err, bin ){
				if(_this.completed){
					return;
				}

				var result = {
					'matched': false,
					'type': 'file',
					'count': 0,
					'highlights': tmpHighlights
				};
				if(err){
					// エラー
					countDone ++;
					result.error = err;
					_this.cond.error(row.path, result);
					_this.cond.progress(countDone, countTarget);
					callback();
					return;
				}
				bin = bin.toString('UTF8');

				var matched = bin.match( _this.cond.keyword );
				if( matched ){
					// キーワードマッチング
					// console.log(matched);
					result.matched = true;
					result.count = matched.length;

					var index = bin.search( _this.cond.keyword );
					index = index - 30;
					if( index < 0 ){ index = 0; }

					var highlight = bin.substr(index, (matched[0].length) + 60);
					highlight = highlight.replace(_this.cond.keyword, '<<<<<<$&>>>>>>');
					highlight = highlight.split(/&/).join('&amp;');
					highlight = highlight.split(/</).join('&lt;');
					highlight = highlight.split(/>/).join('&gt;');
					highlight = highlight.split(/"/).join('&quot;');
					highlight = highlight.split('&lt;&lt;&lt;&lt;&lt;&lt;').join('<strong>');
					highlight = highlight.split('&gt;&gt;&gt;&gt;&gt;&gt;').join('</strong>');
					highlight = highlight.split(/\r\n|\r|\n|\t/).join(' ');
					result.highlights.push(highlight);
				}

				countDone ++;
				if( result.matched ){
					// マッチした場合
					_this.cond.match(row.path, result);
				}else{
					// マッチしなかった場合
					_this.cond.unmatch(row.path, result);
				}
				_this.cond.progress(countDone, countTarget);
				callback();
				return;

			} );
		}else{
			// ディレクトリの場合
			countDone ++;
			if( result.matched ){
				// マッチした場合
				_this.cond.match(row.path, result);
			}else{
				// マッチしなかった場合
				_this.cond.unmatch(row.path, result);
			}
			_this.cond.progress(countDone, countTarget);
			callback();
			return;
		}
	}

	/**
	 * キューを監視し、順に処理を進める
	 * すべて完了したフラグが立ったら、ループを抜け、complete() をコールバックして完了。
	 */
	function mainloop(){
		// console.log('mainloop()');
		var queue = [];
		if( !_this.canceled && _this.queue.length ){
			// var row = _this.queue.shift();
			queue = _this.queue;
			_this.queue = [];

			it79.ary(
				queue,
				5,
				function(it1, row, idx){
					searchInFile(row, function(){
						if( _this.canceled ){
							it1.break();
							return;
						}
						it1.next();
						return;
					});
				},
				function(){
					if( _this.canceled ){
						complete();
						return;
					}
				}
			);
		}

		if( _this.canceled || statusFilelist == true && !_this.queue.length && countTarget == countDone ){
			complete();
			return;
		}

		_this.mainloopTimer = setTimeout( mainloop, 3);
		return;
	}

	/**
	 * 検索を完了する
	 */
	function complete(){
		if(_this.completed){
			return;
		}
		_this.completed = true;
		clearTimeout(_this.mainloopTimer);
		_this.cond.complete();
		return;
	}

	/**
	 * キャンセル
	 */
	this.cancel = function(){
		this.canceled = true;
		return this;
	}

	return this;
}
