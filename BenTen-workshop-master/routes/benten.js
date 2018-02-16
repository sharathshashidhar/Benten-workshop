var express = require('express');
var router = express.Router();

var moment = require('moment');
var fs = require('fs');
var path = require('path');
var logger = require("./logging/logger");
var request = require('request');
var config = require('config');
var apiaitoken = config.get('apiai').token;

var apiai = require('apiai');



router.get('/health', function (req, res) {
    res.send("Health check ok");
});

router.post('/act', function (req, res) {
    res.send("Coming soon");
});



module.exports = router;
