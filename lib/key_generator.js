var KeyGenerator = function() {
	this.keyspace = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
};

KeyGenerator.prototype.createKey = function(keyLength) {
	var key = 'rabel-code';
	var index;
	for (var i = 0; i < keyLength; i++) {
		index = Math.floor(Math.random() * this.keyspace.length);
		key += this.keyspace.charAt(index);
	}
	return key;
};

module.exports = KeyGenerator;
