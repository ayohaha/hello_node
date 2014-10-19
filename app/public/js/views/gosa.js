
$(document).ready(function(){
	
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
				  document.location.href="/adminRegister";
			  } else if (data.success == false) {
				  alert("실패하였습니다.");
			  }
			}, "json");
	});
})