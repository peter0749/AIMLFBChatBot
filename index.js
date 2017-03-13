//'use strict'
const urlencode = require('urlencode');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const AIMLInterpreter = require('aimlinterpreter');
const math = require('mathjs');
const rn = require('random-number');
const app = express();
math.config({number: 'BigNumber'});
var mathjs=math.parser();
let tok=""
var aimlInterpreter = new AIMLInterpreter({name:'Alice', master:'Kuang-Yu', friends:'Angel, Peter and Caroline', boyfriend:'Kane', genus:'uvuvwevwevwe onyetenyevwe ugwemubwem ossas', botmaster:'Lord', order:'brilliant', birthday:'07/15', family:'humanoid', celebrity:'Linus Benedict Torvalds', website:'https://www.facebook.com/ABot-1394497450570697/', species:'human'});
aimlInterpreter.loadAIMLFilesIntoArray(['./brain.aiml']);

app.set('port', (process.env.PORT || '5000' ))

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/', function(req, res) {
    res.send("Hi there.")
})

//Receive from Facebook App

//Check current week weather
function checkWeather(num, sender) {
    if(!!!num || num<1 || num>6) return;
    if(!!!sender) return;

    request.get({
        uri:'http://opendata.cwb.gov.tw/opendata/DIV3/F-A0010-001.txt',
        encoding: null
    },
        function(err, resp, body){
            var text = iconv.decode(iconv.encode(iconv.decode(body, 'big-5'),'utf-8'),'utf-8');
            text=text.replace(/[\r]/g,'');
            var regs=[
                /1\u3001\u5317\u90e8\u5730\u5340\uff1a/,
                /2\u3001\u4e2d\u90e8\u5730\u5340\uff1a/,
                /3\u3001\u5357\u90e8\u5730\u5340\uff1a/,
                /4\u3001\u6771\u5317\u90e8\u5730\u5340\uff1a/,
                /5\u3001\u6771\u90e8\u5730\u5340\uff1a/,
                /6\u3001\u6771\u5357\u90e8\u5730\u5340\uff1a/,
                /\uff0a\u5099\u8a3b\uff1a/
            ];
            let l = text.match(regs[num-1]).index+2;
            let r = text.match(regs[num]).index;
            sendText(sender, text.substring(l,r).replace(/\u3000/g,' ').trim()+"\n資料來源：中央氣象局");
        }
    );

}

function getCFcontent(url, sender) {
    request(url, function(err, res, body) {
        let $=cheerio.load(body);
        transToChiSend(
            sender,
            "Input: \n"+
            $('div[class=input-specification]').find('p').text()
        );
        transToChiSend(
            sender,
            "Output: \n"+
            $('div[class=output-specification]').find('p').text()
        );
    });
}

function transToChiSend(sender, text) {
    try {
        request.get("https://www2.cs.ccu.edu.tw/~cky104u/phptest/entw.php?q="+urlencode(text),
            function(err, res, body){
                sendText(sender, body);
            });
    } catch (err) { }
    sendText(sender, text);
}

