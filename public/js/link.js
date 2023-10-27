var text_1 = '很抱歉，该页面链接已变更，请返回首页或前往新链接',
text_2 = 'Sorry, the link of this page has changed. Please return to the home page or go to a new link';
repeat(text_1, 1);
setTimeout(function () {
  repeat(text_2, 2);
}, text_1.length * 100 + 1000);

function repeat(text, n) {
  var i = 0,
  repeatable = setInterval(function () {
    $('#text_' + n).text($('#text_' + n).text() + text[i]);
    i++;
    if (i >= text.length) {
      clearInterval(repeatable);
    }
  }, 100);
}
//# sourceURL=pen.js