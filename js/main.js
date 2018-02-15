/* ****************************************************************************** */
/* *                                    main.html                               * */
/* ****************************************************************************** */

/* ****************************************************************************** */
/*                                      初期処理                                * */
/* ****************************************************************************** */
$(function(){
	//サインインチェック
	var result = checklogin();

	//未サインインの場合
	if (result == 1) {
		var url = "signin.html";
		$(location).attr("href", url);
	//サインイン済の場合
	} else {
		//本棚一覧の表示
		init();
	}

});

/* ***************************************************************************** */
/*                  キーワード検索(インスタントサーチ)                         * */
/* ***************************************************************************** */
/* インスタントサーチ */
/* https://qiita.com/kenju/items/daa0a8a647827b198fb7 */
$(function(){
	$('#keywordSearchForm').on('input',serchResultList);
});


/* ***************************************************************************** */
/*                  検索結果のクリア                                           * */
/* ***************************************************************************** */
/* Clearボタン押下で検索結果をクリア(画面をリロード) */
$(function(){
    $("#clearSearchForm").on("click", function(){
        location.reload();
    });
});

/* ***************************************************************************** */
/*                                  json内の検索                             * */
/* ***************************************************************************** */
// 初期表示時にDBの全量をjsonで取得しているため、json内を検索した。
// 初期表示時に全量を取得しない場合は、都度DBから取得する。その場合は負荷がかかるためインスタントサーチをやめる。
serchResultList = function(event){
	var searchJsonData = JSON.parse(sessionStorage.getItem("masterJsonData"));
	var keyword = $(this).val();
	if(keyword == "#") return;

	if (keyword.substring(0,1) == "@") {
		keyword = keyword.replace("@","")
		var newResult = $.grep(searchJsonData, function (e) {
			//ユーザ名検索　2/14追加
			return (!e.postuser.indexOf(keyword));
		});
	} else if(keyword.substring(0,1) == "#"){
		var newResult = $.grep(searchJsonData, function (e) {
			//ハッシュタグ検索　2/14追加
			return (e.hashtag.match(keyword));
		});
	} else {
		var newResult = $.grep(searchJsonData, function (e) {
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
	}

	console.log(newResult);
	createBookshelf(newResult);

	//絞り込み用のjsonをセッションストレージに退避　2/13不具合修正
	sessionStorage.removeItem("searchJsonData");
	sessionStorage.setItem("searchJsonData", JSON.stringify(newResult));
};

/* ***************************************************************************** */
/*                                   本棚一覧の表示                            * */
/* ***************************************************************************** */
// 改ページなど、大量データの対応は行っていません。
function init() {

	// $.ajaxメソッドで通信
	/* jQuery $.ajaxで通信を行ってJSONを取得する */
	/* https://itsakura.com/jquery-ajax */
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

		// DB取得直後のjsonを、セッションストレージに退避
		/* セッションストレージについて */
		/* https://www.granfairs.com/blog/staff/local-storage-01 */
		/* https://www.tam-tam.co.jp/tipsnote/javascript/post5978.html */
		sessionStorage.removeItem("masterJsonData");
		sessionStorage.setItem("masterJsonData", JSON.stringify(data));

		//絞り込み用のjsonをセッションストレージに退避　2/13不具合修正
		sessionStorage.removeItem("searchJsonData");
		sessionStorage.setItem("searchJsonData", JSON.stringify(data));

	// 通信に失敗した時に実行
	}).fail(function(jqXHR, textStatus, errorThrown ) {

	   	$('#resultAreaMain').empty();	//一旦クリア
//	   	$('#resultAreaMain').append("errorThrown : " + errorThrown.message);
		alert('error!!');
	});
};

