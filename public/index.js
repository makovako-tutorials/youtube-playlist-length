const errorDiv = document.getElementById('error')
const searchDiv = document.getElementById('search')
const resultDiv = document.getElementById('result')

/**
 * Extract playlist id from url
 * @param {string} url 
 */
const get_youtube_id = url => {
    const params = url
        .split("?")[1] // error if no parameters
        .split("&")
        .map(param => param.split("="))
        .filter(([param, value]) => param === "list");
    return params.length === 0 ? null : params[0][1];
};

/**
 * Parse ISO8601 to custom object using regex
 * @param {string} duration 
 */
const parse_duration = (duration) => {
    var iso8601DurationRegex = /(-)?P(?:([.,\d]+)Y)?(?:([.,\d]+)M)?(?:([.,\d]+)W)?(?:([.,\d]+)D)?T(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?/;
    var matches = duration.match(iso8601DurationRegex);
    const parsedDuration = {
        sign: matches[1] === undefined ? '+' : '-',
        years: matches[2] === undefined ? 0 : matches[2],
        months: matches[3] === undefined ? 0 : matches[3],
        weeks: matches[4] === undefined ? 0 : matches[4],
        days: matches[5] === undefined ? 0 : matches[5],
        hours: matches[6] === undefined ? 0 : matches[6],
        minutes: matches[7] === undefined ? 0 : matches[7],
        seconds: matches[8] === undefined ? 0 : matches[8]
    };
    return parsedDuration
}

/**
 * Accumulate durations of videos per each unit
 * @param {Array of videos} data 
 */
const accumulate_durations = data => {
    return data
        .map(result => parse_duration(result.duration))
        .reduce(
            (acc, val) => {
                return {
                    years: acc.years + parseInt(val.years),
                    months: acc.months + parseInt(val.months),
                    weeks: acc.weeks + parseInt(val.weeks),
                    days: acc.days + parseInt(val.days),
                    hours: acc.hours + parseInt(val.hours),
                    minutes: acc.minutes + parseInt(val.minutes),
                    seconds: acc.seconds + parseInt(val.seconds)
                }
            },
            {
                years: 0,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0
            }
        )
}

/**
 * Consolidate units, eg seconds to be < 60 and add overlap to minutes
 * @param {Object of durations per unit} summedDurations 
 */
const consolidate_durations = summedDurations => {
    let overlap = 0
    let seconds = summedDurations.seconds % 60
    overlap = Math.floor(summedDurations.seconds / 60)
    let minutes = (parseInt(summedDurations.minutes) + overlap) % 60
    overlap = Math.floor((parseInt(summedDurations.minutes) + overlap) / 60)
    let hours = (parseInt(summedDurations.hours) + overlap)
    seconds = number_to_two_places(seconds)
    minutes = number_to_two_places(minutes)
    hours = number_to_two_places(hours)
    return {seconds, minutes, hours}
}

/**
 * Compute total time of the playlist
 * @param {Array of videos} data 
 */
const get_total_time = data => {
    const sum = accumulate_durations(data)
    return consolidate_durations(sum)
}

/**
 * Cut off description after length number of words
 * @param {string} description 
 * @param {number} length 
 */
const truncate_description = (description, length=100) => {
    return description.split(' ').splice(0, length).join(' ') + ' ...'
}

/**
 * Fill in "0" to the front of one positonal number
 * @param {number} number 
 */
const number_to_two_places = number => {
    return number.toString().length === 1 ? "0" + number : number
}

/**
 * Create element from given video
 * @param {Video object} result 
 */
const construct_video_element = result => {
    const numOfWords = window.matchMedia("(max-width:700px)").matches ? 50 : 100

    const videoItemDiv = document.createElement('DIV')
    videoItemDiv.classList.add('video-item')
    const {hours, minutes, seconds} = consolidate_durations(parse_duration(result.duration))
    videoItemDiv.innerHTML = `
    <div class="video-header">
        <div class="video-thumbnail">
            <img src="${result.thumbnailUrl}" alt="Video thumbnail" />
        </div>
        <div class="video-header-text">
            <div class="video-title">
                <p>
                    ${result.title}
                </p>
            </div>
            <div class="video-subtitle">
                <div class="video-channel-name">
                    <p>
                        ${result.channelTitle}
                    </p>
                </div>
                <div class="video-duration">
                    <p>
                        ${hours}:${minutes}:${seconds}
                    </p>
                </div>
            </div>
        </div>
    </div>
    <div class="video-description">
        <p>
            ${truncate_description(result.description, numOfWords)}
        </p>
    </div>
    `

    if (false)
    {
        
        const videoHeaderDiv = document.createElement('DIV')
        videoHeaderDiv.classList.add('video-header')

        const videoThumbnailDiv = document.createElement('DIV')
        videoThumbnailDiv.classList.add('video-thumbnail')

        const videoThumbnailImage = document.createElement('IMG')
        videoThumbnailImage.setAttribute('src',result.thumbnailUrl)

        const videoDescriptionDiv = document.createElement('DIV')
        videoDescriptionDiv.classList.add('video-description')

        const videoDescriptionParagraph = document.createElement('P')
        videoDescriptionParagraph.innerText = truncate_description(result.description, 100)

        const videoHeaderTextDiv = document.createElement('DIV')
        videoHeaderTextDiv.classList.add('video-header-text')

        const videoTitleDiv = document.createElement('DIV')
        videoTitleDiv.classList.add('video-title')

        const videoTitleParagraph = document.createElement('P')
        videoTitleParagraph.innerText = result.title

        const videoSubtitleDiv = document.createElement('DIV')
        videoSubtitleDiv.classList.add('video-subtitle')

        const videoChannelNameDiv = document.createElement('DIV')
        videoChannelNameDiv.classList.add('video-channel-name')

        const videoChannelNameParagraph = document.createElement('P')
        videoChannelNameParagraph.innerText = result.channelTitle

        const videoDurationDiv = document.createElement('DIV')
        videoDurationDiv.classList.add('video-duration')

        const videoDurationParagraph = document.createElement('P')
        const {hours, minutes, seconds} = consolidate_durations(parse_duration(result.duration))
        
        videoDurationParagraph.innerText = `${hours}:${minutes}:${seconds}`

        videoChannelNameDiv.appendChild(videoChannelNameParagraph)
        videoDurationDiv.appendChild(videoDurationParagraph)
        videoSubtitleDiv.appendChild(videoChannelNameDiv)
        videoSubtitleDiv.appendChild(videoDurationDiv)
        videoTitleDiv.appendChild(videoTitleParagraph)
        videoHeaderTextDiv.appendChild(videoTitleDiv)
        videoHeaderTextDiv.appendChild(videoSubtitleDiv)
        videoThumbnailDiv.appendChild(videoThumbnailImage)
        videoHeaderDiv.appendChild(videoThumbnailDiv)
        videoHeaderDiv.appendChild(videoHeaderTextDiv)
        videoDescriptionDiv.appendChild(videoDescriptionParagraph)
        videoItemDiv.appendChild(videoHeaderDiv)
        videoItemDiv.appendChild(videoDescriptionDiv)
    }
    return videoItemDiv
}

/**
 * Update DOM with new playlist and video data
 * @param {Object containing playlistTitle, results, total_time} param0 
 */
const update_document = ({playlistTitle, results, total_time}) => {
    clearError()
    document.getElementById('playlist-title').innerText = `Playlist: ${playlistTitle}`

    
    document.getElementById('hours').innerText = total_time.hours
    document.getElementById('minutes').innerText = total_time.minutes
    document.getElementById('seconds').innerText = total_time.seconds
    
    const videoListDiv = document.getElementById('video-list')
    videoListDiv.innerText = ""

    results.map(result => {
        const videoItemDiv = construct_video_element(result)
        videoListDiv.appendChild(videoItemDiv)
    })

    resultDiv.classList.remove('hidden')
}

/**
 * Display error
 * @param {string} error 
 */
const handleError = error => {
    resultDiv.classList.add('hidden')
    clearError()
    const errorElement = document.createElement('P')
    errorElement.innerText = error
    errorDiv.appendChild(errorElement)
    errorDiv.classList.remove('hidden')
}

/**
 * Clear error from DOM
 */
const clearError = () => {
    errorDiv.textContent = ''
    errorDiv.classList.add('hidden')
}

document.getElementById("form").addEventListener("submit", async e => {
    e.preventDefault();
    const url = e.target.youtube.value;
    youtube_id = get_youtube_id(url);
    if (youtube_id) {
        try {
            const res = await fetch(`/api/playlist?youtube_id=${youtube_id}`)
            
            if (res.ok) {
                const data = await res.json()
                const {seconds, minutes, hours} = get_total_time(data.results)
                update_document({playlistTitle:data.playlistTitle, results:data.results, total_time: {seconds, minutes, hours}}) 
            } else {
                const error = await res.json()
                handleError(`Server Error: ${res.status} ${res.statusText} - ${error.error.message}`)
            }            
        } catch (error) {
            handleError(`Program Error: ${error.message}`)
        }
    } else {
        handleError(`Input Error: Could not extract playlist from url.`)
    }
});