app.post('/webhook/', function(req, res) {
    const string_limit=600;
    const timeBorder=3500;
    let mess_events = req.body.entry[0].messaging
    for( let i=0; i!=mess_events.length; ++i) {
        let event = mess_events[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            text = text.substring(0,75).trim().substring(0,70);
            if(text.match(/^CF [0-9a-zA-Z ]+$/i)!=null) {
                var url="";
                text=text.substring(3,50).toLowerCase();
                request('http://codeforces.com/api/problemset.problems?tags='+text ,
                    function (error, response, body) {
                        console.log('error:', error); // Print the error if one occurred
                        console.log('statusCode:', response && response.statusCode); // Print th
                        var jsonObj = JSON.parse(body);
                        var Str = jsonObj.result.problems
                        if(Str.length<=0) {
                            sendText(sender, "Sorry, I can't find it...");
                        } else {
                            let opt = {
                                min: 0,
                                max: Str.length-1,
                                integer: true
                            }
                            let id = rn(opt);
                            var sub = Str[id];
                            let url = "http://codeforces.com/problemset/problem/"+sub.contestId+"/"+sub.index;
                            sendText( sender, sub.contestId+sub.index );
                            sendText( sender, url );
                            getCFcontent(url, sender);
                        }
                    });
            } else if (text.match(/^EN2CN +[^ ]/i)!=null) {
                try {
                    request.get("https://www2.cs.ccu.edu.tw/~cky104u/phptest/entw.php?q="+urlencode(text), function(err, res, body) {
                        sendText(sender, body.substring(5,string_limit));
                    });
                } catch (err) {}
            } else if (text.match(/^GOOGLE +[^ ]/i)!=null) {
                text=text.substring(7,string_limit);
                sendText(sender, "https://www.google.com.tw/?gws_rd=ssl#safe=off&q="+ urlencode(text.toLowerCase().trim()).replace(/[ ]/g, "%20"));
            } else if (text.match(/^WIKI +[^ ]/i)!=null) {
                var uu="wikipedia.org/w/index.php?search=";
                if(text.match(/[\u4E00-\u9FFF]/i)) {
                    uu="https://zh."+uu;
                } else {
                    uu="https://en."+uu;
                }
                text=text.substring(5,string_limit);
                sendText(sender, uu + urlencode(text.toLowerCase().trim()).replace(/[ ]/g, "%20"));
            } else if (text.match(/^WOLF +[^ ]/i)!=null) {
                ////div[@class="text-container ng-scope"]/pre[@id="plaintext"]
                text=text.substring(5,string_limit);
                url = "https://www.wolframalpha.com/input/?i="+urlencode(text.toLowerCase().trim()).replace(/[ ]/g, "%20");
                sendText(sender, url);
            } else if (text.match(/^YOUTUBE +[^ ]/i)!=null) {
                text=text.substring(8, string_limit);
                sendText(sender, "https://www.youtube.com/results?search_query="+urlencode(text.toLowerCase().trim()).replace(/[ ]/g, "%20"));
            } else if (text.match(/^MATH +[^ ]/i)!=null) {
                text=text.substring(5, string_limit);
                console.log(text);
                var ev="";
                try{
                    ev=mathjs.eval(text).toString();
                } catch (err) {
                    ev="Wrong syntax. please check the document from mathjs\nhttp://mathjs.org/docs/expressions/syntax.html"
                }
                console.log(ev);
                sendText(sender, ev);
            } else if (text.match(/^WEATHER +[1-6]/i)!=null) {
                text=text.substring(8, string_limit).replace(/[^1-6]/g,'');
                let num=parseInt(text);
                try{checkWeather(num, sender);}catch(err){}
            } else if (text.match(/^WEATHER/i)!=null) {
                sendText(sender, 
                    "各地一週天氣預報:\n\nWEATHER 1: 北部\nWEATHER 2: 中部\nWEATHER 3: 南部\nWEATHER 4: 東北\nWEATHER 5: 東部\nWEATHER 6: 東南");
            }
            else {
                if(text.match(/[\u2E80-\u9FFF]/i)!=null) {
                    try{
                        request.get("https://www2.cs.ccu.edu.tw/~cky104u/phptest/autoen.php?q="+urlencode(text), function(err, res, body) {
                            giveAlice(sender, body.trim());
                        });
                    } catch (err) {
                        giveAlice(sender, text);
                    }
                } else {
                    giveAlice(sender, text);
                }
            }
        }
    }
    res.sendStatus(200)
})

function giveAlice(sender, text) {
    const string_limit=600;
    const timeBorder=3500;
    var alice="Alice: ";
    var testRuntime = setTimeout(function(){ 
        sendText(sender, "Sorry. I'm a little busy now...");
        sendText(sender, "You can enter \"HELP\" to interact with me. :\)");
    }, timeBorder);
    try{
        aimlInterpreter.findAnswerInLoadedAIMLFiles(text, function(answer, wildCardArray, input) {
            if(!!answer) {
                clearTimeout(testRuntime);
                alice += answer.trim().substring(0,string_limit);
            }
        });
        transToChiSend(sender, alice.substring(0,string_limit));
    }catch (err) {
        sendText(sender, "Hmm...Something wrong here.");
    }
    alice=undefined;
}

function sendText(sender, text) {
    let messageData = {text: text}
    request({
        url: "https://graph.facebook.com/v2.8/me/messages",
        qs : {access_token: tok},
        method: "POST",
        json: {
            recipient : {id: sender},
            message : messageData,
        }
    }, function(error, response, body) {
        if(error) {
            console.log("sending error")
        } else if (response.body.error) {
            console.log("response.body.error")
        }
    })
}

app.get('/webhook/', function(req, res) {
    if(req.query['hub.verify_token'] === "" ) {
        res.send(req.query['hub.challenge'])
    }
    res.send("Oops, Wrong wrong wrong token")
})

app.listen(app.get('port'), function() {
    console.log("running: " + app.get('port'))
})

