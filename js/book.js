/* ****************************************************************************** */
/* *                                    book.html                               * */
/* ****************************************************************************** */

/* ****************************************************************************** */
/*                                      初期処理                                * */
/* ****************************************************************************** */
$(function(){
	//表示項目の値設定。サインイン前だとjsonデータがないためエラーとなる
	init();
	//サインインチェック。サインインチェックは優先して実行したいが、画面遷移がうまくいかないためいったんこのままとする。
	checklogin();
});


/* ****************************************************************************** */
/*                            本をBibShareに投稿する                            * */
/* ****************************************************************************** */
$(function(){
	$('#postBookData').click(function(){

		//ユーザ名を取得
		var puser = sessionStorage.getItem("cogUsername");

	   	//URLの作成
	   	var url = "";
		var data = JSON.parse(sessionStorage.getItem("serchJsonData"));
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
	        $("#message").text("Posted Completely!!");
	        $("#message").addClass("alert-success");
	        $("#message").show();

		// 通信に失敗した時に実行
		}).fail(function(jqXHR, textStatus, errorThrown ) {
		   	$('#resultArieaBook').append("errorThrown : " + errorThrown.message);
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
	        $("#message").text("Posted Completely!!");
	        $("#message").addClass("alert-success");
	        $("#message").show();

		// 通信に失敗した時に実行
		}).fail(function(jqXHR, textStatus, errorThrown ) {
		   	$('#message').append("errorThrown : " + errorThrown.message);
		});
	});
});



/* ****************************************************************************** */
/*                            表示項目の値設定                                  * */
/* ****************************************************************************** */
function init() {
	var data = JSON.parse(sessionStorage.getItem("serchJsonData"));
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
	$("#sUrl").attr("src", value);

	//タイトル
	value =data[i]["booktitle"];
	$("#title").attr("value", value);

	//作者
	value =data[i]["author"];
	$("#authors").attr("value", value);

	//出版社
	value =data[i]["publisher"];
	$("#publisher").attr("value", value);

	//タグ
	value =data[i]["hashtag"];
	$("#tag").attr("value", value);

	//コメント(texiareaはappend。)
	value =data[i]["comment"];
	$("#comment").append(value);

}
