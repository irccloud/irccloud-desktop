// var remote = require('electron').remote;
// var webFrame = require('electron').webFrame;
// var ipcRenderer = require('electron').ipcRenderer;

// var nodeSpellcheck = require('spellchecker');

// var config = remote.getGlobal('config');

// var spellCheckWhileTyping = config.get('spellcheck');

// function resetSuggestions() {
//   setSuggestions({});
// }
// function setSuggestions(suggestions) {
//   ipcRenderer.send('set-spelling-suggestions', suggestions);
// }
// function enableSpellcheck () {
//   spellCheckWhileTyping = true;
// }
// function disableSpellcheck () {
//   spellCheckWhileTyping = false;
// }

// function handleSpellcheckToggle () {
//   ipcRenderer.on('disable-spellcheck', function (event) {
//     disableSpellcheck();
//   });
//   ipcRenderer.on('enable-spellcheck', function (event) {
//     enableSpellcheck();
//   });
// }

// function setupSpellcheck () {
//   resetSuggestions();
//   handleSpellcheckToggle();

//   var locale = remote.getBuiltin('app').getLocale();

//   // https://github.com/electron-userland/electron-spellchecker/blob/6da4984fcecb9ea05d322abf66ac904252e61c35/src/spell-check-handler.js#L52-L70
//   // NB: This is to work around electron/electron#1005, where contractions
//   // are incorrectly marked as spelling errors. This lets people get away with
//   // incorrectly spelled contracted words, but it's the best we can do for now.
//   const contractions = [
//     "ain't", "aren't", "can't", "could've", "couldn't", "couldn't've", "didn't", "doesn't", "don't", "hadn't",
//     "hadn't've", "hasn't", "haven't", "he'd", "he'd've", "he'll", "he's", "how'd", "how'll", "how's", "I'd",
//     "I'd've", "I'll", "I'm", "I've", "isn't", "it'd", "it'd've", "it'll", "it's", "let's", "ma'am", "mightn't",
//     "mightn't've", "might've", "mustn't", "must've", "needn't", "not've", "o'clock", "shan't", "she'd", "she'd've",
//     "she'll", "she's", "should've", "shouldn't", "shouldn't've", "that'll", "that's", "there'd", "there'd've",
//     "there're", "there's", "they'd", "they'd've", "they'll", "they're", "they've", "wasn't", "we'd", "we'd've",
//     "we'll", "we're", "we've", "weren't", "what'll", "what're", "what's", "what've", "when's", "where'd",
//     "where's", "where've", "who'd", "who'll", "who're", "who's", "who've", "why'll", "why're", "why's", "won't",
//     "would've", "wouldn't", "wouldn't've", "y'all", "y'all'd've", "you'd", "you'd've", "you'll", "you're", "you've"
//   ];

//   // The words we get passed are split on both sides of an apostrophe
//   const contractionMap = contractions.reduce((acc, word) => {
//     let parts = word.toLocaleLowerCase().split("'");
//     parts.forEach((part) => {
//       acc[part] = true;
//     });
//     return acc;
//   }, {});

//   function isMisspelled (word) {
//     if (contractionMap[word.toLocaleLowerCase()]) {
//       return false;
//     }
//     return nodeSpellcheck.isMisspelled(word);
//   }

//   var provider = {
//     spellCheck: function (words, callback) {
//       if (!spellCheckWhileTyping) {
//         return;
//       }
//       setTimeout(function () {
//         var misspellings = [];
//         var suggestions = {};
//         words.forEach(function (word) {
//           if (isMisspelled(word)) {
//             misspellings.push(word);
//             if (!suggestions[word]) {
//               suggestions[word] = nodeSpellcheck.getCorrectionsForMisspelling(word).slice(0,3);
//             }
//           }
//         });
//         setSuggestions(suggestions);
//         callback(misspellings);
//       }, 0);
//     }
//   };
//   webFrame.setSpellCheckProvider(locale, provider);
// }

// module.exports = setupSpellcheck;
