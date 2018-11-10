/*
 * Write your JS code in this file.  Don't forget to include your name and
 * @oregonstate.edu email address below.
 *
 * Name: Ashyan Rahavi
 * Email: rahavia@oregonstate.edu
 */
//$ = require('jQuery');


document.getElementById('filter-update-button').addEventListener('click', function() {
  var textContent = document.getElementById("filter-text").value.toLowerCase();
  $.ajax({
		url: '/update-text',
		type: 'POST',
		data: {newText: textContent}
	});

});
