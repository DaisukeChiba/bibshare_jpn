/* ****************************************************************************** */
/* *                                    main.html                               * */
/* ****************************************************************************** */

/* ****************************************************************************** */
/*                                      初期処理                                * */
/* ****************************************************************************** */
$(function(){
	//本棚一覧の表示
	init();
	//サインインチェック。サインインチェックは優先して実行したいが、画面遷移がうまくいかないためいったんこのままとする。
	checklogin();

});

/* ***************************************************************************** */
/*                  キーワード入力(インスタントサーチ)                         * */
/* ***************************************************************************** */
$(function(){
	$('#keywordSearchForm').on('input',serchResultList);
});


/* ***************************************************************************** */
/*                                  jQuery内の検索                             * */
/* ***************************************************************************** */
// 初期表示時にDBの全量をjsonで取得しているため、json内を検索した。
// 初期表示時に全量を取得しない場合は、都度DBから取得する。その場合は負荷がかかるためインスタントサーチをやめる。
serchResultList = function(event){
	var serchJsonData = JSON.parse(sessionStorage.getItem("serchJsonData"));
	var keyword = $(this).val();

	var newResult = $.grep(serchJsonData, function (e) {
		//タイトル
		if (e.booktitle.match(keyword)) {
			return (e.booktitle.match(keyword));
		//作者
		} else if (e.author.match(keyword)) {
			return (e.author.match(keyword));
		//出版社
		} else if (e.publisher.match(keyword)) {
			return (e.publisher.match(keyword));
		//ハッシュタグ
		} else if (e.hashtag.match(keyword)) {
			return (e.hashtag.match(keyword));
		//コメント
		} else if (e.comment.match(keyword)) {
			return (e.comment.match(keyword));
		}
	});
	console.log(newResult);
	createBookshelf(newResult);
};

/* ***************************************************************************** */
/*                                   本棚一覧の表示                            * */
/* ***************************************************************************** */
// 改ページなど、大量データの対応は行っていません。
function init() {

	// $.ajaxメソッドで通信
	$.ajax({
		url:'http://ec2-52-198-38-64.ap-northeast-1.compute.amazonaws.com:1880/select_db', // 通信先のURL
		type:'POST',		// 使用するHTTPメソッド (GET/ POST)
		dataType:'json',	 // 応答のデータの種類
		timeout:100000, 		// 通信のタイムアウトの設定(ミリ秒)　←落ちる原因かもなので、増やしてみました！！
		cache:false, 		// キャッシュオフ

	// 通信に成功した時に実行
	}).done(function(data,textStatus,jqXHR) {
		console.log(data);
		createBookshelf(data);

		//検索や詳細表示にて利用するので、jsonをセッションストレージに退避
		sessionStorage.removeItem("serchJsonData");
		sessionStorage.setItem("serchJsonData", JSON.stringify(data));

	// 通信に失敗した時に実行
	}).fail(function(jqXHR, textStatus, errorThrown ) {

	   	$('#resultAreaMain').empty();	//一旦クリア
	   	$('#resultAreaMain').append("errorThrown : " + errorThrown.message);
	});
};

/* ***************************************************************************** */
/*                                       本棚の作成                            * */
/* ***************************************************************************** */
// @param {data} 本棚データ
function createBookshelf(data){

		// 画面表示領域のクリア
	   	$('#resultAreaMain').empty();

		var tagArray = "";
		for(var i = 0; i < data.length; i++){
			divItems="";
			// ▼card開始
			divItems += '<div class=\"card img-thumbnail m-2\">';
			// 書籍画像表示
			divItems += '    <a href=\"#\" onclick=\"dispBookInformation(' + i + ')\">';
			divItems += '        <img class=\"rounded card-img-top\" src=\"' + data[i]["thumbnailurl"] + '\"/>';
			divItems += '    </a>';
			// ▼card-block開始
			divItems += '    <div class=\"card-block\">'
			// ユーザ名表示
			divItems += '        <a class=\"card-link\"  href=\"#\" onclick=\"userSearch(' + i + ')\">@' + data[i]["postuser"]  + '</a>';
			// ハッシュタグ表示
			tagArray = data[i]["hashtag"].split('#');
			for(var j = 0; j < tagArray.length; j++){
				// ハッシュタグをsplitして空文字が残る問題は判定で逃げました…
				if (tagArray[j]){
					divItems += '        <br /><small><a class=\"card-link\" href=\"#\" onclick=\"tagSearch(' + i + ')\">#' + tagArray[j]  + '</a></small>';
				}
			}
			divItems += '    </div>'
			// ▲card-block終了

//これだとPC側の見栄えが悪い
//			divItems +='<div class=\"col-3 grid-img \">';
//			divItems +='<a href=\"#\" onclick=\"dispBookInformation(' + i + ')\"><img class=\"rounded col-12\" src=\"' + data[i]["thumbnailurl"] + '\"/></a>';
//これだとスマホ側の画像が小さすぎる
//			divItems +='<div class=\"col-2 grid-img \">';
//			divItems +='<a href=\"#\" onclick=\"dispBookInformation(' + i + ')\"><img class=\"rounded\" src=\"' + data[i]["thumbnailurl"] + '\"/></a>';
//レイアウト崩れにつき、投稿者やタグの表示をコメントアウト
//			divItems +='<a class=\"user\"  href=\"#\" onclick=\"userSearch(' + i + ')\">' + data[i]["postuser"]  + '</a>';
////		tagArray = data[i]["hashtag"];
////		divItems +='<a class=\"tag\" href=\"#\" onclick=\"tagSearch(' + i + ')\">' + tagArray  + '</a>';
//			tagArray = data[i]["hashtag"].split('#');
//			for(var j =0; j < tagArray.length; j++){
//				divItems +='<a class=\"tag\" href=\"#\" onclick=\"tagSearch(' + i + ')\">' + tagArray[j]  + '</a>';
//			}
			divItems += '</div>';
			// ▲card終了
			$('#resultAreaMain').append(divItems);
		}
}


/* ***************************************************************************** */
/*                             本の詳細画面への遷移                            * */
/* ***************************************************************************** */
// @param {i} 選択した本に該当するjsonの配列番号
function dispBookInformation(i){
	//セッションストレージに値を設定
	sessionStorage.removeItem("selectNo");
	sessionStorage.setItem("selectNo", i);

	//ページ遷移
	var url = "book.html";
	$(location).attr("href", url);
}