/* ***************************************************************************** */
/*                                   本棚の作成                                * */
/* ***************************************************************************** */
// @param {data} 本棚データ
function createBookshelf(data){

	<!-- jQueryでhtml要素の追加・削除を行う -->
	<!-- http://uxmilk.jp/10889 -->
	<!-- https://qiita.com/butakoma/items/89fa687ab90ff28d57ef -->

	// 画面表示領域のクリア
   	$('#resultAreaMain').empty();

	var tagArray = "";
	var tmp ="";
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
			divItems += '        <a class=\"card-link\"  href=\"#\" onclick=\"filterList(' + i + ',0,' + '1)\">@' + data[i]["postuser"] + '</a>';
		// ハッシュタグ表示
		tagArray = data[i]["hashtag"].split('#');
		for(var j = 0; j < tagArray.length; j++){
			// ハッシュタグをsplitして空文字が残る問題は判定で逃げました…
			if (tagArray[j]){
				divItems += '        <br /><small><a class=\"card-link\" href=\"#\" onclick=\"filterList(' + i + ',' + j + ',' + '2)\">#' + tagArray[j]  + '</a></small>';
			}
		}
		divItems += '    </div>'
		// ▲card-block終了

//これだとPC側の見栄えが悪い
//		divItems +='<div class=\"col-3 grid-img \">';
//		divItems +='<a href=\"#\" onclick=\"dispBookInformation(' + i + ')\"><img class=\"rounded col-12\" src=\"' + data[i]["thumbnailurl"] + '\"/></a>';
//これだとスマホ側の画像が小さすぎる
//		divItems +='<div class=\"col-2 grid-img \">';
//		divItems +='<a href=\"#\" onclick=\"dispBookInformation(' + i + ')\"><img class=\"rounded\" src=\"' + data[i]["thumbnailurl"] + '\"/></a>';
//レイアウト崩れにつき、投稿者やタグの表示をコメントアウト
//		divItems +='<a class=\"user\"  href=\"#\" onclick=\"userSearch(' + i + ')\">' + data[i]["postuser"]  + '</a>';
////	tagArray = data[i]["hashtag"];
////	divItems +='<a class=\"tag\" href=\"#\" onclick=\"tagSearch(' + i + ')\">' + tagArray  + '</a>';
//		tagArray = data[i]["hashtag"].split('#');
//		for(var j =0; j < tagArray.length; j++){
//			divItems +='<a class=\"tag\" href=\"#\" onclick=\"tagSearch(' + i + ')\">' + tagArray[j]  + '</a>';
//		}
		divItems += '</div>';
		// ▲card終了
		$('#resultAreaMain').append(divItems);
	}
}

/* ***************************************************************************** */
/*                   ユーザー名検索、ハッシュタグ検索  　2/14追加              * */
/* ***************************************************************************** */
// @param {i} 選択した本に該当するjsonの配列番号
// @param {j} ハッシュタグの配列番号
// @param {mode} 検索モード[1:ユーザー名検索,2:ハッシュタグ検索]
function filterList(i, j, mode) {
	var tmpJsonData = JSON.parse(sessionStorage.getItem("searchJsonData"));
	var searchJsonData = JSON.parse(sessionStorage.getItem("masterJsonData"));
	var keyword = "";
	var tagArray = "";
	var newResult = $.grep(searchJsonData, function (e) {
		//ユーザ
		if (mode =="1") {
			keyword = tmpJsonData[i]["postuser"];
			return (e.postuser.match(keyword));
		//タグ
		} else {
			tagArray = tmpJsonData[i]["hashtag"].split('#');
			keyword = tagArray[j];
			return (e.hashtag.match(keyword));
		}
	});
	if(mode == "1"){
		$('#keywordSearchForm').val("@" + tmpJsonData[i]["postuser"]);
	} else {
		$('#keywordSearchForm').val("#" + tagArray[j]);
	}
	console.log(newResult);
	createBookshelf(newResult);

	//絞り込み用のjsonをセッションストレージに退避
	sessionStorage.removeItem("searchJsonData");
	sessionStorage.setItem("searchJsonData", JSON.stringify(newResult));


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
