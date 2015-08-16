var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('url')) : typeof define === 'function' && define.amd ? define(['url'], factory) : global.superagentBatch = factory(global.url);
})(this, function (url) {
  'use strict';

  var boundaryString = '1439751438138';
  var boundarySeparator = '--';
  var newLine = '\r\n';
  var httpVersion = 'HTTP/1.1';
  var contentType = 'Content-Type';

  var parseUrl = function parseUrl(urlString) {
    return url.parse(urlString);
  };

  var buildRequest = function buildRequest(req, serialize) {
    var body = [];

    var _parseUrl = parseUrl(req.url);

    var pathname = _parseUrl.pathname;
    var host = _parseUrl.host;

    var query = req._query.length ? '?' + req._query.join('&') : '';
    body.push(boundarySeparator + boundaryString);
    body.push('Content-Type: application/http; msgtype=request');
    body.push('');
    body.push(req.method + ' ' + pathname + query + ' ' + httpVersion);
    if (host === null && !window) {
      throw 'Couldn\'t determine host name for batched request';
    }
    body.push('Host: ' + (host || window.location.host));
    Object.keys(req.header).forEach(function (header) {
      return body.push(header + ': ' + req.header[header]);
    });
    body.push('');
    if (req._data) {
      if (req.header[contentType] && serialize[req.header[contentType]]) {
        body.push(serialize[req.header[contentType]](req._data));
      } else {
        body.push(serialize(req._data));
      }
    }
    body.push('');
    return body.join(newLine);
  };

  var createBatchingAgent = function createBatchingAgent(superagent, containerRequest) {
    var batches = [];

    var BatchingAgent = (function (_superagent) {
      _inherits(BatchingAgent, _superagent);

      function BatchingAgent() {
        _classCallCheck(this, BatchingAgent);

        _get(Object.getPrototypeOf(BatchingAgent.prototype), 'constructor', this).apply(this, arguments);
      }

      return BatchingAgent;
    })(superagent);

    var oldEnd = BatchingAgent.Request.prototype.end;
    BatchingAgent.endBatch = function (callback) {
      var _this = this;

      BatchingAgent.Request.prototype.end = oldEnd;
      console.log(batches);

      var requests = batches.map(function (req) {
        return buildRequest(req, _this.serialize);
      });
      requests.push(boundarySeparator + boundaryString + boundarySeparator);

      console.log(requests);
      containerRequest.send(requests.join(newLine));
      containerRequest.end(function (err, res) {
        //callback(err, res);
      });
    };
    BatchingAgent.Request.prototype.end = function end(callback) {
      this._callback = callback;
      batches.push(this);
      return BatchingAgent;
    };
    return BatchingAgent;
  };

  var superagentBatch = function superagentBatch(superagent) {
    superagent.Request.prototype.startBatch = function () {
      this.set('Content-Type', 'multipart/mixed; boundary=' + boundaryString);
      return createBatchingAgent(superagent, this);
    };
    return superagent;
  };

  var superagent_batch = superagentBatch;

  return superagent_batch;
});
//# sourceMappingURL=superagent-batch.js.map