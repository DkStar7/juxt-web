var express = require('express');
var xml = require('object-to-xml');
const database = require('../../../../database');
const util = require('../../../../authentication');
const config = require('../../../../config.json');
var moment = require('moment');
var router = express.Router();

router.get('/', function (req, res) {
    res.header('X-Nintendo-WhiteList','1|http,youtube.com,,2|https,youtube.com,,2|http,.youtube.com,,2|https,.youtube.com,,2|http,.ytimg.com,,2|https,.ytimg.com,,2|http,.googlevideo.com,,2|https,.googlevideo.com,,2|https,youtube.com,/embed/,6|https,youtube.com,/e/,6|https,youtube.com,/v/,6|https,www.youtube.com,/embed/,6|https,www.youtube.com,/e/,6|https,www.youtube.com,/v/,6|https,youtube.googleapis.com,/e/,6|https,youtube.googleapis.com,/v/,6|http,maps.googleapis.com,/maps/api/streetview,2|https,maps.googleapis.com,/maps/api/streetview,2|http,cbk0.google.com,/cbk,2|https,cbk0.google.com,/cbk,2|http,cbk1.google.com,/cbk,2|https,cbk1.google.com,/cbk,2|http,cbk2.google.com,/cbk,2|https,cbk2.google.com,/cbk,2|http,cbk3.google.com,/cbk,2|https,cbk3.google.com,/cbk,2|https,.cloudfront.net,,2|https,www.google-analytics.com,/,2|https,stats.g.doubleclick.net,,2|https,www.google.com,/ads/,2|https,ssl.google-analytics.com,,2|http,fonts.googleapis.com,,2||fonts.googleapis.com,,2');
    let lang = util.data.processLanguage(req.headers["x-nintendo-parampack"]);
    database.connect().then(async e => {

        //let paramPackData = util.data.decodeParamPack(req.headers["x-nintendo-parampack"]);
        let pid = util.data.processServiceToken(req.headers["x-nintendo-servicetoken"]);

        if(pid === null)
            pid = 1000000000;
        let user = await database.getUserByPID(pid);
        let communityMap = await util.data.getCommunityHash();
        let posts = await database.getNewsFeed(user, 3);
        res.render('portal/feed.ejs', {
            moment: moment,
            user: user,
            posts: posts,
            communityMap: communityMap,
            account_server: config.account_server_domain.slice(8),
            cdnURL: config.CDN_domain,
            lang: lang
        });
        user.notification_list.filter(noti => noti.read === false).forEach(function(notification) {
            notification.read = true;
        });
        user.markModified('notification_list');
        user.save();
    }).catch(error => {
        console.log(error);
        res.set("Content-Type", "application/xml");
        res.statusCode = 400;
        response = {
            result: {
                has_error: 1,
                version: 1,
                code: 400,
                error_code: 15,
                message: "SERVER_ERROR"
            }
        };
        res.send("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + xml(response));
    });
});

router.get('/loadposts', function (req, res) {
    res.header('X-Nintendo-WhiteList','1|http,youtube.com,,2|https,youtube.com,,2|http,.youtube.com,,2|https,.youtube.com,,2|http,.ytimg.com,,2|https,.ytimg.com,,2|http,.googlevideo.com,,2|https,.googlevideo.com,,2|https,youtube.com,/embed/,6|https,youtube.com,/e/,6|https,youtube.com,/v/,6|https,www.youtube.com,/embed/,6|https,www.youtube.com,/e/,6|https,www.youtube.com,/v/,6|https,youtube.googleapis.com,/e/,6|https,youtube.googleapis.com,/v/,6|http,maps.googleapis.com,/maps/api/streetview,2|https,maps.googleapis.com,/maps/api/streetview,2|http,cbk0.google.com,/cbk,2|https,cbk0.google.com,/cbk,2|http,cbk1.google.com,/cbk,2|https,cbk1.google.com,/cbk,2|http,cbk2.google.com,/cbk,2|https,cbk2.google.com,/cbk,2|http,cbk3.google.com,/cbk,2|https,cbk3.google.com,/cbk,2|https,.cloudfront.net,,2|https,www.google-analytics.com,/,2|https,stats.g.doubleclick.net,,2|https,www.google.com,/ads/,2|https,ssl.google-analytics.com,,2|http,fonts.googleapis.com,,2|fonts.googleapis.com,,2|https,www.googletagmanager.com,,2');
    let lang = util.data.processLanguage(req.headers["x-nintendo-parampack"]);
    database.connect().then(async e => {
        let pid = util.data.processServiceToken(req.headers["x-nintendo-servicetoken"]);
        let post = await database.getPostByID(req.query.postID);
        if(pid === null)
            pid = 1000000000;
        let user = await database.getUserByPID(pid);
        let communityMap = await util.data.getCommunityHash();
        let posts;
        if(post !== null)
            posts = await database.getNewsFeedAfterTimestamp(user, 3, post);

        if(posts.length > 0)
        {
            res.render('portal/more_posts.ejs', {
                communityMap: communityMap,
                moment: moment,
                database: database,
                user: user,
                newPosts: posts,
                account_server: config.account_server_domain.slice(8),
                cdnURL: config.CDN_domain,
                lang: lang
            });
        }
        else
        {
            res.sendStatus(204);
        }
    }).catch(error => {
        console.log(error);
        res.set("Content-Type", "application/xml");
        res.statusCode = 400;
        response = {
            result: {
                has_error: 1,
                version: 1,
                code: 400,
                error_code: 15,
                message: "SERVER_ERROR"
            }
        };
        res.send("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + xml(response));
    });
});

module.exports = router;
