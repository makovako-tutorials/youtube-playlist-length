const express = require("express");
const axios = require("axios");

require("dotenv").config();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const MAX_RESULTS = 50;
const VIDEO_IDS_LENGTH = 50;

const YOUTUBE_PLAYLIST_URL =
    "https://www.googleapis.com/youtube/v3/playlistItems";
const YOUTUBE_VIDEO_URL = "https://www.googleapis.com/youtube/v3/videos";
const YOUTUBE_PLAYLIST_INFO_URL =
    "https://www.googleapis.com/youtube/v3/playlists";

const app = express();

app.use(express.static("public"));

app.get("/api/playlist", async (req, res) => {
    // const path = require("path");
    // return res.sendFile(path.join(__dirname,'playlist.json'))
    const youtube_id = req.query.youtube_id;
    const playlist_url = `${YOUTUBE_PLAYLIST_URL}?part=contentDetails,snippet&maxResults=${MAX_RESULTS}&playlistId=${youtube_id}&key=${API_KEY}`;
    let videos = [];
    let data = null;
    try {
        data = await axios.get(playlist_url);
    } catch (error) {
        return res.status(500).json({ error: error.message  + "\"in playlist processing\"" });
    }
    videos = [...videos, ...data.data.items];
    while (data.data.hasOwnProperty("nextPageToken")) {
        try {
            data = await axios.get(
                `${playlist_url}&pageToken=${data.data.nextPageToken}`
            );
        } catch (error) {
            return res.status(500).json({ error: error.message  + "\"in playlist processing\"" });
        }
        videos = [...videos, ...data.data.items];
    }
    const all_ids = videos.map(video => video.contentDetails.videoId);
    
    let chunked_ids = []; // API can resolve max 50 videos at a time, separating array into array of arrays of 50 ids
    while (all_ids.length) {
        chunked_ids.push(all_ids.splice(0, VIDEO_IDS_LENGTH));
    }

    let results = [];
    try {
        results = await Promise.all(
            chunked_ids.map(async ids => await Promise.all(
                ids.map(async id => {
                    const video_url = `${YOUTUBE_VIDEO_URL}?part=contentDetails,snippet,id&id=${id}&key=${API_KEY}`;
                    const video_details = await axios.get(video_url);

                    const video = video_details.data.items[0];
                    return {
                        id: video.id,
                        title: video.snippet.title,
                        description: video.snippet.description,
                        thumbnailUrl: video.snippet.thumbnails.high.url,
                        channelTitle: video.snippet.channelTitle,
                        duration: video.contentDetails.duration
                    };
                })
            )))
        
    } catch (error) {  
        return res.status(500).json({ error: error.message + "\"in video processing\"" });
    }
    results = results.flat()
    


    let playlistTitle = "";
    try {
        data = await axios.get(
            `${YOUTUBE_PLAYLIST_INFO_URL}?part=snippet&id=${youtube_id}&key=${API_KEY}`
        );
        playlistTitle = data.data.items[0].snippet.title;
    } catch (error) {
        return res.status(500).json({ error: error.message  + "\"in getting playlist name\""});
    }
    return res.json({ playlistTitle, results });
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});
