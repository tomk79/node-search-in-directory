/**
 * node-search-in-directory
 */
module.exports = new (function(){
	var cProc = require('child_process');
	var fs = require('fs');
	var glob = require('glob');
	var php = require('phpjs');
	var it79 = require('iterate79');

	/**
	 * 検索する
	 * @param  {Array} target [description]
	 * @param  {Object} cond [description]
	 * @return {Object}      [this]
	 */
	this.find = function( target, cond ){
		cond = cond || {};
		cond.keyword  = cond.keyword   || function(){};
		cond.filter   = cond.filter    || [];
		cond.ignore   = cond.ignore    || [];
		cond.progress = cond.progress  || function(){};
		cond.error    = cond.error     || function(){};
		cond.complete = cond.complete  || function(){};

		if( typeof(cond.filter) == typeof('') ){
			cond.filter = [cond.filter];
		}
		if( typeof(cond.ignore) == typeof('') ){
			cond.ignore = [cond.ignore];
		}

		var countTarget = 0;
		var countDone = 0;
		var statusFilelist = false;
		var queue = [];

		// 対象ファイルの一覧を作成する
		it79.ary(target,
			function(it, row, idx){
				glob(row, {}, function(er, files){
					// console.log(files);
					for( var i = 0; i<files.length; i ++ ){
						var path = fs.realpathSync(files[i]);
						var type = ( fs.statSync(path).isDirectory() ? 'dir' : 'file' );

						if( !(function(){
							for(var idx in cond.filter){
								if( !path.match(cond.filter[idx]) ){
									return false;
								}
							}
							for(var idx in cond.ignore){
								if(path.match(cond.ignore[idx])){
									return false;
								}
							}
							return true;
						})() ){
							continue;
						}

						// 対象を追加
						countTarget ++;
						queue.push({
							'path': path,
							'type': type
						});
					}
					it.next();
				});
			},
			function(){
				statusFilelist = true;
			}
		);

		// ファイルパスからファイルを開き、検索する
		// 検索結果は progress() にコールバックする。
		function searchInFile(row){
			// console.log(row);

			var result = {
				'matched': false
			};

			if( php.basename(row.path).match( cond.keyword ) ){
				// ファイル名にキーワードマッチング
				result.matched = true;
			}

			if( row.type == 'file' ){
				fs.readFile( row.path, function( err, bin ){
					bin = bin.toString('UTF8');

					if( bin.match( cond.keyword ) ){
						// キーワードマッチング
						result.matched = true;
					}

					countDone ++;
					cond.progress(row.path, result);

				} );
			}else{
				countDone ++;
				cond.progress(row.path, result);
			}
		}

		// キューを監視し、順に処理を進める
		// すべて完了したフラグが立ったら、ループを抜け、
		// complete() をコールバックして完了。
		function mainloop(){
			// console.log('mainloop()');
			if( statusFilelist == true && !queue.length && countTarget == countDone ){
				cond.complete();
				return;
			}
			if( queue.length ){
				var row = queue.shift();
				new searchInFile(row);
			}

			setTimeout( mainloop, 10);
			return;
		}
		mainloop();

		return this;
	}

})();
