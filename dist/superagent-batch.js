var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('url'), require('superagent')) : typeof define === 'function' && define.amd ? define(['url', 'superagent'], factory) : global.superagentBatch = factory(global.url, global.request);
})(this, function (url, request) {
  'use strict';

  var boundaryString = '1439751438138';
  var boundarySeparator = '--';
  var newLine = '\r\n';
  var httpVersion = 'HTTP/1.1';
  var contentType = 'Content-Type';

  function BatchResponse(req, parsedResponse) {
    this.req = req;
    this.text = parsedResponse.body;
    this.statusText = parsedResponse.statusMessage;
    this.setStatusProperties(parseInt(parsedResponse.status));
    this.header = this.headers = parsedResponse.headers;
    this.setHeaderProperties(this.header);
    this.body = this.req.method != 'HEAD' ? this.parseBody(this.text) : null;
  }

  BatchResponse.prototype = request.Response.prototype;

  function parseResponse(response) {
    var parsedResponse = {};
    var resp = response.replace(new RegExp('[^]*?' + httpVersion), httpVersion);
    var respLines = resp.split(newLine);

    var _respLines$shift$split = respLines.shift().split(' ');

    var _respLines$shift$split2 = _toArray(_respLines$shift$split);

    var version = _respLines$shift$split2[0];
    var status = _respLines$shift$split2[1];

    var message = _respLines$shift$split2.slice(2);

    parsedResponse.status = status;
    parsedResponse.statusMessage = message.join(' ');
    parsedResponse.headers = {};
    while (respLines[0] !== '') {
      var _respLines$shift$split3 = respLines.shift().split(': ');

      var _respLines$shift$split32 = _slicedToArray(_respLines$shift$split3, 2);

      var _name = _respLines$shift$split32[0];
      var content = _respLines$shift$split32[1];

      parsedResponse.headers[_name.toLowerCase()] = content;
    }
    respLines.shift();
    parsedResponse.body = respLines.shift();
    return parsedResponse;
  }

  var parseBatchedResponse = parseBatchedResponse = function (batches, res) {
    var separator = '--' + /boundary="(.*)"/.exec(res.header[contentType.toLowerCase()])[1];
    var responses = res.text.split(separator).filter(function (resp) {
      return resp.replace(newLine, '') !== boundarySeparator && resp.replace(newLine, '').length;
    });
    var superagentResponses = responses.map(function (resp, i) {
      var parsedResponse = parseResponse(resp);
      return new BatchResponse(batches[i], parsedResponse);
    });
    return superagentResponses;
  };

  var buildRequest = function buildRequest(req) {
    var body = [];

    var _url$parse = url.parse(req.url);

    var pathname = _url$parse.pathname;
    var host = _url$parse.host;

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

    if (req._serializedData) {
      body.push(req._serializedData);
    }

    body.push('');

    return body.join(newLine);
  };

  function createBatchingAgent(containerRequest) {
    var batches = [];

    var BatchingAgent = (function (_request) {
      _inherits(BatchingAgent, _request);

      function BatchingAgent() {
        _classCallCheck(this, BatchingAgent);

        _get(Object.getPrototypeOf(BatchingAgent.prototype), 'constructor', this).apply(this, arguments);
      }

      return BatchingAgent;
    })(request);

    var oldEnd = BatchingAgent.Request.prototype.end;
    BatchingAgent.endBatch = function (callback) {
      BatchingAgent.Request.prototype.end = oldEnd;

      var requests = batches.map(function (req) {
        return buildRequest(req);
      });
      requests.push(boundarySeparator + boundaryString + boundarySeparator);

      containerRequest.send(requests.join(newLine));
      containerRequest.end(function (err, res) {
        var responses = parseBatchedResponse(batches, res);
        responses.forEach(function (resp) {
          if (resp.req._callback) {
            resp.req._callback(resp);
          }
        });
        if (callback) {
          callback(err, res);
        }
      });
    };
    BatchingAgent.Request.prototype.end = function end(callback) {
      if (this._data) {
        var serializer = BatchingAgent.serialize[this.header[contentType]];
        if (this.header[contentType] && serializer) {
          this._serializedData = serializer(this._data);
        } else {
          this._serializedData = this._data;
        }
      }
      this._callback = callback;
      batches.push(this);
      return BatchingAgent;
    };
    return BatchingAgent;
  }

  var superagentBatch = function superagentBatch(superagent) {
    superagent.Request.prototype.startBatch = function () {
      this.set(contentType, 'multipart/mixed; boundary=' + boundaryString);
      return createBatchingAgent(this);
    };
    return superagent;
  };

  var superagent_batch = superagentBatch;

  return superagent_batch;
});
//# sourceMappingURL=superagent-batch.js.map