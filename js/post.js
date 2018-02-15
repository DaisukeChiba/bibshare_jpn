/* ****************************************************************************** */
/* *                                    post.html                               * */
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
		//初期レイアウト表示
		init();
	}
});

/* ***************************************************************************** */
/*        検索１：Google Books API でテキスト検索を行い、結果を表示する        * */
/* ***************************************************************************** */
$(function(){
	$('#gbTextSearchBtn').click(function(){

	    // テキストエリアに値がない場合、処理を中断
	    var textValue = $('#keyword').val();
	    if(!textValue.length) return;

	    sendBooksAPI(textValue,1);
    });
});

/* ***************************************************************************** */
/*    検索２：バーコードよりISBNを取得 ⇒ Google Books API でISBN検索を行い、  * */
/*    結果を表示する                                                           * */
/* ***************************************************************************** */
//Quagga.jsでバーコードを読み取る参考:https://kuroeveryday.blogspot.jp/2017/12/barcode-scaner-with-quaggajs.html
$(function () {
	var qApp = {
		init: function () {
			qApp.attachListeners();
		},
		attachListeners: function () {
			// ファイルを選択を押したときの処理
			$('#gbIsbnSearchBtn').change(function(){
				if (this.files && this.files.length) {
					qApp.decode(URL.createObjectURL(this.files[0]));
				}
			});
		},
		// バーコードの種類
		decode: function (src) {
			config = $.extend({}, this.state, {
				src: src
			});
			Quagga.decodeSingle(config, function (result) {});
		},
		state: {
			inputStream: {
				size: 800
			},
			locator: {
				patchSize: "medium",
				halfSample: false
			},

			// Web Workerの数
			numOfWorkers: 1,

			// バーコードを読み込む
			decoder: {
				readers: [{
					format: "ean_reader",
					config: {}
				}]
			},
			// 画像内にバーコードの位置を示す（認識したときに枠で囲む）
			locate: true,
			// ↓ここにイメージソースを設置する
			src: null
		}
  	};
	//初期処理
	qApp.init();

	// バーコードが読み取れたときに実行
	Quagga.onDetected(function (result) {
		sendBooksAPI(result.codeResult.code, 2);

	});
});

/* ******************************************************************************* */
/*    検索３：選択した画像をCanvasで圧縮 ⇒ CloudVisionAPIで画像解析             * */
/*    ⇒ 取得した文字よりGoogle Books API でテキスト検索を行い、結果を表示する   * */
/* ******************************************************************************* */
$(function(){
	$('#gbImageSearchBtn').change(function(){

		var file = this.files[0];
		var reader = new FileReader();
		reader.readAsDataURL(file);

		reader.onload = function(e){
			var sourceImg = new Image();
			sourceImg.src = reader.result;
			sourceImg.onload = function() {
				var img = $('#dummy');
				//サイズ編集
				img.src = editImage(sourceImg);
		        // Base64形式データから先頭のファイル情報を削除(空文字に置換)
		        var base64 = img.src.replace(/^data:image\/(png|jpeg);base64,/, '');
		        // Cloud Vision APIの呼び出し
		         sendVisionAPI(base64);
			}
		}
	});
});

/* ***************************************************************************** */
/*                                  画像のサイズ編集                           * */
/* ***************************************************************************** */
// @param {sourceImg} イメージ画像
function editImage(sourceImg){

	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");

	var maxWidth = 500;
	var maxHeight = 500;

	var height = sourceImg.height;
	var width = sourceImg.width;
	var newHeight;
	var newWidth;
	var imageUrl;
	var capacityRatio;

	//サイズ決定
	if (height > maxHeight || width > maxWidth) {
		var rate1 = height / maxHeight;
		var rate2 = width / maxWidth;
		var rate = rate1 >=rate2 ? rate1 : rate2;

		newHeight = Math.round(height/rate);
		newWidth = Math.round(width/rate);
	} else {
		newHeight = height;
		newWidth = width;
	}
	
	canvas.width = newWidth;
	canvas.height = newHeight;
	context.drawImage(sourceImg, 0, 0, newWidth, newHeight);
	imageUrl = canvas.toDataURL("image/jpeg", 0.9);
	
	var originalBlob = base64ToBlob(imageUrl);
//	alert("size" + originalBlob["size"]);

	//容量が2MB以上かチェック。サイズ下げるだけでも大分容量が減るようですが、念のための処理。
    if(2000000 <= originalBlob["size"]) {
		//2MB以下に落とす
		capacityRatio = 2000000 / originalBlob["size"];
		imageUrl = canvasImage.toDataURL("image/jpeg", capacityRatio); //画質落としてバイナリ化
		var newBlob = base64ToBlob(imageUrl);
//		alert("size" + newBlob["size"]);
	}

	return imageUrl;
}

