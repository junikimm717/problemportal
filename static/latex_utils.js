function encodeHTML(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
const render = (str) => {
	const ar = [['', false]];
	let aslatex = false;
	for (let i = 0; i < str.length; i++) {
		if (str[i] == '$') {
			aslatex = !aslatex;
			ar.push(['', aslatex]);
			continue;
		} else if (i == 0) {
			ar.push(['', aslatex]);
		}
		ar[ar.length - 1][0] += str[i];
	}
	const ktx = (x) =>
		katex.renderToString(x, { throwOnError: false, displayMode: false });
	return ar
		.map(([str, latex]) => (latex ? ktx(str) : encodeHTML(str)))
		.join('');
};
