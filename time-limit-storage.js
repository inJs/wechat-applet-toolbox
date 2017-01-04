// one day
var DEFAULT_TTL_NUMBER = 1000 * 60 * 60 * 24;

var getStorageWrapper = function(data, ttl) {

	data = data || {};

	if(!ttl || typeof +ttl !== 'number' || (+ttl).toString() === 'NaN') {
		ttl = DEFAULT_TTL_NUMBER;
	}

	return {
		ttl: ttl, // 有效时间
		storeTime: Date.now(), // 存储时间
		data: data // 存储目标
	}
};

var filter = function(obj, key, mode) {
	if(!obj) {
		return obj;
	}

	var data = mode === 'sync' ? obj : obj.data;
	var errMsg = obj.errMsg;

	if(Date.now() - data.storeTime > data.ttl) {

		console.warn('data was expired！');

		wx.removeStorage({
			key: key,
			success: function() {
				console.log('expired data removed!');
			},
			fail: function(reason) {
				console.log('expired data removal failed：' + reason);
			}
		});

		data = null;
		errMsg = 'getStorage:expired';
	}

	var result = mode === 'sync' ? data.data : {data: data.data, errMsg: errMsg};

	return result;
};

module.exports = {
	setStorage: function(opts) {
		if(!opts || typeof opts !== 'object') {
			throw Error('opts must be a obejct!');
		}

		var data = getStorageWrapper(opts.data, opts.ttl);

		opts.data = data;
		opts.key = opts.key;

		delete opts.ttl;

		return wx.setStorage(opts);
	},
	setStorageSync: function(key, data, ttl) {
		var wrapper = getStorageWrapper(data, ttl);

		return wx.setStorageSync(key, wrapper);
	},
	getStorage: function(opts) {
		return wx.getStorage({
			key: opts.key,
			success: function(result) {
				var success = opts.success;

				if(!success || typeof success !== 'function') {
					return;
				}

				success(filter(result, opts.key));
			},
			fail: function(reason) {
				var fail = opts.fail;

				if(!fail || typeof fail !== 'function') {
					return;
				}

				fail(reason);
			},
			complete: function(obj) {
				var complete = opts.complete;

				if(!complete || typeof complete !== 'function') {
					return;
				}

				complete && complete(filter(obj, opts.key));
			}
		});
	},
	getStorageSync: function(key) {
		var result = wx.getStorageSync(key);

		return filter(result, key, 'sync');
	},
	getStorageInfo: wx.getStorageInfo,
	getStorageInfoSync: wx.getStorageInfoSync,
	removeStorage: wx.removeStorage,
	removeStorageSync: wx.removeStorageSync,
	clearStorage: wx.clearStorage,
	clearStorageSync: wx.clearStorageSync
};
