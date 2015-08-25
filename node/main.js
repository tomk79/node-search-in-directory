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
	var countTarget = 0;
	var countDone = 0;
	var statusFilelist = false;
	this.queue = [];

	this.target = target;
	this.cond = (function(cond){
		cond = cond || {};
		cond.keyword  = cond.keyword   || function(){};
		cond.filter   = cond.filter    || [];
		cond.ignore   = cond.ignore    || [];
		cond.progress = cond.progress  || function(){};
		cond.match    = cond.match     || function(){};
		cond.unmatch  = cond.unmatch   || function(){};
		cond.error    = cond.error     || function(){};
		cond.complete = cond.complete  || function(){};
		if( typeof(cond.filter) == typeof('') ){
			cond.filter = [cond.filter];
		}
		if( typeof(cond.ignore) == typeof('') ){
			cond.ignore = [cond.ignore];
		}
		return cond;
	})(cond);


	if(this.queue.length){return this;}

	// 対象ファイルの一覧を作成する
	it79.ary(this.target,
		function(it, row, idx){
			glob(row, {}, function(er, files){
				// console.log(files);
				it79.ary(
					files,
					function(it2ary, data, i){
						if(this.canceled){return;}
						var path = fs.realpathSync(files[i]);
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
							it2ary.next();
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

	mainloop();


	/**
	 * ファイルパスからファイルを開き、検索する
	 * 検索結果は match(), または unmatch() にコールバックする。
	 */
	function searchInFile(row, callback){
		// console.log(row);

		var result = {
			'matched': false,
			'type': row.type,
			'count': 0
		};

		if( php.basename(row.path).match( _this.cond.keyword ) ){
			// ファイル名にキーワードマッチング
			result.matched = true;
		}

		if( row.type == 'file' ){
			// ファイルの場合
			fs.readFile( row.path, function( err, bin ){
				var result = {
					'matched': false,
					'type': 'file',
					'count': 0
				};
				if(err){
					// エラー
					result.error = err;
					_this.cond.error(row.path, result);
					return;
				}
				bin = bin.toString('UTF8');

				var matched = bin.match( new RegExp(php.preg_quote(_this.cond.keyword), 'g') );
				if( matched ){
					// キーワードマッチング
					result.matched = true;
					result.count = matched.length;
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
		}
	}

	/**
	 * キューを監視し、順に処理を進める
	 * すべて完了したフラグが立ったら、ループを抜け、complete() をコールバックして完了。
	 */
	function mainloop(){
		// console.log('mainloop()');
		if( _this.queue.length ){
			var row = _this.queue.shift();
			searchInFile(row, function(){
				if( _this.canceled || statusFilelist == true && !_this.queue.length && countTarget == countDone ){
					clearTimeout(_this.mainloopTimer);
					_this.cond.complete();
					return;
				}
			});
		}

		_this.mainloopTimer = setTimeout( mainloop, 3);
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
