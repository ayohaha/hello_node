$(document).ready(function(){
	$("#gosa-form-container").hide();
	$("#register-form-container").hide();
	$("#examhall-form-container").hide();
	
	$("#examhall-register-form-btn1").click(function(){
		$("#examhall-form-container").hide();
	});
	
	$("#btn-gosa-register").click(function(){
		$("#gosa-form-container").show();
	});
	
	$("#gosa-form-btn1").click(function(){
		$("#gosa-form-container").hide();
	});
	
	$("#register-form-btn1").click(function(){
		$("#register-form-container").hide();
	});
	
	$(".register-list-btn").click(function() {
		location.href="/registerList/"+ $(this).data("number");
	});
	
	$(".user-register-btn").click(function() {
		$("#number-rf").val($(this).data("number"));
		$("#register-form-container").show();
	});
	
	
	
	$(".examhall-register-btn").click(function() {
		$("#number-ef").val($(this).data("number"));
		
		var phase = '';
		$("#examList").html('');
		// 회차별 신청 가능한 지역 가져오기
		$.get( "/examhallList/" + $("#number-ef").val()
				, function( data ) {	
				jQuery.each( data.examhall, function( i, val ) {
					phase = "<li>"+val['country']+"</li>";
					// 리스트~~
					$("#examList").append(phase);
				});
			}, "json");
		
		$("#examhall-form-container").show();
	});
	
	$("#BtnAddExamhallRegister").click(function() {
		$.post( "/examhallRegister"
				, {number: $("#number-ef").val(),
					country: $("#country-ef").val()
				   }
				, function( data ) {
			  if (data.success == true) {
				document.location.href="/adminRegister";
			  } else if (data.success == false) {
				  alert("이미 등록되었습니다.");
			  }
			}, "json");
	});
	
	
	$("#BtnAddUserRegister").click(function(){
		if(!confirm("선점 등록을 진행하시겠습니까?")){
			return false;
		}	
		
		$.post( "/proxyRegister"
				, {number: $("#number-rf").val(),
					user: $("#user-rf").val(),
					country: $("#country-rf").val()
				   }
				, function( data ) {
			  if (data.success == true) {
				document.location.href="/adminRegister";
			  } else if (data.success == false) {
				  alert("실패하였습니다.");
			  }
			}, "json");
	});
	
	$(".gosa-change-status-btn").click(function(){
		var number =  $(this).data("number"),
			status = $(this).val();
	
		if(!confirm(number + "회차의 상태변경을 진행하시겠습니까?")){
			return false;
		}	
		
		$.post( "/gosaUpdate"
				, {number: number, status: status}
				, function( data ) {
			  if (data.success == true) {
				  console.log(data.success);
				document.location.href="/adminRegister";
			  } else if (data.success == false) {
				  alert("실패하였습니다.");
			  }
			}, "json");
	});
	
	$(".gosa-delete-btn").click(function(){
		var number =  $(this).data("number");
		if(!confirm(number + "회를 삭제를 진행하시겠습니까?")){
			return false;
		}

		$.post( "/gosaDelete"
				, {number: $(this).data("number")}
				, function( data ) {

			  if (data.success == true) {
				document.location.href="/adminRegister";
			  } else if (data.success == false) {
				  alert("실패하였습니다.");
			  }
			}, "json");
	});
	
	$("#BtnAddRegister").click(function(){
		if(!confirm("출석고사를 등록하시겠습니까?")){
			return false;
		}
		var register = {
				'number'    : $("#number-tf").val(),
				'startDate' : $("#startDate-tf").val(),
				'examDate'  : $("#examDate-tf").val(),
				'status'    : $("#status-tf").val()
		};
		
		$.post( "/gosaRegister"
				, register
				, function( data ) {

				if (data.success == true) {
				location.href="/adminRegister";
				} else if (data.success == false) {
				alert("실패하였습니다.");
				}
			}, "json");
	});
});