/* ***************************************************************************** */
/*                   引数のBase64の文字列をBlob形式にする                      * */
/* ***************************************************************************** */
function base64ToBlob(base64) {
    var base64Data = base64.split(',')[1], // Data URLからBase64のデータ部分のみを取得
          data = window.atob(base64Data), // base64形式の文字列をデコード
          buff = new ArrayBuffer(data.length),
          arr = new Uint8Array(buff),
          blob,
          i,
          dataLen;
    // blobの生成
    for (i = 0, dataLen = data.length; i < dataLen; i++) {
        arr[i] = data.charCodeAt(i);
    }
    blob = new Blob([arr], {type: 'image/jpeg'});
    return blob;
}

/* ***************************************************************************** */
/*           画像からCloud Vision APIを使用してテキスト解析結果を取得          * */
/* ***************************************************************************** */
// @param {base64string} Base64形式画像データ
function sendVisionAPI(base64string){
    // リクエストパラメータの生成
    var body = {
        requests: [
            {image: {content: base64string}, features: [{type: 'TEXT_DETECTION'}]}
        ]
    };
    // XHRによるCloud Vision APIの呼び出し
    var req = new XMLHttpRequest();
    req.onreadystatechange = function(){
        if((req.readyState == 4) && (req.status == 200)){
            console.log('--- Cloud Vision API ---');
            console.log(req.responseText);
            var res = JSON.parse(req.responseText);
//            alert(res.responses[0].textAnnotations[0].description);
//			if(!confirm('この本を検索しますか？')){
//		        /* キャンセルの時の処理 */
//		        return false;
//		    }
            // Google Books APIの呼び出し
            sendBooksAPI(res.responses[0].textAnnotations[0].description, 1);
        }
        if(req.status >= 400){
            alert("ERROR!");
        }
    }
    req.open('POST', 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyAjUbkdq7vKPWeQBeeryykQJfeobBBoXK8', true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify(body));
}

/* ***************************************************************************** */
/*                検出したテキストからGoogle Books APIで書籍情報を取得         * */
/* ***************************************************************************** */
// @param {serchparam} 検索キーワード または isbnコード
// @param {mode} 検索モード[1:文字検索,2:isbn検索]
function sendBooksAPI(serchparam, mode){

	// 画面表示領域のクリア
   	$('#resultAreaPost').empty();
   	//URLの作成
   	var url = "";
   	if(mode == "1") {
   		url = "https://www.googleapis.com/books/v1/volumes?q=";
   	} else {
   		url = "https://www.googleapis.com/books/v1/volumes?q=isbn:";
   	}

	// $.ajaxメソッドで通信
	$.ajax({	
		url:url + serchparam, // 通信先のURL
		type:'GET',		// 使用するHTTPメソッド (GET/ POST)
		dataType:'json',	 // 応答のデータの種類 
		timeout:100000, 		// 通信のタイムアウトの設定(ミリ秒)　←落ちる原因かもなので、増やしてみました！！

	// 通信に成功した時に実行
	}).done(function(data,textStatus,jqXHR) {
		console.log(data);
		var imgView = "";
		if (data.totalItems == "0") {
			$('#resultAreaPost').append("取得0件");
			return;
		}

		var value="";
		var ulItems="";
		
		for(var i = 0; i < data.items.length;  i++  ) {
			value="";
			ulItems=""

			ulItems +='<li class=\"list-group-item\">';
			ulItems +='<div class=\"row justify-content-center\">';
			ulItems +='<div class=\"col-sm-3 text-center\">';

			//サムネイル
			//要素がない場合があるので、事前にチェック
			if('imageLinks' in data.items[i].volumeInfo){
				value =data.items[i].volumeInfo.imageLinks.smallThumbnail;
			} else {
				//NoImageとか...
				value ='image/book_01.jpg'
			}
			ulItems +='<img class=\"rounded grid-img\" src=\"' + value + '\">';
			ulItems +='<button type=\"button\" class=\"btn btn-primary btn-block mt-3\" onclick=\"postBookInformation(' + i + ')\">Select</button>';
			ulItems +='</div>';
			ulItems +='<div class=\"col-9 mt-2\">';
			ulItems +='<form>';
			
			
			//タイトル
			if('title' in data.items[i].volumeInfo){
				value =data.items[i].volumeInfo.title;
			} else {
				value ="";
			}
			ulItems +='<div class=\"row\">';
			ulItems +='<label class=\"col-sm-3 text-info\">Title</label>';
			ulItems +='<div class=\"col-sm-9\">';
			ulItems +='<label>' + value + '</label>';
			ulItems +='</div>';
			ulItems +='</div>';


			//作者
			if('authors' in data.items[i].volumeInfo){
				value =data.items[i].volumeInfo.authors;
			} else {
				value ="";
			}
			ulItems +='<div class=\"row\">';
			ulItems +='<label class=\"col-sm-3 text-info\">Author</label>';
			ulItems +='<div class=\"col-sm-9\">';
			ulItems +='<label>' + value + '</label>';
			ulItems +='</div>';
			ulItems +='</div>';

			//出版社
			if('publisher' in data.items[i].volumeInfo){
				value =data.items[i].volumeInfo.publisher;
			} else {
				value ="";
			}
			ulItems +='<div class=\"row\">';
			ulItems +='<label class=\"col-sm-3 text-info\">Publisher</label>';
			ulItems +='<div class=\"col-sm-9\">';
			ulItems +='<label>' + value + '</label>';
			ulItems +='</div>';
			ulItems +='</div>';
			ulItems +='</form>';
			ulItems +='</div>';
			ulItems +='</div>';
			ulItems +='</li>';

				
			$('#resultAreaPost').append(ulItems);
		}

		//検索結果エリアを表示
		$('#resultArea').show();

		//検索入力エリアの上部の空行を非表示
		$('#dummymargin').unwrap();
		//画面最上部へスクロール todo:うまく動いてない⇒2/11対応
		$(window).scrollTop(0);

   		//投稿にて利用するので、jsonをセッションストレージに退避
		sessionStorage.removeItem("gbJsonData");
		sessionStorage.setItem("gbJsonData", JSON.stringify(data));

	// 通信に失敗した時に実行
	}).fail(function(jqXHR, textStatus, errorThrown ) {
//		$(resultAreaPost).html("errorThrown : " + errorThrown.message);
		alert('error!!');
		console.log(jqXHR.status);

	});
}

/* ***************************************************************************** */
/*                        検索結果から選択した本を投稿する                     * */
/* ***************************************************************************** */
// @param {i} 選択した本に該当するjsonの配列番号
function postBookInformation(i){

	//セッションストレージに値を設定
	sessionStorage.removeItem("selectNo");
	sessionStorage.setItem("selectNo", i);
	//book.htmlで利用するためにjsonデータを生成し、セッションストレージに値を設定
	setJson();

     var url = "book.html";
     $(location).attr("href", url);
//     $(".wrapper").addClass("form-success"); 
}

/* ************************************************************************************ */
/*   book.htmlで利用するためにjsonデータを生成し、セッションストレージに値を設定      * */
/* ************************************************************************************ */
//main.htmlのjsonとpost.htmlのjsonを同じ形にする。
function setJson(){
	var data = JSON.parse(sessionStorage.getItem("gbJsonData"));
	var i = sessionStorage.getItem("selectNo");


	//作者
	var author = "";
	if('authors' in data.items[i].volumeInfo){
		author =data.items[i].volumeInfo.authors;
	} else {
		author ="";
	}
	//タイトル
	var booktitle = "";
	if('title' in data.items[i].volumeInfo){
		booktitle =data.items[i].volumeInfo.title;
	} else {
		booktitle ="";
	}
	//コメント
	var comment = "";

	//タグ
	var hashtag = "";

	//id
	var id = "";

	//ISBNコード
	var isbncode = "";
	if('isbncode' in data.items[i].volumeInfo){
		isbncode =data.items[i].volumeInfo.industryIdentifiers[0];
	} else {
		isbncode ="";
	}
	//投稿日
	var postdate = "";

	//投稿者
	var postuser = "";

	//出版社
	var publisher = "";
	if('publisher' in data.items[i].volumeInfo){
		publisher =data.items[i].volumeInfo.publisher;
	} else {
		publisher ="";
	}

	//サムネイル
	var thumbnail = "";
	if('imageLinks' in data.items[i].volumeInfo){
		thumbnail =data.items[i].volumeInfo.imageLinks.smallThumbnail;
	} else {
		//NoImageとか...
		thumbnail ='image/book_01.jpg'
	}

	var data=[
		{
		    "author": author, 
		    "booktitle": booktitle, 
		    "comment": comment, 
		    "id": id, 
		    "hashtag": hashtag, 
		    "isbncode": isbncode, 
		    "postdate": postdate, 
		    "postuser": postuser, 
		    "publisher": publisher, 
		    "thumbnailurl":thumbnail
		}
	];
	
	console.log(data);
	sessionStorage.removeItem("searchJsonData");
	sessionStorage.setItem("searchJsonData", JSON.stringify(data));
	//配列番号を0に上書き　2/10障害対応
	sessionStorage.setItem("selectNo", "0");

}

/* ***************************************************************************** */
/*                                 初期レイアウト表示                          * */
/* ***************************************************************************** */
function init(){
	//検索結果エリアを非表示
	$('#resultArea').hide();

}
