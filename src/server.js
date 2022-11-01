const express = require('express');
const body_parser = require('body-parser')
const schedule = require('node-schedule');

const Lock = require('./classes/Lock');
const Manager = require('./classes/Politics/Manager');

require('dotenv').config();


const app = express();

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));
app.use(express.static('assets'));


Manager.loadDataOnStartUp();
schedule.scheduleJob('0 0 0 * * *', () => Manager.fetchData() );



app.get('/api/accounts', async (req, res) => {
    await Lock.wait();
    res.json(Manager.getAccounts());
});

app.get('/api/coalitions', async (req, res) => {
    await Lock.wait();
    res.json(Manager.getCoalitions());
});



app.get('/api/accounts/:handle/profile', async (req, res) => {
    const { handle } = req.params;

    await Lock.wait();

    if (!Manager.isAccountAllowed(handle))
        return res.status(400).send({ message: 'Account does not exists' });

    let account = await Manager.getAccountByHandle(handle);

    const profile = {
        username: account.username,
        name: account.name,
        coalition: account.coalition,
        verified: account.verified,
        profile_image_url: account.profile_image_url,
        description: account.description,
        created_at: account.created_at,
        followers_count: account.followers_count,
        following_count: account.following_count,
        tweet_count: account.tweet_count
    };

    res.json(profile);
});


app.get('/api/accounts/:handle/stats', async (req, res) => {
    const { handle } = req.params;
    
    await Lock.wait();

    if (!Manager.isAccountAllowed(handle))
        return res.status(400).send({ message: 'Account does not exists' });

    let account = await Manager.getAccountByHandle(handle);

    const stats = {
        fetched_tweets_count: account.fetched_tweet_count,
        avg_tweet_length: account.getAvgTweetLength(),
        avg_likes_per_tweet: account.getAvgOfMetricPerTweet('like_count'),
        avg_retweets_per_tweet: account.getAvgOfMetricPerTweet('retweet_count'),
        avg_replies_per_tweet: account.getAvgOfMetricPerTweet('reply_count'),
        total_likes: account.getSumOfMetric('like_count'),
        total_retweets: account.getSumOfMetric('retweet_count'),
        total_replies: account.getSumOfMetric('reply_count')
    };
    
    res.json(stats);
});


app.get('/api/coalitions/:coalition/profile', async (req, res) => {
    const { coalition } = req.params;    

    await Lock.wait();

    if (!Manager.isCoalitionAllowed(coalition))
        return res.status(400).send({ message: 'Coalition does not exists' });

    let alliance = await Manager.getCoalitionByName(coalition);

    const stats = {
        name: alliance.name,
        color: alliance.color,
        accounts: alliance.accounts,
        total_followers_count: alliance.getTotalFollowersCount(),
        total_tweet_count: alliance.getTotalTweetCount()
    };

    res.json(stats);
});


app.get('/api/coalitions/:coalition/stats', async (req, res) => {
    const { coalition } = req.params;    

    await Lock.wait();

    if (!Manager.isCoalitionAllowed(coalition))
        return res.status(400).send({ message: 'Coalition does not exists' });

    let alliance = await Manager.getCoalitionByName(coalition); 

    const stats = {
        total_fetched_tweet_count: alliance.getTotalFetchedTweetCount(),
        avg_tweet_length: alliance.getAvgTweetLength(),
        avg_likes_per_tweet: alliance.getAvgOfMetricOfTweets('like_count'),
        avg_retweets_per_tweet: alliance.getAvgOfMetricOfTweets('retweet_count'),
        avg_replies_per_tweet: alliance.getAvgOfMetricOfTweets('reply_count'),
        total_likes: alliance.getSumOfMetric('like_count'),
        total_retweets: alliance.getSumOfMetric('retweet_count'),
        total_replies: alliance.getSumOfMetric('reply_count')
    };

    res.json(stats);
});



app.listen(8080);