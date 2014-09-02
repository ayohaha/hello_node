
$(document).ready(function(){
	
	var av = new AccountValidator();
	var sc = new RegisterController();
	
	$('#account-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			return av.validateForm();
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') $('.modal-alert').modal('show');
		},
		error : function(e){
			if (e.responseText == 'email-taken'){
			    av.showInvalidEmail();
			}	else if (e.responseText == 'username-taken'){
			    av.showInvalidUserName();
			}
		}
	});
	$('#name-tf').focus();
	
// customize the account signup form //
	
	$('#account-form h1').text('8회차 8월 28일 출석고사');
	$('#account-form #sub1').text('@todo 지역선택할 수 있는 폼');
	$('#account-form #sub2').text('Choose your username & password');
	$('#account-form-btn1').html('Cancel');
	$('#account-form-btn2').html('신청하기');
	$('#account-form-btn2').addClass('btn-primary');
	
// setup the alert that displays when an account is successfully created //

	$('.modal-alert').modal({ show : false, keyboard : false, backdrop : 'static' });
	$('.modal-alert .modal-header h3').text('Success!');
	$('.modal-alert .modal-body p').html('Your account has been created.</br>Click OK to return to the login page.');

	
	$(".BtnAddRegister").click(function(){

		var register = {
				'user' : $("#userUserId").val(),
				'name' : $("#userName").val(),
				'email': $("#userEmail").val(),
				'team': 'eWebOne',
				'country': $(this).val()
				
		};
		console.log(register);
		
		$.post( "/register"
				, register
				, function( data ) {
			  console.log( data ); 
			}, "json");
	});
})