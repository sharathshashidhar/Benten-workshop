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
var apiaiservice = apiai(apiaitoken);

var slack_bot_token = config.get('slackBot').token;

var RTMClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var rtm=new RTMClient(slack_bot_token);


router.get('/health', function (req, res) {
    res.send("Health check ok");
});

router.post('/act', function (req, res) {
    res.send("Coming soon");
});

router.get('/apiai', function (req, res) {
    var sessionId = Math.floor(Math.random() * 99999999) + 1 ;
    var request = apiaiservice.textRequest("hi", {
        sessionId: sessionId
    });

    request.on('response', function(response) {
        res.send(response);
    });

    request.end();

});

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
    console.log(rtmStartData);
});

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(data){
    if(data.type == "message" && data.user != undefined) {
        console.log(data);
        console.log("*****************");
        console.log(data.text);

        if(data.type == "message" && data.user == undefined) return;

        if(data.username !=undefined)
            if(data.username.includes("test-bot" ))
                return;

        var resetContexts = false;
        if(data.text.includes("reset") || data.text.includes("stop")){
            resetContexts = true;
        }

        var request = apiaiservice.textRequest(data.text, {
            sessionId: data.user,
            resetContexts : resetContexts
        });

        request.on('response', function(response) {

            if(data.text.includes("reset") || data.text.includes("stop")){
                rtm.sendMessage("Done. You can start a new conversation.",data.channel);
                return;
            }

            console.log("###### api.ai response#########");
            console.log(response);
            if(response.result.action.includes("smalltalk")
                || response.result.action.includes("input.unknown")
                || response.result.action.includes("input.welcome"))
            {
                if(response.result.fulfillment.speech==""){
                    response.result.fulfillment.speech="can't respond to that";
                }

                rtm.sendMessage(response.result.fulfillment.speech,data.channel);

            }
            else if(response.result.actionIncomplete){
                rtm.sendMessage(response.result.fulfillment.speech,data.channel);
            }

            else
            {
                actOnMessage(response,data.channel)
            }

        });
        request.end();
    }
});

var actOnMessage = function(ai,channel){
    var slacktext= "Happy Journey! I booked your "+ "`"+ai.result.parameters.TransportMode+ "`"+" ticket from "+  "`"+ai.result.parameters.from+ "`"+" to "
        + "`"+ ai.result.parameters.to + "`"+ " on " + "`" +ai.result.parameters.date + "`"+ " using your "+ "`" +ai.result.parameters.Paymentmode+ "`";

    rtm.sendMessage(slacktext,channel);
    return;
}


rtm.start();


module.exports = router;
