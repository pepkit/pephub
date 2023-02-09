// debounce a callback with a specified delay
// https://davidwalsh.name/javascript-debounce-function
//
// @param {function} func - the function to debounce
// @param {number} wait - the delay in milliseconds
// @param {boolean} immediate - whether to execute the function immediately
// @returns {function} - the debounced function
const debounce = (func, wait, immediate) => {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};
