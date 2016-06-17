var fs = require('fs');

function getFiles() {
	var content = fs.readFileSync(__dirname + '/srcList.txt', 'utf8');
	var files = content.split(/\r\n|\n/);
	files = files.filter(function(f) {
		return f;
	});
	files = files.map(function(f) {
		return f.replace(/^\.\.\//, '');
	});
	// files.unshift('build/header.js');
	// files.push('build/footer.js');
	return files;
}

exports.getFiles = getFiles;
