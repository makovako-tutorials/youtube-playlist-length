const express = require("express");
const axios = require("axios");

require("dotenv").config();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const MAX_RESULTS = 50;

const YOUTUBE_PLAYLIST_URL =
    "https://www.googleapis.com/youtube/v3/playlistItems";
const YOUTUBE_VIDEO_URL = "https://www.googleapis.com/youtube/v3/videos";
const YOUTUBE_PLAYLIST_INFO_URL = "https://www.googleapis.com/youtube/v3/playlists"

const app = express();

app.use(express.static("public"));

app.get("/api/playlist", async (req, res) => {
    const path = require('path')
    // return res.status(400).send({error:"random error"})
    // return res.sendFile(path.join(__dirname,'playlist.json'))
    const youtube_id = req.query.youtube_id;
    const playlist_url = `${YOUTUBE_PLAYLIST_URL}?part=contentDetails,snippet&maxResults=${MAX_RESULTS}&playlistId=${youtube_id}&key=${API_KEY}`;
    let videos = [];
    let data = null;
    try {
        data = await axios.get(playlist_url);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
    videos = [...videos, ...data.data.items];
    while (data.data.hasOwnProperty("nextPageToken")) {
        try {
            data = await axios.get(
                `${playlist_url}&pageToken=${data.data.nextPageToken}`
            );
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
        videos = [...videos, ...data.data.items];
    }
    const ids = videos.map(video => video.contentDetails.videoId).join(",");
    const videos_url = `${YOUTUBE_VIDEO_URL}?part=contentDetails,snippet,id&id=${ids}&key=${API_KEY}`;
    let detail_videos = null;
    try {
        detail_videos = await axios.get(videos_url);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
    const results = detail_videos.data.items.map(video => {
        return {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnailUrl: video.snippet.thumbnails.standard.url,
            channelTitle: video.snippet.channelTitle,
            duration: video.contentDetails.duration
        };
    });
    
    let playlistTitle = ""
    try {
        data = await axios.get(`${YOUTUBE_PLAYLIST_INFO_URL}?part=snippet&id=${youtube_id}&key=${API_KEY}`)
        playlistTitle = data.data.items[0].snippet.title
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json({ playlistTitle, results });
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});
