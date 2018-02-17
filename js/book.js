/* ****************************************************************************** */
/* *                                    book.html                               * */
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
		//表示項目の値設定
		init();
	}
});


/* ****************************************************************************** */
/*                            本をBibShareに投稿する                            * */
/* ****************************************************************************** */
$(function(){
	$('#insertBookData,#updateBookData').click(function(){

		//ユーザ名を取得
		var puser = sessionStorage.getItem("cogUsername");

	   	//URLの作成
	   	var url = "";
		var data = JSON.parse(sessionStorage.getItem("searchJsonData"));
		var i = sessionStorage.getItem("selectNo");
		var id ="";
		id =data[i]["id"];
		//idに値がなければinsert
	   	if(id == "") {
	   		url = "http://ec2-52-198-38-64.ap-northeast-1.compute.amazonaws.com:1880/insert_db";
	   	} else {
	   		url = "http://ec2-52-198-38-64.ap-northeast-1.compute.amazonaws.com:1880/update_db";
	   	}

		// $.ajaxメソッドで通信
		$.ajax({	
			url:url, // 通信先のURL
			type:'POST',		// 使用するHTTPメソッド (GET/ POST)
			dataType:'json',	 // 応答のデータの種類
			data:{
			    "id":id, 
			    "user":puser, 
			    "booktitle": $("#title").val(), 
			    "thumbnailurl": $("#sUrl").attr('src'), 
			    "author": $("#authors").val(), 
			    "publisher": $("#publisher").val(), 
			    "isbncode": data[i]["isbncode"], 
			    "hashtag": $("#tag").val(), 
			    "comment": $("#comment").val()
			},
			timeout:100000, 		// 通信のタイムアウトの設定(ミリ秒)　←落ちる原因かもなので、増やしてみました！！
			cache:false, 		// キャッシュオフ

		// 通信に成功した時に実行
		}).done(function(data,textStatus,jqXHR) {
			var url = "main.html";
			$(location).attr("href", url);
//	        $("#message").text("Posted Completely!!");
//	        $("#message").addClass("alert-success");
//	        $("#message").show();

		// 通信に失敗した時に実行
		}).fail(function(jqXHR, textStatus, errorThrown ) {
			alert('error!!');
//	        $("#message").empty();
//		   	$('#resultArieaBook').append("errorThrown : " + errorThrown.message);
		});
	});
});

/* ****************************************************************************** */
/*      	               本をBibShareから削除する　2/14追加                   * */
/* ****************************************************************************** */
$(function(){
	$('#deleteBookData').click(function(){

		//ユーザ名を取得
		var puser = sessionStorage.getItem("cogUsername");

	   	//URLの作成
	   	var url = "";
		var data = JSON.parse(sessionStorage.getItem("searchJsonData"));
		var i = sessionStorage.getItem("selectNo");
		var id ="";
		id =data[i]["id"];

		// $.ajaxメソッドで通信
		$.ajax({	
			url:'http://ec2-52-198-38-64.ap-northeast-1.compute.amazonaws.com:1880/delete_db', // 通信先のURL
			type:'POST',		// 使用するHTTPメソッド (GET/ POST)
			dataType:'json',	 // 応答のデータの種類
			data:{
			    "id":id
			},
			timeout:100000, 		// 通信のタイムアウトの設定(ミリ秒)　←落ちる原因かもなので、増やしてみました！！
			cache:false, 		// キャッシュオフ

		// 通信に成功した時に実行
		}).done(function(data,textStatus,jqXHR) {
			var url = "main.html";
			$(location).attr("href", url);

		// 通信に失敗した時に実行
		}).fail(function(jqXHR, textStatus, errorThrown ) {
			alert('error!!');
		});
	});
});

/* ****************************************************************************** */
/*                            本をSlackに投稿する                               * */
/* ****************************************************************************** */
$(function(){
	$('#postSlack').click(function(){
		var puser = sessionStorage.getItem("cogUsername");
		// $.ajaxメソッドで通信
		$.ajax({	
			url:'http://ec2-52-198-38-64.ap-northeast-1.compute.amazonaws.com:1880/slack_in', // 通信先のURL
			type:'POST',		// 使用するHTTPメソッド (GET/ POST)
			dataType:'json',	 // 応答のデータの種類
			data:{
			    "user":puser, 
			    "booktitle": $("#title").val(), 
			    "thumbnailurl": $("#sUrl").attr('src')
			},
			timeout:100000, 		// 通信のタイムアウトの設定(ミリ秒)　←落ちる原因かもなので、増やしてみました！！
			cache:false, 		// キャッシュオフ

		// 通信に成功した時に実行
		}).done(function(data,textStatus,jqXHR) {
//	        alert('Posted Completely.');
//			var url = "main.html";
//			$(location).attr("href", url);
//	        $("#message").text("Posted Completely!!");
//	        $("#message").addClass("alert-success");
//	        $("#message").show();

		// 通信に失敗した時に実行
		}).fail(function(jqXHR, textStatus, errorThrown ) {
			alert('error!!');
//	        $("#message").empty();
//		   	$('#resultArieaBook').append("errorThrown : " + errorThrown.message);
		});
	});
});


/* ****************************************************************************** */
/*                         編集表示への切り替え　2/14追加                       * */
/* ****************************************************************************** */
$(function(){
	$('#editBookData').click(function(){
		//入力フォームエリアを表示
		$('#editArea').show();
		$('#detailArea').hide();
		$('#insertBookData').hide();
		$('#updateBookData').show();
		$('#deleteBookData').show();
		$(window).scrollTop(0);
	});
});

/* ****************************************************************************** */
/*          表示項目の値設定 ・編集/参照表示の出し分け　2/14修正                * */
/* ****************************************************************************** */
function init() {
	var data = JSON.parse(sessionStorage.getItem("searchJsonData"));
	console.log(data);
	var i = sessionStorage.getItem("selectNo");
	var value="";

	//サムネイル
	value =data[i]["thumbnailurl"];
	//要素がない場合があるので、事前にチェック
	if(value ==""){
		//NoImageとか...
		value ='image/book_01.jpg'
	}
	$('#sUrl').attr("src", value);

	//タイトル
	value =data[i]["booktitle"];
	$('#title').attr("value", value);
	$('#dispTitle').append(value);

	//作者
	value =data[i]["author"];
	$('#authors').attr("value", value);
	$('#dispAuthors').append(value);

	//出版社
	value =data[i]["publisher"];
	$('#publisher').attr("value", value);
	$('#dispPublisher').append(value);

	//タグ
	value =data[i]["hashtag"];
	$('#tag').attr("value", value);
	$('#dispTag').append(value);

	//コメント(textareaはappend。)
	value =data[i]["comment"];
	$('#comment, #dispComment').append(value);

	value =data[i]["id"];
	//新規の時
	if(value =="") {
		//入力フォームエリアを表示
		$('#editArea').show();
		$('#detailArea').hide();
		$('#insertBookData').show();
		$('#updateBookData').hide();
		$('#deleteBookData').hide();

	//更新の時
	} else {
		//参照エリアを表示
		$('#detailArea').show();
		$('#editArea').hide();
		//投稿ユーザの場合
		var puser = sessionStorage.getItem("cogUsername");
		if(puser == data[i]["postuser"]){
			$('#editBookData').show();
		} else {
			$('#editBookData').hide();
		}
	}
}
