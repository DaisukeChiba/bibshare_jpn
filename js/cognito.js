// Initialize the Amazon Cognito credentials provider
AWSCognito.config.region = "ap-northeast-1";
var data = {
    UserPoolId: 'ap-northeast-1_ZrN6tl339',
    ClientId: '6njr58hp691osujb40dgjh5hkk'
};
var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(data);
var attributeList = [];
var cognitoUser;

/* ****************************************************************************** */
/* *                                サインアップ                                * */
/* ****************************************************************************** */
$(function(){
	$("#sign_up_btn").click(function() {
	    $("#message").empty();
	    $("#message").hide();
	    username = $("#inputUsername").val();
	    email = $("#inputEmail").val();
	    password = $("#inputPassword").val();
	    if(!username) {
	        $("#message").text("Input User name !!");
	        $("#message").addClass("alert-danger");
	        $("#message").show();
	        return false;
	    }
	    if(!email) {
	        $("#message").text("Input Email address !!");
	        $("#message").addClass("alert-danger");
	        $("#message").show();
	        return false;
	    }
	    if(!password) {
	        $("#message").text("Input Password !!");
	        $("#message").addClass("alert-danger");
	        $("#message").show();
	        return false;
	    }
	    var dataEmail = {
	        Name : "email",
	        Value : email
	    };
	    var attributeEmail = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataEmail);
	    attributeList.push(attributeEmail);
	    userPool.signUp(username, password, attributeList, null, function(err, result){
	        if (err) {
	            console.log(err);
	            $("#message").text(err);
	            $("#message").addClass("alert-danger");
	            $("#message").show();
	        } else {
	             alert('サインアップが完了しました\n' +
	             'verification codeを記載したメールを送信しましたので' +
	             '次のアクティベーション画面で登録してください');
	             var url = "activation.html";
	             $(location).attr("href", url);
	             $(".wrapper").addClass("form-success");
	        }
	    });
	});
});

/* ****************************************************************************** */
/* *                            アクティベーション                              * */
/* ****************************************************************************** */
$(function(){
	$("#activate_btn").click(function() {
	    $("#message").empty();
	    $("#message").hide();
	    username = $("#inputUsername").val();
	    actcode = $("#actcode").val();
	    if(!username) {
	        $("#message").text("Input User name !!");
	        $("#message").addClass("alert-danger");
	        $("#message").show();
	        return false;
	    }
	    if(!actcode) {
	        $("#message").text("Input Activation Key !!");
	        $("#message").addClass("alert-danger");
	        $("#message").show();
	        return false;
	    }
	    var userData = {
	        Username : username,
	        Pool : userPool
	       };
	    cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
	    cognitoUser.confirmRegistration(actcode, true, function(err, result){
	        if (err) {
	            console.log(err);
	            message_text = err;
	            message_class = "alert-danger";
	            $("#message").text(message_text);
	            $("#message").addClass(message_class);
	            $("#message").show();
	        } else {
	             alert('アクティベーションが完了しました\n' +
	             '次の画面でサインインを行ってください');
	             var url = "signin.html";
	             $(location).attr("href", url);
//	             $(".wrapper").addClass("form-success"); 
	        }
	    });
	});
});

/* ****************************************************************************** */
/* *                                  サインイン                                * */
/* ****************************************************************************** */
$(function(){
	$("#sign_in_btn").click(function() {
	    $("#message").empty();
	    $("#message").hide();
	    username = $("#inputUsername").val();
	    password = $("#inputPassword").val();
	    if(!username) {
	        $("#message").text("Input User name !!");
	        $("#message").addClass("alert-danger");
	        $("#message").show();
	        return false;
	    }
	    if(!password) {
	        $("#message").text("Input Password !!");
	        $("#message").addClass("alert-danger");
	        $("#message").show();
	        return false;
	    }
	    //event.preventDefault();
	    var authenticationData = {
	        Username : username,
	        Password : password
	    };
	    var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
	    var userData = {
	        Username : username,
	        Pool : userPool
	        };
	    cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
	//    console.log(cognitoUser);
	    cognitoUser.authenticateUser(authenticationDetails, {
	        onSuccess: function (result) {

				//本棚画面へ遷移
	            var url = "main.html";
	                $(location).attr("href", url);
//	            $(".wrapper").addClass("form-success"); 
	        },
	        onFailure: function(err) {
	            console.log(err);
	            message_text = err;
	            message_class = "alert-danger";
	            $("#message").text(message_text);
	            $("#message").addClass(message_class);
	            $("#message").show();
	            return;
	        },
	    });
	});
});


/* ****************************************************************************** */
/* *                          サインアップへのリンク                            * */
/* ****************************************************************************** */
$(function(){
	$("#sign_up_link").click(function() {
         var url = "signup.html";
         $(location).attr("href", url); 
	});
});

/* ****************************************************************************** */
/* *                              サインインチェック                            * */
/* ****************************************************************************** */
function checklogin () {
   cognitoUser = userPool.getCurrentUser();
    //サインイン済みの場合
    if (cognitoUser != null) {
        cognitoUser.getSession(function(err, result) {
            if (result) {
                cognitoUser.getUserAttributes(function(err, attrresult) {
                    if (err) {
                        alert(err);
                        return 1;
                    }
					//セッションストレージにユーザ名を設定
					sessionStorage.setItem("cogUsername", cognitoUser.username);
					return 0;
                });
            } else {
		        console.log("cognitoUser.getSession - Error.");
				return 1;
            }
        });
    //サインイン済みでない場合
    } else {
        console.log("cognitoUser.getSession - Null.");
		return 1;
    }
}

/* ****************************************************************************** */
/* *                                   サインアウト                             * */
/* ****************************************************************************** */
$(function(){
	$("#sign_out_btn").click(function() {
	    cognitoUser = userPool.getCurrentUser();
	    if (cognitoUser != null) {
	        console.log(cognitoUser);
	        cognitoUser.signOut();
	    }
		console.log("cognitoUser is null.");
		var url = "signin.html";
		$(location).attr("href", url);
//		$(".wrapper").addClass("form-success"); 

	});
});

//画面を閉じた際の処理。
//サインアウトさせたかったが、画面遷移時にも有効となってしまうためコメントアウト
//$(window).on("unload",function(e){
//    cognitoUser = userPool.getCurrentUser();
//    if (cognitoUser != null) {
//        console.log(cognitoUser);
//        cognitoUser.signOut();
//    }
//});


/* ***************************************************************************** */
/*                    入力欄のエンターキー無効化(2/13追加)                     * */
/* ***************************************************************************** */
$(function(){
    $("input"). keydown(function(e) {
        if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
            return false;
        } else {
            return true;
        }
    });
});
