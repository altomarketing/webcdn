document.ondblclick = function (e) {
    e.preventDefault();
}

document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
    document.body.style.zoom = 1.0;
});

document.addEventListener('gesturechange', function (e) {
    e.preventDefault();
    document.body.style.zoom = 1.0;
});

document.addEventListener('gestureend', function (e) {
    e.preventDefault();
    document.body.style.zoom = 1.0;
});

let isScrolling = false;

document.addEventListener("touchstart", () => {
    isScrolling = false;
}, { passive: true });

document.addEventListener("touchmove", () => {
    isScrolling = true;
}, { passive: true });

document.addEventListener("touchend", (event) => {
    if (isScrolling) {
        event.preventDefault(); // Prevents accidental clicks
    }
}, { passive: false });

// Block click if scrolling happened
document.addEventListener("click", (event) => {
    if (isScrolling) {
        event.stopPropagation();
        event.preventDefault();
    }
}, true);

window.mobileCheck = function () {
    return ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
};

var current_dir = '';
var lirc_loaded = false;
var userInitiatedPause = false;
(function ($) {
    "use strict";
    var wavesurfer = null;
    var liricle;
    var audioPlayer,lyric,lyricArtist,lyricTitle,lyricContent,lyricCursor,lyricActiveLine=null;
    var id_container_sel;
    var interval_nowplayng;
    var current_song = '';
    var songs_array, all_songs_array, albums_array;
    var xhr_now;
    var search_index = 0;
    var dark_mode_currentIndex = 0;
    var current_option = {
        color: '#00a0ff',
        dark_color: '#1b61b6',
        dark_mode: 'light', //'light','dark','auto'
        dark_mode_switcher: true,
        waveform_width: 3,
        playback_speed: false,
        timer_sleep: false,
        search: true,
        albums: true,
        cache: true,
        volume: 100,
        sort_by: 'none',
        order_by: 'desc',
        download: false,
        localization: {
            'initializing': 'INITIALIZING MUSIC PLAYER',
            'songs': 'SONGS',
            'albums': 'ALBUMS',
            'all_songs': 'All the songs',
            'search': 'Search'
        }
    }

    const dark_mode_themes = [
        { mode: "light", icon: "fas fa-sun", class: "light" },
        { mode: "dark", icon: "fas fa-moon", class: "dark" },
        { mode: "auto", icon: "fas fa-adjust", class: "auto" },
    ];

    window.init_smp = function (id_container, directory = 'songs', option) {
        id_container_sel = id_container;
        current_dir = directory;
        try {
            current_option.color = option.color;
        } catch (e) {}
        try {
            current_option.dark_color = option.dark_color;
        } catch (e) {}
        try {
            current_option.dark_mode = option.dark_mode;
        } catch (e) {}
        try {
            current_option.dark_mode_switcher = option.dark_mode_switcher;
        } catch (e) {}
        try {
            current_option.waveform_width = option.waveform_width;
        } catch (e) {}
        try {
            current_option.playback_speed = option.playback_speed;
        } catch (e) {}
        try {
            current_option.timer_sleep = option.timer_sleep;
        } catch (e) {}
        try {
            current_option.search = option.search;
        } catch (e) {}
        try {
            current_option.cache = option.cache;
        } catch (e) {}
        try {
            current_option.albums = option.albums;
        } catch (e) {}
        try {
            current_option.volume = option.volume;
        } catch (e) {}
        try {
            current_option.sort_by = option.sort_by;
        } catch (e) {}
        try {
            current_option.order_by = option.order_by;
        } catch (e) {}
        try {
            current_option.download = option.download;
        } catch (e) {}
        try {
            current_option.localization = option.localization;
        } catch (e) {}
        $('#' + id_container).html('<div id="loading">\n' +
        '    <div>\n' +
        '        <i class="fa-solid fa-spin fa-circle-notch"></i>\n' +
        '        <h2>'+current_option.localization.initializing+'</h2>\n' +
        '    </div>\n' +
        '</div>\n' +
        '<div id="blue-playlist-container">\n' +
        '    <div id="amplitude-player">\n' +
        '        <div id="amplitude-left">\n' +
        '            <img class="main-cover" data-amplitude-song-info="cover_art_url"/>\n' +
        '            <div id="player-left-bottom">\n' +
        '                <div id="time-container">\n' +
        '                    <span class="current-time">\n' +
        '                        <span class="amplitude-current-hours" ></span>:<span class="amplitude-current-minutes" ></span>:<span class="amplitude-current-seconds"></span>\n' +
        '                    </span>\n' +
        '                    <div id="progress-container">\n' +
        '                        <input type="range" class="amplitude-song-slider"/>\n' +
        '                        <progress id="song-played-progress" class="amplitude-song-played-progress"></progress>\n' +
        '                        <progress id="song-buffered-progress" class="amplitude-buffered-progress" value="0"></progress>\n' +
        '                    </div>\n' +
        '                    <span class="duration">\n' +
        '\t\t\t\t\t\t\t\t<span class="amplitude-duration-hours"></span>:<span class="amplitude-duration-minutes"></span>:<span class="amplitude-duration-seconds"></span>\n' +
        '\t\t\t\t\t\t\t</span>\n' +
        '                </div>\n' +
        '                <div id="waveform"></div>\n' +
        '                <div id="control-container">\n' +
        '                    <div id="repeat-container">\n' +
        '                        <div class="amplitude-repeat" id="repeat"></div>\n' +
        '                        <div class="amplitude-shuffle amplitude-shuffle-off" id="shuffle"></div>\n' +
        '                    </div>\n' +
        '                    <div id="central-control-container">\n' +
        '                        <div id="central-controls">\n' +
        '                            <div class="amplitude-prev" id="previous"></div>\n' +
        '                            <div class="amplitude-play-pause" id="play-pause">\n' +
        '                                <img class="loading_song" src="img/blue_loading.gif" />\n' +
        '                            </div>\n' +
        '                            <div class="amplitude-next" id="next"></div>\n' +
        '                        </div>\n' +
        '                    </div>\n' +
        '                    <div id="volume-container">\n' +
        '                        <div class="volume-controls">\n' +
        '                            <div class="amplitude-mute amplitude-not-muted"></div>\n' +
        '                            <input type="range" class="amplitude-volume-slider"/>\n' +
        '                            <div class="ms-range-fix"></div>\n' +
        '                        </div>\n' +
        '                        <div class="amplitude-shuffle amplitude-shuffle-off" id="shuffle-right"></div>\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '                <div id="album-cover-mobile">\n' +
        '                    <img data-amplitude-song-info="cover_art_url"/>\n' +
        '                </div>\n' +
        '                <div id="meta-container">\n' +
        '                    <button id="playback-speed-btn">1x</button> <button id="timer-sleep-btn"><i class="fas fa-clock"></i></button><span id="countdown-container"><div class="countdown-timer"></div></span>\n' +
        '<div id="timer-sleep-container"><div id="timer-sleep-picker"></div></div>' +
        '                    <span data-amplitude-song-info="name" class="song-name"></span>\n' +
        '                    <div class="song-artist-album">\n' +
        '                        <span data-amplitude-song-info="artist"></span>\n' +
        '                        <span data-amplitude-song-info="album"></span>\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '                <div id="control-container-mobile">\n' +
        '                    <div class="volume-controls">\n' +
        '                        <div class="amplitude-mute amplitude-not-muted"></div>\n' +
        '                        <input type="range" class="amplitude-volume-slider"/>\n' +
        '                        <div class="ms-range-fix"></div>\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '        <div id="amplitude-right">' +
        '           <div id="selector">' +
        '               <div onclick="view_songs();" id="songs_btn" class="active"><i class="fa-solid fa-music"></i>&nbsp;&nbsp;'+current_option.localization.songs+'</div>' +
        '               <div onclick="view_albums();" id="albums_btn"><i class="fa-solid fa-record-vinyl"></i>&nbsp;&nbsp;'+current_option.localization.albums+'</div>' +
        '           </div>' +
        '           <div class="search_div"></div>' +
        '           <div id="albums_list"></div>' +
        '           <div id="songs_list"></div>' +
        '                <i onclick="close_lyric();" id="close_lyric_btn" class="fas fa-times"></i>' +
        '           <div class="lyric" id="lyric-container">\n' +
        '                <div class="lyric__cursor" id="lyric-cursor"></div>\n' +
        '                <div id="lyric-content"></div>\n' +
        '           </div>\n' +
        '       </div>\n' +
        '    </div>\n' +
        '</div>'+'<div id="dark_mode_themeToggle" class="dark_mode_toggle-container light">\n' +
        '    <i id="dark_mode_currentIcon" class="fas fa-sun dark_mode_toggle-icon"></i>\n' +
        '</div>').promise().done(function () {
            if(current_option.color!=='') {
                applyCustomStyles(current_option.color,current_option.dark_color);
            }
            if(current_option.dark_mode_switcher) {
                document.getElementById('dark_mode_themeToggle').style.display = 'flex';
            }
            const dark_mode_toggleContainer = document.getElementById("dark_mode_themeToggle");
            const dark_mode_currentIcon = document.getElementById("dark_mode_currentIcon");
            switch(current_option.dark_mode) {
                case 'light':
                    dark_mode_currentIndex = 0;
                    break;
                case 'dark':
                    dark_mode_currentIndex = 1;
                    break;
                case 'auto':
                    dark_mode_currentIndex = 2;
                    break;
            }
            const dark_mode_applyTheme = () => {
                const theme = dark_mode_themes[dark_mode_currentIndex];
                dark_mode_toggleContainer.className = `dark_mode_toggle-container ${theme.class}`;
                document.getElementById(id_container_sel).classList.remove("dark_mode");
                if (theme.mode === "dark") {
                    document.getElementById(id_container_sel).classList.add("dark_mode");
                } else if (theme.mode === "auto") {
                    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
                    if (prefersDarkScheme) {
                        document.getElementById(id_container_sel).classList.add("dark_mode");
                    }
                }
                dark_mode_currentIcon.className = theme.icon;
                set_items_color(current_option.color,current_option.dark_color);
            };
            const dark_mode_toggleTheme = () => {
                dark_mode_currentIndex = (dark_mode_currentIndex + 1) % dark_mode_themes.length;
                dark_mode_applyTheme();
            };
            dark_mode_toggleContainer.addEventListener("click", dark_mode_toggleTheme);
            window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
                if (dark_mode_themes[dark_mode_currentIndex].mode === "auto") {
                    dark_mode_applyTheme();
                }
            });
            dark_mode_applyTheme();
            fetch_songs(id_container, directory);
        });
    }

    function initLiricle() {
        if(liricle==null) {
            audioPlayer = Amplitude.getAudio();
            lyric = document.getElementById("lyric-container");
            lyricContent = document.getElementById('lyric-content');
            lyricCursor = document.getElementById("lyric-cursor");
            liricle = new Liricle();
            liricle.on('load', ({ tags, lines, enhanced }) => {
                lyricContent.innerHTML = '';
                lyricActiveLine = null;
                lines.forEach((line) => {
                    const div = document.createElement('div');
                    div.className = 'lyric__line';
                    if (enhanced && line.words) {
                        line.words.forEach((word) => {
                            const span = document.createElement('span');
                            span.className = 'lyric__word';
                            span.innerText = word.text + ' ';
                            div.appendChild(span);
                        });
                    } else {
                        div.innerText = line.text;
                    }
                    lyricContent.appendChild(div);
                });
                lyricCursor.style.display = "none";
            });
            liricle.on('sync', (line, word) => {
                if (lyricActiveLine) lyricActiveLine.classList.remove('active');
                lyricActiveLine = lyricContent.children[line.index];
                lyricActiveLine.classList.add('active');
                const centerOffset = lyric.offsetHeight / 2 - lyricActiveLine.offsetHeight / 2;
                lyric.scrollTop = lyricActiveLine.offsetTop - centerOffset;
                if (word) {
                    const wordEl = lyricActiveLine.children[word.index];
                    wordEl.classList.add('active');
                    const elements = document.getElementsByClassName('lyric__word');
                    for (let i = 0; i < elements.length; i++) {
                        if (elements[i] !== wordEl) {
                            elements[i].classList.remove('active');
                        }
                    }
                    lyricCursor.style.display = "block";
                    lyricCursor.style.width = wordEl.offsetWidth + 'px';
                    lyricCursor.style.left = wordEl.offsetLeft + 'px';
                    lyricCursor.style.top = wordEl.offsetTop + wordEl.offsetHeight + 'px';
                }
            });
            audioPlayer.addEventListener('timeupdate', () => {
                try {
                    if(lirc_loaded) liricle.sync(audioPlayer.currentTime);
                } catch (e) {}
            });
        }
    }

    function applyCustomStyles(color,dark_color) {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
        #loading i {
            color: ${color} !important;
        }
        div#amplitude-right #selector #songs_btn.active,
        div#amplitude-right #selector #albums_btn.active {
            background-color: ${color} !important;
        }
        div#amplitude-right #selector #songs_btn:not(.active):hover,
        div#amplitude-right #selector #albums_btn:not(.active):hover {
            color: ${color} !important;
        }
        div#amplitude-right #albums_list .album.active p.album_name,
        div#amplitude-right #albums_list .album:hover p.album_name {
            color: ${color} !important;
        }
        @media (hover: hover) and (pointer: fine) {
            div#amplitude-right div.song:hover {
                background-color: ${color} !important;
            }
        }
        div#control-container div#repeat-container div#repeat.amplitude-repeat-on {
            -webkit-mask: url("./img/repeat-on.svg");
            mask: url("./img/repeat-on.svg");
            background: ${color} !important;
        }
        div#control-container div#repeat-container div#shuffle.amplitude-shuffle-on {
            -webkit-mask: url("./img/shuffle-on.svg");
            mask: url("./img/shuffle-on.svg");
            background: ${color} !important;
        }
        div#control-container div#central-control-container div#central-controls div#play-pause.amplitude-paused {
            -webkit-mask: url("./img/play.svg");
            mask: url("./img/play.svg");
            background: ${color} !important;
        }
        div#control-container div#central-control-container div#central-controls div#play-pause.amplitude-playing {
            -webkit-mask: url("./img/pause.svg");
            mask: url("./img/pause.svg");
            background: ${color} !important;
        }
        div#control-container div#central-control-container div#central-controls div#previous {
            -webkit-mask: url("./img/prev.svg");
            mask: url("./img/prev.svg");
            background: ${color} !important;
        }
        div#control-container div#central-control-container div#central-controls div#next {
            -webkit-mask: url("./img/next.svg");
            mask: url("./img/next.svg");
            background: ${color} !important;
        }
        div#amplitude-right div.song.amplitude-active-song-container div.song-now-playing-icon-container .now-playing circle {
            fill: ${color} !important;
        }
        #playback-speed-btn.active {
            color: ${color} !important;
        }
        .download_btn, .link_btn, .lyric_btn {
            background-color: ${color};
        }
        .download_btn:hover i, .link_btn:hover i, .lyric_btn:hover i {
            color: ${color} !important;
        }
        .lyric__word.active {
            color: ${color} !important;
        }
        #timer-sleep-btn.active {
            color: ${color} !important;
        }
        
        .dark_mode #loading i {
            color: ${dark_color} !important;
        }
        .dark_mode div#amplitude-right #selector #songs_btn.active,
        .dark_mode div#amplitude-right #selector #albums_btn.active {
            background-color: ${dark_color} !important;
        }
        .dark_mode div#amplitude-right #selector #songs_btn:not(.active):hover,
        .dark_mode div#amplitude-right #selector #albums_btn:not(.active):hover {
            color: ${dark_color} !important;
        }
        .dark_mode div#amplitude-right #albums_list .album.active p.album_name,
        .dark_mode div#amplitude-right #albums_list .album:hover p.album_name {
            color: ${dark_color} !important;
        }
        @media (hover: hover) and (pointer: fine) {
            .dark_mode div#amplitude-right div.song:hover {
                background-color: ${dark_color} !important;
            }
        }
        .dark_mode div#control-container div#repeat-container div#repeat.amplitude-repeat-on {
            -webkit-mask: url("./img/repeat-on.svg");
            mask: url("./img/repeat-on.svg");
            background: ${dark_color} !important;
        }
        .dark_mode div#control-container div#repeat-container div#shuffle.amplitude-shuffle-on {
            -webkit-mask: url("./img/shuffle-on.svg");
            mask: url("./img/shuffle-on.svg");
            background: ${dark_color} !important;
        }
        .dark_mode div#control-container div#central-control-container div#central-controls div#play-pause.amplitude-paused {
            -webkit-mask: url("./img/play.svg");
            mask: url("./img/play.svg");
            background: ${dark_color} !important;
        }
        .dark_mode div#control-container div#central-control-container div#central-controls div#play-pause.amplitude-playing {
            -webkit-mask: url("./img/pause.svg");
            mask: url("./img/pause.svg");
            background: ${dark_color} !important;
        }
        .dark_mode div#control-container div#central-control-container div#central-controls div#previous {
            -webkit-mask: url("./img/prev.svg");
            mask: url("./img/prev.svg");
            background: ${dark_color} !important;
        }
        .dark_mode div#control-container div#central-control-container div#central-controls div#next {
            -webkit-mask: url("./img/next.svg");
            mask: url("./img/next.svg");
            background: ${dark_color} !important;
        }
        .dark_mode div#amplitude-right div.song.amplitude-active-song-container div.song-now-playing-icon-container .now-playing circle {
            fill: ${dark_color} !important;
        }
        .dark_mode #playback-speed-btn.active {
            color: ${dark_color} !important;
        }
        .dark_mode .download_btn, .dark_mode .link_btn, .dark_mode .lyric_btn {
            background-color: ${dark_color};
        }
        .dark_mode .download_btn:hover i, .dark_mode .link_btn:hover i, .dark_mode .lyric_btn:hover i {
            color: ${dark_color} !important;
        }
        .dark_mode .lyric__word.active {
            color: ${dark_color} !important;
        }
        .dark_mode #timer-sleep-btn.active {
            color: ${dark_color} !important;
        }
    `;
        document.head.appendChild(style);
        set_items_color(current_option.color,current_option.dark_color);
    }

    function set_items_color(color,dark_color) {
        const rangeInputs = document.querySelectorAll('input[type="range"],div#progress-container progress#song-played-progress');
        rangeInputs.forEach(input => {
            input.style.setProperty('--track-color', color);
            input.style.setProperty('--thumb-color', color);
            input.classList.add('custom-range');
        });
        const rangeInputs_dark = document.querySelectorAll('.dark_mode input[type="range"],.dark_mode div#progress-container progress#song-played-progress');
        rangeInputs_dark.forEach(input => {
            input.style.setProperty('--track-color', dark_color);
            input.style.setProperty('--thumb-color', dark_color);
            input.classList.add('custom-range');
        });
        if(wavesurfer!==null) {
            if($('#' + id_container_sel).hasClass('dark_mode')) {
                wavesurfer.setProgressColor(current_option.dark_color);
                wavesurfer.setCursorColor(current_option.dark_color);
            } else {
                wavesurfer.setProgressColor(current_option.color);
                wavesurfer.setCursorColor(current_option.color);
            }
        }
    }

    window.view_songs = function () {
        $('#songs_btn').addClass('active');
        $('#albums_btn').removeClass('active');
        $('#songs_list').show();
        $('#albums_list').hide();
        if (current_option.search) {
            $('.search_div').show();
        }
    }

    window.view_albums = function () {
        $('#albums_btn').addClass('active');
        $('#songs_btn').removeClass('active');
        $('#songs_list').hide();
        $('#albums_list').show();
        $('.search_div').hide();
    }

    window.filter_album = function (album_id) {
        search_index++;
        Amplitude.stop();
        $('.album').removeClass('active');
        $('.album[data-id="' + album_id + '"]').addClass('active');
        songs_array = [];
        $.each(all_songs_array, function (index, song) {
            if (song.album_id == album_id || album_id == 'all') {
                songs_array.push(song);
            }
        });
        $('#' + id_container_sel + ' #amplitude-right #songs_list').empty();
        $('.search_div').empty();
        $('#amplitude-right #songs_list').searchable('destroy');
        parse_songs_player(id_container_sel, songs_array, albums_array,false);
        view_songs();
    }

    function parse_songs_player(id_container, songs_array, albums_array, first_time) {
        if (current_option.albums) {
            if (current_option.search) {
                $('.search_div').css('margin-top', '50px');
                $('div#amplitude-right #songs_list').css('padding-top', '50px');
            } else {
                $('.search_div').hide();
                $('div#amplitude-right #songs_list').css('padding-top', '0px');
            }
            if(first_time) {
                var html_albums = "<div data-id='all' onclick=\"filter_album('all');\" class=\"album all-album active\">\n" +
                    "        <img src=\"data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==\">\n" +
                    "        <p class='album_name'>"+current_option.localization.all_songs+"</p>\n" +
                    "        <p class='artist_name'>.</p>\n" +
                    "    </div>";
                $.each(albums_array, function (index, album) {
                    html_albums += "<div data-id='" + album.album_id + "' onclick=\"filter_album('" + album.album_id + "');\" class=\"album\">\n" +
                        "        <img src=\"" + album.image + "\">\n" +
                        "        <p class='album_name'>" + album.album + "</p>\n" +
                        "        <p class='artist_name'>" + ((album.artists.length == 1) ? album.artists[0] : 'Various Artists') + "</p>\n" +
                        "    </div>";
                });
                $('#' + id_container + ' #amplitude-right #albums_list').html(html_albums).promise().done(function () {});
            }
        } else {
            if (current_option.search) {
                $('.search_div').css('margin-top', '0px');
                $('div#amplitude-right #selector').hide();
                $('div#amplitude-right #songs_list').css('padding-top', '50px');
            } else {
                $('.search_div').hide();
                $('div#amplitude-right #selector').hide();
                $('div#amplitude-right #songs_list').css('padding-top', '0px');
            }
        }
        var html_songs = '';
        var lrc_exist = false;
        $.each(songs_array, function (index, song) {
            var lrc_song_exists = false;
            var download_song_exists = false;
            var download_html = '';
            var lrc_html = '';
            if (song.live) {
                var duration = 'live';
            } else {
                var duration = song.duration;
                if(song.link!==undefined && song.link!=='') {
                    download_html = '<div data-link="'+song.link+'" class="link_btn"><i class="fas fa-shopping-cart"></i></div>';
                    download_song_exists = true;
                } else {
                    if(current_option.download) {
                        download_html = '<div data-uri="'+song.url.replace('serve_audio.php','download_audio.php').replace(/'/g, "\\'")+'" class="download_btn"><i class="fas fa-download"></i></div>';
                        download_song_exists = true;
                    }
                }
                if(song.lrc!==undefined && song.lrc!==null && song.lrc!=='') {
                    lrc_html = '<div id="lyric_btn_'+index+'" class="lyric_btn disabled"><i class="fas fa-file-lines"></i></div>';
                    lrc_exist = true;
                    lrc_song_exists = true;
                }
            }
            var offset_width = 130;
            if(download_song_exists && lrc_song_exists) {
                offset_width = 210;
            } else if(!download_song_exists && lrc_song_exists) {
                offset_width = 160;
            } else if(download_song_exists && !lrc_song_exists) {
                offset_width = 160;
            }
            html_songs += "<div class=\"song amplitude-song-container amplitude-play-pause\"  data-album-id='" + song.album_id + "' data-amplitude-song-index=\"" + index + "\">\n" +
                "                <div class=\"song-now-playing-icon-container\">\n" +
                "                    <div class=\"play-button-container\">\n" +
                "                    </div>\n" +
                "                    <div class=\"now-playing\">\n" +
                '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
                '<svg width="20px" height="20px" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <title>--</title>\n' +
                '    <desc>--</desc>\n' +
                '    <defs></defs>\n' +
                '    <g id="05.100.00-OpenSource-Amplitude" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="HD_05.100.00-521Website_OpenSource-Amplitude" transform="translate(-729.000000, -384.000000)">\n' +
                '            <g id="Lead-in">\n' +
                '                <g id="Player" transform="translate(368.000000, 359.000000)">\n' +
                '                    <g id="Playlist" transform="translate(352.000000, 5.000000)">\n' +
                '                        <g id="Song-Item" transform="translate(1.000000, 0.000000)">\n' +
                '                            <g id="Now-Playing">\n' +
                '                                <g transform="translate(8.000000, 20.000000)">\n' +
                '                                    <circle id="Oval-1" fill="#00A0FF" cx="10" cy="10" r="10"></circle>\n' +
                '                                    <path d="M8.90625,12.134375 C8.80328125,12.134375 8.70875,12.1 8.63140625,12.04375 L8.630625,12.0453125 L7.03515625,10.884375 L5.46875,10.884375 C5.21,10.884375 5,10.675 5,10.415625 L5,8.853125 C5,8.5953125 5.20921875,8.3859375 5.46765625,8.384375 L5.46765625,8.3828125 L7.0215625,8.3828125 L8.60953125,7.084375 L8.61078125,7.0859375 C8.69171875,7.01875 8.79359375,6.978125 8.90625,6.978125 C9.16515625,6.978125 9.37515625,7.1875 9.37515625,7.446875 L9.37515625,11.665625 C9.37515625,11.925 9.16515625,12.134375 8.90625,12.134375 L8.90625,12.134375 Z M10.7660937,11.8328125 L10.32125,11.3890625 C10.7060937,10.9078125 10.9375,10.2984375 10.9375,9.634375 C10.9375,8.9703125 10.7060937,8.3609375 10.32125,7.8796875 L10.7660937,7.4359375 C11.263125,8.03125 11.5625,8.796875 11.5625,9.634375 C11.5625,10.4703125 11.263125,11.2375 10.7660937,11.8328125 L10.7660937,11.8328125 Z M11.9845312,13.0515625 L11.5395312,12.60625 C12.233125,11.8109375 12.65625,10.7734375 12.65625,9.634375 C12.65625,8.4953125 12.233125,7.4578125 11.5395312,6.6625 L11.9845312,6.2171875 C12.7909375,7.1265625 13.28125,8.3234375 13.28125,9.634375 C13.28125,10.9453125 12.7909375,12.1421875 11.9845312,13.0515625 L11.9845312,13.0515625 Z M13.2021875,14.26875 L12.7596875,13.8265625 C13.7634375,12.71875 14.375,11.2484375 14.375,9.634375 C14.375,8.0203125 13.7634375,6.55 12.7596875,5.4421875 L13.2021875,5 C14.31875,6.221875 15,7.8484375 15,9.634375 C15,11.4203125 14.31875,13.046875 13.2021875,14.26875 L13.2021875,14.26875 Z" id="Fill-156" fill="#FFFFFF"></path>\n' +
                '                                </g>\n' +
                '                            </g>\n' +
                '                        </g>\n' +
                '                    </g>\n' +
                '                </g>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>' +
                '</div>' +
                "                </div>\n" +
                "                <div style='width: calc(100% - "+offset_width+"px);' class=\"song-meta-data\">\n" +
                "                    <span class=\"song-title\">" + song.name + "</span>\n" +
                "                    <span class=\"song-artist\">" + song.artist + "</span>\n" +
                "                </div>\n" +
                "                <span class=\"song-duration\">" + duration + "</span>\n" +
                "                <span class=\"bandcamp-link\">\n" +
                "                    <img class=\"bandcamp-grey\" style=\"width:24px;height:24px;\" src=\"" + song.cover_art_url + "\">\n" +
                "                </span>\n" + download_html + lrc_html +
                "            </div>";
        });
        $('.search_div').html('<input placeholder="'+current_option.localization.search+'..." id="search_' + search_index + '" class="search_input" type="text" />');
        $('#' + id_container + ' #amplitude-right #songs_list').html(html_songs).promise().done(function () {
            const selectors = [
                '.amplitude-play-pause',
                '.amplitude-next',
                '.amplitude-prev',
                '.amplitude-stop'
            ];
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.addEventListener('click', function() {
                        if (Amplitude.getPlayerState() === 'playing') {
                            userInitiatedPause = true;
                        }
                    });
                });
            });
            $('#amplitude-right #songs_list').searchable({
                selector: '.song',
                childSelector: 'div',
                searchField: '#search_' + search_index,
                searchType: 'default',
                clearOnLoad: true
            });
            init_music_player(id_container, songs_array);
            if(lrc_exist) {
                initLiricle();
            }
            $('.lyric_btn').on('touchend click', function(event) {
                event.stopPropagation();
                event.preventDefault();
                $('#lyric-container').css({'opacity':1,'pointer-events':'initial'});
                $('#close_lyric_btn').show();
            });
            $('.link_btn').on('touchend click', function(event) {
                event.stopPropagation();
                event.preventDefault();
                var link = $(this).attr('data-link');
                setTimeout(() => {
                    window.open(link, '_blank');
                });
            });
            $('.download_btn').on('touchend click', function(event) {
                event.stopPropagation();
                event.preventDefault();
                var uri = $(this).attr('data-uri');
                var link = document.createElement("a");
                var name = uri.replace(/^.*[\\/]/, '');
                link.setAttribute('download', name);
                link.href = uri;
                document.body.appendChild(link);
                link.click();
                link.remove();
            });
        });
    }

    window.close_lyric = function() {
        $('#lyric-container').css({'opacity':0,'pointer-events':'none'});
        $('#close_lyric_btn').hide();
    }

    window.fetch_songs = function (id_container, directory) {
        $.ajax({
            url: "ajax/fetch_songs.php",
            type: "POST",
            async: true,
            timeout: 99999,
            data: {
                directory: directory,
                cache: (current_option.cache) ? 1 : 0,
                sort_by: current_option.sort_by,
                order_by: current_option.order_by
            },
            success: function (json) {
                var rsp = JSON.parse(json);
                all_songs_array = songs_array = rsp.songs;
                albums_array = rsp.albums;
                parse_songs_player(id_container, songs_array, albums_array, true);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert('error');
            }
        });
    }

    function update_nowplayng(url, type) {
        try {
            xhr_now.abort();
        } catch (e) {
        }
        xhr_now = $.ajax({
            url: "ajax/get_currentsong.php",
            type: "POST",
            timeout: 9000,
            data: {
                type: type,
                url: url
            },
            success: function (result) {
                if (result != '') {
                    $('.song-name').html(result);
                    if (current_song != result) {
                        current_song = result;
                        refreshArtwork(result);
                    }
                }
            }
        });
    }

    function refreshArtwork(title) {
        $.ajax({
            url: 'https://itunes.apple.com/search',
            data: {
                term: title,
                media: 'music'
            },
            dataType: 'jsonp',
            success: function (json) {
                if (json.results.length === 0) {
                    var currentIndex = Amplitude.getActiveIndex();
                    $('.main-cover').attr('src', songs_array[currentIndex].cover_art_url);
                    $('#amplitude-left').css('background-image', 'url(\'' + songs_array[currentIndex].cover_art_url + '\')');
                    return;
                }
                var artworkURL = json.results[0].artworkUrl100;
                artworkURL = artworkURL.replace('100x100', '600x600');
                $('.main-cover').attr('src', artworkURL);
                $('#amplitude-left').css('background-image', 'url(\'' + artworkURL + '\')');
            }
        });
    }

    let currentPlaybackRate = 1;
    const playbackSpeeds = [1, 1.5, 2];
    let currentSpeedIndex = 0;
    function changePlaybackSpeed() {
        currentSpeedIndex = (currentSpeedIndex + 1) % playbackSpeeds.length;
        currentPlaybackRate = playbackSpeeds[currentSpeedIndex];
        Amplitude.getAudio().playbackRate = currentPlaybackRate;
        document.getElementById("playback-speed-btn").textContent = `${currentPlaybackRate}x`;
        if(currentPlaybackRate==1) {
            document.getElementById("playback-speed-btn").classList.remove('active');
        } else {
            document.getElementById("playback-speed-btn").classList.add('active');
        }
    }

    function toggleTimerSleepPicker() {
        $('#timer-sleep-picker').empty();
        $('#timer-sleep-picker').durationjs({
            display: "hm",
            mInc: 5,
            hInc: 1,
            initVal: 0
        });
        let container = document.getElementById("timer-sleep-container");
        let countdownFrame;
        $('#timer-sleep-picker').on('resetTimer', function(event) {
            if (countdownFrame) {
                cancelAnimationFrame(countdownFrame);
            }
            container.style.display = "none";
            $('.countdown-timer').html('');
            document.getElementById('timer-sleep-btn').classList.remove('active');
        });
        $('#timer-sleep-picker').on('durationSelected', function(event, totalSeconds) {
            if (totalSeconds <= 0) return;
            container.style.display = "none";
            document.getElementById('timer-sleep-btn').classList.add('active');
            var $countdownDisplay = $('.countdown-timer');
            $countdownDisplay.html(formatTime(totalSeconds));
            var startTime = Date.now();
            var endTime = startTime + totalSeconds * 1000;
            function updateCountdown() {
                var now = Date.now();
                var remainingSeconds = Math.max(Math.floor((endTime - now) / 1000), 0);
                $countdownDisplay.html(formatTime(remainingSeconds));
                if (remainingSeconds > 0) {
                    countdownFrame = requestAnimationFrame(updateCountdown);
                } else {
                    $countdownDisplay.html('');
                    Amplitude.pause();
                    document.getElementById('timer-sleep-btn').classList.remove('active');
                    document.getElementById('play-pause').classList.remove('amplitude-playing');
                    document.getElementById('play-pause').classList.add('amplitude-paused');
                }
            }
            updateCountdown();
        });
        container.style.display = (container.style.display === 'none' || container.style.display === '') ? 'block' : 'none';
    }

    function formatTime(seconds) {
        var d = Math.floor(seconds / 86400); // Days
        var h = Math.floor((seconds % 86400) / 3600); // Hours
        var m = Math.floor((seconds % 3600) / 60); // Minutes
        var s = seconds % 60; // Seconds
        return (d > 0 ? d + "d " : "") +
            (h > 0 || d > 0 ? h.toString().padStart(2, '0') + ":" : "") +
            m.toString().padStart(2, '0') + ":" +
            s.toString().padStart(2, '0');
    }

    function applyPlaybackRate() {
        Amplitude.getAudio().playbackRate = currentPlaybackRate;
    }

    function trackEvent(action, data = {}) {
        fetch('ajax/tracker.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ songs_dir: current_dir, action, ...data }),
        })
            .then(response => response.json())
            .then(result => console.log(`Tracking Success [${current_dir}]:`, action, result.status))
            .catch(error => console.error('Tracking Error:', error));
    }

    function init_music_player(id_container, songs_array) {
        let songElements = document.getElementsByClassName('song');
        for (var i = 0; i < songElements.length; i++) {
            songElements[i].addEventListener('mouseover', function () {
                if (!this.classList.contains('amplitude-active-song-container')) {
                    this.querySelectorAll('.play-button-container')[0].style.display = 'block';
                }
            });
            songElements[i].addEventListener('mouseout', function () {
                this.querySelectorAll('.play-button-container')[0].style.display = 'none';
            });
            songElements[i].addEventListener('click', function () {
                this.querySelectorAll('.play-button-container')[0].style.display = 'none';
            });
        }
        document.getElementById("playback-speed-btn").addEventListener("click", changePlaybackSpeed);
        if(current_option.playback_speed) {
            document.getElementById("playback-speed-btn").style.display = 'inline-block';
        }
        if(current_option.timer_sleep) {
            document.getElementById("timer-sleep-btn").addEventListener("click", toggleTimerSleepPicker);
            document.getElementById("timer-sleep-btn").style.display = 'inline-block';
            document.getElementById("countdown-container").style.display = 'inline-block';
        }

        let lastTimeUpdate = 0;
        const updateInterval = 1;
        const timePlayedSec = 10;
        let songStartInfo = { name: null, startTime: null };

        Amplitude.init({
            playback_speed: 1.0,
            volume: current_option.volume,
            continue_next: true,
            shuffle_on: false,
            preload: 'auto',
            default_album_art: 'img/default_cover_art.jpg',
            songs: songs_array,
            callbacks: {
                initialized: function () {
                    trackEvent('player_open');
                    Amplitude.pause();
                    setInterval(function () {
                        Amplitude.setVolume(Amplitude.getVolume());
                    }, 500);
                    setTimeout(function () {
                        $('#' + id_container + ' #repeat').trigger('click');
                        if (current_option.waveform_width > 0) {
                            if($('#' + id_container).hasClass('dark_mode')) {
                                var waveform_color = current_option.dark_color;
                            } else {
                                var waveform_color = current_option.color;
                            }
                            var ctx = document.createElement('canvas').getContext('2d');
                            var linGrad = ctx.createLinearGradient(0, 64, 0, 200);
                            linGrad.addColorStop(0.5, 'rgba(255,255,255,0.9)');
                            linGrad.addColorStop(0.5, 'rgba(255,255,255,0.9)');
                            wavesurfer = WaveSurfer.create({
                                container: '#waveform',
                                waveColor: linGrad,
                                progressColor: waveform_color,
                                cursorColor: waveform_color,
                                barWidth: current_option.waveform_width,
                                barRadius: 5,
                                cursorWidth: 1,
                                barGap: 1,
                                normalize: true,
                                responsive: true,
                                interact: false,
                                audioContext: Amplitude.getConfig().context
                            });
                            get_peaks(0, songs_array);
                        } else {
                            $('#' + id_container + ' #waveform').hide();
                        }
                        $('#' + id_container + ' #loading').hide();
                        $('#' + id_container + ' #blue-playlist-container').fadeIn();
                        if (mobileCheck()) $('#' + id_container + ' #control-container-mobile').hide();
                        setTimeout(function () {
                            $(document).trigger('resize');
                        }, 50);
                        $('#' + id_container + ' #waveform').css('opacity', 0);
                        $('#' + id_container + ' #amplitude-left').css('background-image', 'url(\'' + songs_array[0].cover_art_url + '\')');
                        if (songs_array[0].live) {
                            update_nowplayng(songs_array[0].url, songs_array[0].type);
                            interval_nowplayng = setInterval(function () {
                                update_nowplayng(songs_array[0].url, songs_array[0].type);
                            }, 10000);
                        }
                        Amplitude.playSongAtIndex( 0 );
                        if (songs_array[0].lrc!=='') {
                            $('#lyric_btn_0').removeClass('disabled');
                            liricle.load({ url: songs_array[0].lrc });
                            liricle.on("load", (data) => {
                                lirc_loaded = true;
                            });
                        }
                    }, 500);
                },
                song_change: function () {
                    const timePlayed = (new Date().getTime() - songStartInfo.startTime) / 1000;
                    const previousSong = Amplitude.getSongAtIndex(Amplitude.getActiveIndex() - 1);
                    if (songStartInfo.name && (!previousSong || !previousSong.live) && timePlayed > 1 && timePlayed < timePlayedSec) {
                        trackEvent('song_skip', { song_title: songStartInfo.artist + ' - ' + songStartInfo.name });
                    }
                    lastTimeUpdate = 0;
                    clearInterval(interval_nowplayng);
                    var currentIndex = Amplitude.getActiveIndex();
                    $('#' + id_container + ' #amplitude-left').css('background-image', 'url(\'' + songs_array[currentIndex].cover_art_url + '\')');
                    Amplitude.setVolume(Amplitude.getVolume());
                    $('#' + id_container + ' #waveform').css('opacity', 0);
                    wavesurfer.cancelAjax();
                    if (songs_array[currentIndex].live) {
                        update_nowplayng(songs_array[currentIndex].url, songs_array[currentIndex].type);
                        interval_nowplayng = setInterval(function () {
                            update_nowplayng(songs_array[currentIndex].url, songs_array[currentIndex].type);
                        }, 10000);
                        $('#' + id_container + ' .loading_song').hide();
                    } else {
                        $('#' + id_container + ' .loading_song').show();
                    }
                    applyPlaybackRate();
                    get_peaks(currentIndex, songs_array);
                    $('#lyric-content').empty();
                    $('#lyric-cursor').hide();
                    $('.lyric_btn').addClass('disabled');
                    if (songs_array[currentIndex].lrc!=='') {
                        $('#lyric_btn_'+currentIndex).removeClass('disabled');
                        liricle.load({ url: songs_array[currentIndex].lrc });
                        liricle.on("load", (data) => {
                            lirc_loaded = true;
                        });
                    } else {
                        close_lyric();
                        lirc_loaded = false;
                    }
                },
                timeupdate: function () {
                    var perc = Amplitude.getSongPlayedPercentage() / 100;
                    wavesurfer.seekTo(perc);
                    if(liricle!==null) {
                        try {
                            if(lirc_loaded) liricle.sync(Amplitude.getSongPlayedSeconds());
                        } catch (e) {}
                    }
                    const currentTime = Amplitude.getSongPlayedSeconds();
                    if (currentTime > lastTimeUpdate + updateInterval) {
                        const timeElapsed = currentTime - lastTimeUpdate;
                        lastTimeUpdate = currentTime;
                        const currentSong = Amplitude.getActiveSongMetadata();
                        trackEvent('song_time_update', {
                            song_title: currentSong.artist + ' - ' + currentSong.name,
                            time_played: timeElapsed
                        });
                    }
                },
                pause: function () {
                    if (userInitiatedPause) {
                        const song = Amplitude.getActiveSongMetadata();
                        console.log('%cUser-initiated pause detected! Sending event...', 'color: orange; font-weight: bold;');
                        trackEvent('song_pause', { song_title: song.artist + ' - ' + song.name });
                        userInitiatedPause = false;
                    }
                    $('#' + id_container + ' .loading_song').hide();
                },
                play: function () {
                    const currentSong = Amplitude.getActiveSongMetadata();
                    songStartInfo = { artist: currentSong.artist, name: currentSong.name, startTime: new Date().getTime() };
                    trackEvent('song_play', { song_title: currentSong.artist + ' - ' + currentSong.name });
                    Amplitude.setVolume(Amplitude.getVolume());
                    applyPlaybackRate();
                    $('#' + id_container + ' .loading_song').show();
                    setTimeout(function () {
                        $(document).trigger('resize');
                    }, 50);
                },
                stop: function () {
                    lastTimeUpdate = 0;
                    $('#' + id_container + ' .loading_song').hide();
                },
                ended: function() {
                    const song = Amplitude.getActiveSongMetadata();
                    if (song && !song.live) {
                        trackEvent('song_completion', { song_title: song.artist + ' - ' + song.name });
                    }
                    lastTimeUpdate = 0;
                },
                loadeddata: function () {

                },
                playing: function () {
                    $('#' + id_container + ' .loading_song').hide();
                    Amplitude.setVolume(Amplitude.getVolume());
                    var currentIndex = Amplitude.getActiveIndex();
                    var songs_array_len = songs_array.length;
                    if (currentIndex == (songs_array_len - 1)) {
                        var nextIndex = 0;
                    } else {
                        var nextIndex = currentIndex + 1;
                    }
                    var next_song = songs_array[nextIndex].url;
                    var preloader = new Audio();
                    preloader.src = next_song;
                    preloader.load();
                },
            }
        });
    }

    function get_peaks(index, songs_array) {
        wavesurfer.un('ready');
        var current_src = songs_array[index].url;
        if (songs_array[index].live == false) {
            try {
                if (current_option.waveform_width > 0) {
                    var peaks_url = current_src.substr(0, current_src.lastIndexOf(".")) + ".json";
                    $.ajax({
                        url: 'ajax/get_peaks.php',
                        type: "POST",
                        data: {
                            peaks_url: peaks_url
                        },
                        async: true,
                        success: function (rsp) {
                            if (rsp == '') {
                                wavesurfer.load(current_src);
                                wavesurfer.on('ready', function () {
                                    $('#waveform').css('opacity', 1);
                                    var peaks = wavesurfer.backend.getPeaks(1024);
                                    var peaks_json = JSON.stringify(peaks);
                                    var currentIndex = Amplitude.getActiveIndex();
                                    var current_src = songs_array[currentIndex].url;
                                    $.ajax({
                                        url: "ajax/save_peaks.php",
                                        type: "POST",
                                        data: {
                                            current_src: current_src,
                                            peaks: peaks_json
                                        },
                                        async: true,
                                        success: function (json) {
                                        }
                                    });
                                });
                            } else {
                                var peaks = JSON.parse(rsp);
                                wavesurfer.load('asset/empty.mp3', peaks);
                                wavesurfer.on('ready', function () {
                                    $('#waveform').css('opacity', 1);
                                });
                            }
                        },
                        error: function () {
                            wavesurfer.load(current_src);
                        }
                    });
                }
            } catch (e) {

            }
        }
    }

    $(window).resize(function () {
        if (document.getElementById(id_container_sel).clientWidth <= 639) {
            if (current_option.waveform_width > 0) {
                if ($('#control-container-mobile').is(':visible')) {
                    if($('#playback-speed-btn').is(':visible') || $('#timer-sleep-btn').is(':visible')) {
                        if($('#dark_mode_themeToggle').is(':visible')) {
                            $('div#amplitude-left').css('height', '360px');
                            $('div#amplitude-left').css('padding-top', '40px');
                        } else {
                            $('div#amplitude-left').css('height', '320px');
                            $('div#amplitude-left').css('padding-top', '0px');
                        }
                    } else {
                        if($('#dark_mode_themeToggle').is(':visible')) {
                            $('div#amplitude-left').css('height', '320px');
                            $('div#amplitude-left').css('padding-top', '40px');
                        } else {
                            $('div#amplitude-left').css('height', '280px');
                            $('div#amplitude-left').css('padding-top', '0px');
                        }
                    }
                } else {
                    if($('#playback-speed-btn').is(':visible') || $('#timer-sleep-btn').is(':visible')) {
                        if($('#dark_mode_themeToggle').is(':visible')) {
                            $('div#amplitude-left').css('height', '320px');
                            $('div#amplitude-left').css('padding-top', '40px');
                        } else {
                            $('div#amplitude-left').css('height', '280px');
                            $('div#amplitude-left').css('padding-top', '0px');
                        }
                    } else {
                        if($('#dark_mode_themeToggle').is(':visible')) {
                            $('div#amplitude-left').css('height', '290px');
                            $('div#amplitude-left').css('padding-top', '40px');
                        } else {
                            $('div#amplitude-left').css('height', '250px');
                            $('div#amplitude-left').css('padding-top', '0px');
                        }
                    }
                }
            } else {
                if ($('#control-container-mobile').is(':visible')) {
                    if($('#playback-speed-btn').is(':visible') || $('#timer-sleep-btn').is(':visible')) {
                        if($('#dark_mode_themeToggle').is(':visible')) {
                            $('div#amplitude-left').css('height', '320px');
                            $('div#amplitude-left').css('padding-top', '40px');
                        } else {
                            $('div#amplitude-left').css('height', '280px');
                            $('div#amplitude-left').css('padding-top', '0px');
                        }
                    } else {
                        if($('#dark_mode_themeToggle').is(':visible')) {
                            $('div#amplitude-left').css('height', '290px');
                            $('div#amplitude-left').css('padding-top', '40px');
                        } else {
                            $('div#amplitude-left').css('height', '250px');
                            $('div#amplitude-left').css('padding-top', '0px');
                        }
                    }
                } else {
                    if($('#playback-speed-btn').is(':visible') || $('#timer-sleep-btn').is(':visible')) {
                        if($('#dark_mode_themeToggle').is(':visible')) {
                            $('div#amplitude-left').css('height', '290px');
                            $('div#amplitude-left').css('padding-top', '40px');
                        } else {
                            $('div#amplitude-left').css('height', '250px');
                            $('div#amplitude-left').css('padding-top', '0px');
                        }
                    } else {
                        if($('#dark_mode_themeToggle').is(':visible')) {
                            $('div#amplitude-left').css('height', '260px');
                            $('div#amplitude-left').css('padding-top', '40px');
                        } else {
                            $('div#amplitude-left').css('height', '220px');
                            $('div#amplitude-left').css('padding-top', '0px');
                        }
                    }
                }
            }
        } else {
            $('div#amplitude-left').css('height', '');
            $('div#amplitude-left').css('padding-top', '0px');
        }
    });

})(jQuery);

!function (e, t) {
    "object" == typeof exports && "object" == typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define("Amplitude", [], t) : "object" == typeof exports ? exports.Amplitude = t() : e.Amplitude = t()
}(this, function () {
    return function (e) {
        function t(l) {
            if (a[l]) return a[l].exports;
            var u = a[l] = {i: l, l: !1, exports: {}};
            return e[l].call(u.exports, u, u.exports, t), u.l = !0, u.exports
        }

        var a = {};
        return t.m = e, t.c = a, t.i = function (e) {
            return e
        }, t.d = function (e, a, l) {
            t.o(e, a) || Object.defineProperty(e, a, {configurable: !1, enumerable: !0, get: l})
        }, t.n = function (e) {
            var a = e && e.__esModule ? function () {
                return e.default
            } : function () {
                return e
            };
            return t.d(a, "a", a), a
        }, t.o = function (e, t) {
            return Object.prototype.hasOwnProperty.call(e, t)
        }, t.p = "", t(t.s = 47)
    }([function (e, t, a) {
        "use strict";
        var l = a(59);
        e.exports = {
            version: l.version,
            audio: new Audio,
            active_metadata: {},
            active_album: "",
            active_index: 0,
            active_playlist: null,
            playback_speed: 1,
            callbacks: {},
            songs: [],
            playlists: {},
            start_song: "",
            starting_playlist: "",
            starting_playlist_song: "",
            repeat: !1,
            repeat_song: !1,
            shuffle_list: {},
            shuffle_on: !1,
            default_album_art: "",
            default_playlist_art: "",
            debug: !1,
            volume: .5,
            pre_mute_volume: .5,
            volume_increment: 5,
            volume_decrement: 5,
            soundcloud_client: "",
            soundcloud_use_art: !1,
            soundcloud_song_count: 0,
            soundcloud_songs_ready: 0,
            is_touch_moving: !1,
            buffered: 0,
            bindings: {},
            continue_next: !0,
            delay: 0,
            player_state: "stopped",
            web_audio_api_available: !1,
            context: null,
            source: null,
            analyser: null,
            visualizations: {available: [], active: [], backup: ""},
            waveforms: {sample_rate: 100, built: []}
        }
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(5), d = (l(i), a(3)), s = (l(d), a(2)), o = (l(s), a(7)), f = (l(o), a(9)),
            r = l(f), c = a(4), p = l(c), v = a(16), y = l(v), g = a(6), m = l(g), _ = function () {
                function e() {
                    y.default.stop(), y.default.run(), n.default.active_metadata.live && s(), /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && !n.default.paused && s();
                    var e = n.default.audio.play();
                    void 0 !== e && e.then(function (e) {
                    }).catch(function (e) {
                    }), n.default.audio.play(), n.default.audio.playbackRate = n.default.playback_speed, m.default.setPlayerState()
                }

                function t() {
                    y.default.stop(), n.default.audio.pause(), n.default.paused = !0, n.default.active_metadata.live && d(), m.default.setPlayerState()
                }

                function a() {
                    y.default.stop(), 0 != n.default.audio.currentTime && (n.default.audio.currentTime = 0), n.default.audio.pause(), n.default.active_metadata.live && d(), m.default.setPlayerState(), r.default.run("stop")
                }

                function l(e) {
                    n.default.audio.muted = 0 == e, n.default.volume = e, n.default.audio.volume = e / 100
                }

                function u(e) {
                    n.default.active_metadata.live || (n.default.audio.currentTime = n.default.audio.duration * (e / 100))
                }

                function i(e) {
                    n.default.audio.addEventListener("canplaythrough", function () {
                        n.default.audio.duration >= e && e > 0 ? n.default.audio.currentTime = e : p.default.writeMessage("Amplitude can't skip to a location greater than the duration of the audio or less than 0")
                    }, {once: !0})
                }

                function d() {
                    n.default.audio.src = "", n.default.audio.load()
                }

                function s() {
                    n.default.audio.src = n.default.active_metadata.url, n.default.audio.load()
                }

                function o(e) {
                    n.default.playback_speed = e, n.default.audio.playbackRate = n.default.playback_speed
                }

                return {
                    play: e,
                    pause: t,
                    stop: a,
                    setVolume: l,
                    setSongLocation: u,
                    skipToLocation: i,
                    disconnectStream: d,
                    reconnectStream: s,
                    setPlaybackSpeed: o
                }
            }();
        t.default = _, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e() {
                t(), a(), l(), n()
            }

            function t() {
                for (var e = u.default.audio.paused ? "paused" : "playing", t = document.querySelectorAll(".amplitude-play-pause"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist"),
                        n = t[a].getAttribute("data-amplitude-song-index");
                    if (null == l && null == n) switch (e) {
                        case"playing":
                            d(t[a]);
                            break;
                        case"paused":
                            s(t[a])
                    }
                }
            }

            function a() {
                for (var e = u.default.audio.paused ? "paused" : "playing", t = document.querySelectorAll('.amplitude-play-pause[data-amplitude-playlist="' + u.default.active_playlist + '"]'), a = 0; a < t.length; a++) {
                    if (null == t[a].getAttribute("data-amplitude-song-index")) switch (e) {
                        case"playing":
                            d(t[a]);
                            break;
                        case"paused":
                            s(t[a])
                    }
                }
            }

            function l() {
                for (var e = u.default.audio.paused ? "paused" : "playing", t = document.querySelectorAll('.amplitude-play-pause[data-amplitude-song-index="' + u.default.active_index + '"]'), a = 0; a < t.length; a++) {
                    if (null == t[a].getAttribute("data-amplitude-playlist")) switch (e) {
                        case"playing":
                            d(t[a]);
                            break;
                        case"paused":
                            s(t[a])
                    }
                }
            }

            function n() {
                for (var e = u.default.audio.paused ? "paused" : "playing", t = "" != u.default.active_playlist && null != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null, a = document.querySelectorAll('.amplitude-play-pause[data-amplitude-song-index="' + t + '"][data-amplitude-playlist="' + u.default.active_playlist + '"]'), l = 0; l < a.length; l++) switch (e) {
                    case"playing":
                        d(a[l]);
                        break;
                    case"paused":
                        s(a[l])
                }
            }

            function i() {
                for (var e = document.querySelectorAll(".amplitude-play-pause"), t = 0; t < e.length; t++) s(e[t])
            }

            function d(e) {
                e.classList.add("amplitude-playing"), e.classList.remove("amplitude-paused")
            }

            function s(e) {
                e.classList.remove("amplitude-playing"), e.classList.add("amplitude-paused")
            }

            return {sync: e, syncGlobal: t, syncPlaylist: a, syncSong: l, syncSongInPlaylist: n, syncToPause: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(1), d = l(i), s = a(9), o = l(s), f = a(5), r = l(f), c = a(2), p = l(c),
            v = a(14), y = l(v), g = a(20), m = l(g), _ = a(15), h = l(_), b = a(7), A = l(b), x = a(49), M = l(x),
            P = function () {
                function e() {
                    var e = arguments.length > 0 && void 0 !== arguments[0] && arguments[0], t = null, a = {}, l = !1;
                    n.default.repeat_song ? n.default.shuffle_on ? (t = n.default.shuffle_list[n.default.active_index].index, a = n.default.shuffle_list[t]) : (t = n.default.active_index, a = n.default.songs[t]) : n.default.shuffle_on ? (parseInt(n.default.active_index) + 1 < n.default.shuffle_list.length ? t = parseInt(n.default.active_index) + 1 : (t = 0, l = !0), a = n.default.shuffle_list[t]) : (parseInt(n.default.active_index) + 1 < n.default.songs.length ? t = parseInt(n.default.active_index) + 1 : (t = 0, l = !0), a = n.default.songs[t]), u(a, t), l && !n.default.repeat || e && !n.default.repeat && l || d.default.play(), p.default.sync(), o.default.run("next"), n.default.repeat_song && o.default.run("song_repeated")
                }

                function t(e) {
                    var t = arguments.length > 1 && void 0 !== arguments[1] && arguments[1], a = null, l = {}, u = !1;
                    n.default.repeat_song ? n.default.playlists[e].shuffle ? (a = n.default.playlists[e].active_index, l = n.default.playlists[e].shuffle_list[a]) : (a = n.default.playlists[e].active_index, l = n.default.playlists[e].songs[a]) : n.default.playlists[e].shuffle ? (parseInt(n.default.playlists[e].active_index) + 1 < n.default.playlists[e].shuffle_list.length ? a = n.default.playlists[e].active_index + 1 : (a = 0, u = !0), l = n.default.playlists[e].shuffle_list[a]) : (parseInt(n.default.playlists[e].active_index) + 1 < n.default.playlists[e].songs.length ? a = parseInt(n.default.playlists[e].active_index) + 1 : (a = 0, u = !0), l = n.default.playlists[e].songs[a]), c(e), i(e, l, a), u && !n.default.repeat || t && !n.default.repeat && u || d.default.play(), p.default.sync(), o.default.run("next"), n.default.repeat_song && o.default.run("song_repeated")
                }

                function a() {
                    var e = null, t = {};
                    n.default.repeat_song ? n.default.shuffle_on ? (e = n.default.active_index, t = n.default.shuffle_list[e]) : (e = n.default.active_index, t = n.default.songs[e]) : (e = parseInt(n.default.active_index) - 1 >= 0 ? parseInt(n.default.active_index - 1) : parseInt(n.default.songs.length - 1), t = n.default.shuffle_on ? n.default.shuffle_list[e] : n.default.songs[e]), u(t, e), d.default.play(), p.default.sync(), o.default.run("prev"), n.default.repeat_song && o.default.run("song_repeated")
                }

                function l(e) {
                    var t = null, a = {};
                    n.default.repeat_song ? n.default.playlists[e].shuffle ? (t = n.default.playlists[e].active_index, a = n.default.playlists[e].shuffle_list[t]) : (t = n.default.playlists[e].active_index, a = n.default.playlists[e].songs[t]) : (t = parseInt(n.default.playlists[e].active_index) - 1 >= 0 ? parseInt(n.default.playlists[e].active_index - 1) : parseInt(n.default.playlists[e].songs.length - 1), a = n.default.playlists[e].shuffle ? n.default.playlists[e].shuffle_list[t] : n.default.playlists[e].songs[t]), c(e), i(e, a, t), d.default.play(), p.default.sync(), o.default.run("prev"), n.default.repeat_song && o.default.run("song_repeated")
                }

                function u(e, t) {
                    var a = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
                    s(e), n.default.audio.src = e.url, n.default.active_metadata = e, n.default.active_album = e.album, n.default.active_index = parseInt(t), f(a)
                }

                function i(e, t, a) {
                    var l = arguments.length > 3 && void 0 !== arguments[3] && arguments[3];
                    s(t), n.default.audio.src = t.url, n.default.active_metadata = t, n.default.active_album = t.album, n.default.active_index = null, n.default.playlists[e].active_index = parseInt(a), f(l)
                }

                function s(e) {
                    d.default.stop(), p.default.syncToPause(), y.default.resetElements(), m.default.resetElements(), h.default.resetCurrentTimes(), r.default.newAlbum(e) && o.default.run("album_change")
                }

                function f(e) {
                    A.default.displayMetaData(), M.default.setActive(e), h.default.resetDurationTimes(), o.default.run("song_change")
                }

                function c(e) {
                    n.default.active_playlist != e && (o.default.run("playlist_changed"), n.default.active_playlist = e, null != e && (n.default.playlists[e].active_index = 0))
                }

                return {
                    setNext: e,
                    setNextPlaylist: t,
                    setPrevious: a,
                    setPreviousPlaylist: l,
                    changeSong: u,
                    changeSongPlaylist: i,
                    setActivePlaylist: c
                }
            }();
        t.default = P, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                u.default.debug && console.log(e)
            }

            return {writeMessage: e}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e, t) {
                return u.default.active_playlist != e || (null == u.default.active_playlist && null == e ? u.default.active_index != t : u.default.active_playlist == e && u.default.playlists[e].active_index != t)
            }

            function t(e) {
                return u.default.active_album != e
            }

            function a(e) {
                return u.default.active_playlist != e
            }

            function l(e) {
                return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(e)
            }

            function n(e) {
                return !isNaN(e) && parseInt(Number(e)) == e && !isNaN(parseInt(e, 10))
            }

            return {newSong: e, newAlbum: t, newPlaylist: a, isURL: l, isInt: n}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e() {
                u.default.audio = new Audio, u.default.active_metadata = {}, u.default.active_album = "", u.default.active_index = 0, u.default.active_playlist = null, u.default.playback_speed = 1, u.default.callbacks = {}, u.default.songs = [], u.default.playlists = {}, u.default.start_song = "", u.default.starting_playlist = "", u.default.starting_playlist_song = "", u.default.repeat = !1, u.default.shuffle_list = {}, u.default.shuffle_on = !1, u.default.default_album_art = "", u.default.default_playlist_art = "", u.default.debug = !1, u.default.volume = .5, u.default.pre_mute_volume = .5, u.default.volume_increment = 5, u.default.volume_decrement = 5, u.default.soundcloud_client = "", u.default.soundcloud_use_art = !1, u.default.soundcloud_song_count = 0, u.default.soundcloud_songs_ready = 0, u.default.continue_next = !0
            }

            function t() {
                u.default.audio.paused && 0 == u.default.audio.currentTime && (u.default.player_state = "stopped"), u.default.audio.paused && u.default.audio.currentTime > 0 && (u.default.player_state = "paused"), u.default.audio.paused || (u.default.player_state = "playing")
            }

            return {resetConfig: e, setPlayerState: t}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e() {
                for (var e = ["cover_art_url", "station_art_url", "podcast_episode_cover_art_url"], t = document.querySelectorAll("[data-amplitude-song-info]"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-song-info"),
                        n = t[a].getAttribute("data-amplitude-playlist"),
                        i = t[a].getAttribute("data-amplitude-song-index");
                    if (null == i && (u.default.active_playlist == n || null == n && null == i)) {
                        var d = void 0 != u.default.active_metadata[l] ? u.default.active_metadata[l] : null;
                        e.indexOf(l) >= 0 ? (d = d || u.default.default_album_art, t[a].setAttribute("src", d)) : (d = d || "", t[a].innerHTML = d)
                    }
                }
            }

            function t() {
                for (var e = ["image_url"], t = document.querySelectorAll("[data-amplitude-playlist-info]"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist-info"),
                        n = t[a].getAttribute("data-amplitude-playlist");
                    void 0 != u.default.playlists[n][l] ? e.indexOf(l) >= 0 ? t[a].setAttribute("src", u.default.playlists[n][l]) : t[a].innerHTML = u.default.playlists[n][l] : e.indexOf(l) >= 0 ? "" != u.default.default_playlist_art ? t[a].setAttribute("src", u.default.default_playlist_art) : t[a].setAttribute("src", "") : t[a].innerHTML = ""
                }
            }

            function a(e, t) {
                for (var a = ["cover_art_url", "station_art_url", "podcast_episode_cover_art_url"], l = document.querySelectorAll('[data-amplitude-song-info][data-amplitude-playlist="' + t + '"]'), u = 0; u < l.length; u++) {
                    var n = l[u].getAttribute("data-amplitude-song-info");
                    l[u].getAttribute("data-amplitude-playlist") == t && (void 0 != e[n] ? a.indexOf(n) >= 0 ? l[u].setAttribute("src", e[n]) : l[u].innerHTML = e[n] : a.indexOf(n) >= 0 ? "" != e.default_album_art ? l[u].setAttribute("src", e.default_album_art) : l[u].setAttribute("src", "") : l[u].innerHTML = "")
                }
            }

            function l() {
                for (var e = ["cover_art_url", "station_art_url", "podcast_episode_cover_art_url"], a = document.querySelectorAll("[data-amplitude-song-info]"), l = 0; l < a.length; l++) {
                    var n = a[l].getAttribute("data-amplitude-song-index"),
                        i = a[l].getAttribute("data-amplitude-playlist");
                    if (null != n && null == i) {
                        var d = a[l].getAttribute("data-amplitude-song-info"),
                            s = void 0 != u.default.songs[n][d] ? u.default.songs[n][d] : null;
                        e.indexOf(d) >= 0 ? (s = s || u.default.default_album_art, a[l].setAttribute("src", s)) : a[l].innerHTML = s
                    }
                    if (null != n && null != i) {
                        var o = a[l].getAttribute("data-amplitude-song-info");
                        void 0 != u.default.playlists[i].songs[n][o] && (e.indexOf(o) >= 0 ? a[l].setAttribute("src", u.default.playlists[i].songs[n][o]) : a[l].innerHTML = u.default.playlists[i].songs[n][o])
                    }
                }
                t()
            }

            return {displayMetaData: e, setFirstSongInPlaylist: a, syncMetaData: l, displayPlaylistMetaData: t}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e() {
                for (var e = document.getElementsByClassName("amplitude-repeat"), t = 0; t < e.length; t++) u.default.repeat ? (e[t].classList.add("amplitude-repeat-on"), e[t].classList.remove("amplitude-repeat-off")) : (e[t].classList.remove("amplitude-repeat-on"), e[t].classList.add("amplitude-repeat-off"))
            }

            function t(e) {
                for (var t = document.getElementsByClassName("amplitude-repeat"), a = 0; a < t.length; a++) t[a].getAttribute("data-amplitude-playlist") == e && (u.default.playlists[e].repeat ? (t[a].classList.add("amplitude-repeat-on"), t[a].classList.remove("amplitude-repeat-off")) : (t[a].classList.add("amplitude-repeat-off"), t[a].classList.remove("amplitude-repeat-on")))
            }

            function a() {
                for (var e = document.getElementsByClassName("amplitude-repeat-song"), t = 0; t < e.length; t++) u.default.repeat_song ? (e[t].classList.add("amplitude-repeat-song-on"), e[t].classList.remove("amplitude-repeat-song-off")) : (e[t].classList.remove("amplitude-repeat-song-on"), e[t].classList.add("amplitude-repeat-song-off"))
            }

            return {syncRepeat: e, syncRepeatPlaylist: t, syncRepeatSong: a}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(4), d = l(i), s = function () {
            function e() {
                n.default.audio.addEventListener("abort", function () {
                    t("abort")
                }), n.default.audio.addEventListener("error", function () {
                    t("error")
                }), n.default.audio.addEventListener("loadeddata", function () {
                    t("loadeddata")
                }), n.default.audio.addEventListener("loadedmetadata", function () {
                    t("loadedmetadata")
                }), n.default.audio.addEventListener("loadstart", function () {
                    t("loadstart")
                }), n.default.audio.addEventListener("pause", function () {
                    t("pause")
                }), n.default.audio.addEventListener("playing", function () {
                    t("playing")
                }), n.default.audio.addEventListener("play", function () {
                    t("play")
                }), n.default.audio.addEventListener("progress", function () {
                    t("progress")
                }), n.default.audio.addEventListener("ratechange", function () {
                    t("ratechange")
                }), n.default.audio.addEventListener("seeked", function () {
                    t("seeked")
                }), n.default.audio.addEventListener("seeking", function () {
                    t("seeking")
                }), n.default.audio.addEventListener("stalled", function () {
                    t("stalled")
                }), n.default.audio.addEventListener("suspend", function () {
                    t("suspend")
                }), n.default.audio.addEventListener("timeupdate", function () {
                    t("timeupdate")
                }), n.default.audio.addEventListener("volumechange", function () {
                    t("volumechange")
                }), n.default.audio.addEventListener("waiting", function () {
                    t("waiting")
                }), n.default.audio.addEventListener("canplay", function () {
                    t("canplay")
                }), n.default.audio.addEventListener("canplaythrough", function () {
                    t("canplaythrough")
                }), n.default.audio.addEventListener("durationchange", function () {
                    t("durationchange")
                }), n.default.audio.addEventListener("ended", function () {
                    t("ended")
                })
            }

            function t(e) {
                if (n.default.callbacks[e]) {
                    var t = n.default.callbacks[e];
                    d.default.writeMessage("Running Callback: " + e);
                    try {
                        t()
                    } catch (e) {
                        if ("CANCEL EVENT" == e.message) throw e;
                        d.default.writeMessage("Callback error: " + e.message)
                    }
                }
            }

            return {initialize: e, run: t}
        }();
        t.default = s, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = function () {
            function e(e) {
                for (var t = document.getElementsByClassName("amplitude-mute"), a = 0; a < t.length; a++) e ? (t[a].classList.remove("amplitude-not-muted"), t[a].classList.add("amplitude-muted")) : (t[a].classList.add("amplitude-not-muted"), t[a].classList.remove("amplitude-muted"))
            }

            return {setMuted: e}
        }();
        t.default = l, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e() {
                for (var e = document.getElementsByClassName("amplitude-volume-slider"), t = 0; t < e.length; t++) e[t].value = 100 * u.default.audio.volume
            }

            return {sync: e}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                u.default.repeat = e
            }

            function t(e, t) {
                u.default.playlists[t].repeat = e
            }

            function a(e) {
                u.default.repeat_song = e
            }

            return {setRepeat: e, setRepeatPlaylist: t, setRepeatSong: a}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                u.default.shuffle_on = e, e ? n() : u.default.shuffle_list = []
            }

            function t() {
                u.default.shuffle_on ? (u.default.shuffle_on = !1, u.default.shuffle_list = []) : (u.default.shuffle_on = !0, n())
            }

            function a(e, t) {
                u.default.playlists[e].shuffle = t, u.default.playlists[e].shuffle ? i(e) : u.default.playlists[e].shuffle_list = []
            }

            function l(e) {
                u.default.playlists[e].shuffle ? (u.default.playlists[e].shuffle = !1, u.default.playlists[e].shuffle_list = []) : (u.default.playlists[e].shuffle = !0, i(e))
            }

            function n() {
                for (var e = new Array(u.default.songs.length), t = 0; t < u.default.songs.length; t++) e[t] = u.default.songs[t];
                for (var a = u.default.songs.length - 1; a > 0; a--) {
                    d(e, a, Math.floor(Math.random() * u.default.songs.length + 1) - 1)
                }
                u.default.shuffle_list = e
            }

            function i(e) {
                for (var t = new Array(u.default.playlists[e].songs.length), a = 0; a < u.default.playlists[e].songs.length; a++) t[a] = u.default.playlists[e].songs[a];
                for (var l = u.default.playlists[e].songs.length - 1; l > 0; l--) {
                    d(t, l, Math.floor(Math.random() * u.default.playlists[e].songs.length + 1) - 1)
                }
                u.default.playlists[e].shuffle_list = t
            }

            function d(e, t, a) {
                var l = e[t];
                e[t] = e[a], e[a] = l
            }

            return {
                setShuffle: e,
                toggleShuffle: t,
                setShufflePlaylist: a,
                toggleShufflePlaylist: l,
                shuffleSongs: n,
                shufflePlaylistSongs: i
            }
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e, u, i) {
                t(e), a(e, u), l(e, i), n(e, u)
            }

            function t(e) {
                e = isNaN(e) ? 0 : e;
                for (var t = document.querySelectorAll(".amplitude-song-slider"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist"),
                        u = t[a].getAttribute("data-amplitude-song-index");
                    null == l && null == u && (t[a].value = e)
                }
            }

            function a(e, t) {
                e = isNaN(e) ? 0 : e;
                for (var a = document.querySelectorAll('.amplitude-song-slider[data-amplitude-playlist="' + t + '"]'), l = 0; l < a.length; l++) {
                    var u = a[l].getAttribute("data-amplitude-playlist"),
                        n = a[l].getAttribute("data-amplitude-song-index");
                    u == t && null == n && (a[l].value = e)
                }
            }

            function l(e, t) {
                if (null == u.default.active_playlist) {
                    e = isNaN(e) ? 0 : e;
                    for (var a = document.querySelectorAll('.amplitude-song-slider[data-amplitude-song-index="' + t + '"]'), l = 0; l < a.length; l++) {
                        var n = a[l].getAttribute("data-amplitude-playlist"),
                            i = a[l].getAttribute("data-amplitude-song-index");
                        null == n && i == t && (a[l].value = e)
                    }
                }
            }

            function n(e, t) {
                e = isNaN(e) ? 0 : e;
                for (var a = "" != u.default.active_playlist && null != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null, l = document.querySelectorAll('.amplitude-song-slider[data-amplitude-playlist="' + t + '"][data-amplitude-song-index="' + a + '"]'), n = 0; n < l.length; n++) l[n].value = e
            }

            function i() {
                for (var e = document.getElementsByClassName("amplitude-song-slider"), t = 0; t < e.length; t++) e[t].value = 0
            }

            return {sync: e, syncMain: t, syncPlaylist: a, syncSong: l, syncSongInPlaylist: n, resetElements: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(53), n = l(u), i = a(50), d = l(i), s = a(51), o = l(s), f = a(52), r = l(f), c = a(54), p = l(c),
            v = a(55), y = l(v), g = a(56), m = l(g), _ = a(57), h = l(_), b = a(58), A = l(b), x = function () {
                function e() {
                    n.default.resetTimes(), d.default.resetTimes(), o.default.resetTimes(), r.default.resetTimes()
                }

                function t(e) {
                    n.default.sync(e), d.default.sync(e.hours), o.default.sync(e.minutes), r.default.sync(e.seconds)
                }

                function a() {
                    p.default.resetTimes(), y.default.resetTimes(), m.default.resetTimes(), h.default.resetTimes(), A.default.resetTimes()
                }

                function l(e, t) {
                    p.default.sync(e, t), A.default.sync(t), y.default.sync(t.hours), m.default.sync(t.minutes), h.default.sync(t.seconds)
                }

                return {resetCurrentTimes: e, syncCurrentTimes: t, resetDurationTimes: a, syncDurationTimes: l}
            }();
        t.default = x, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(4), d = (l(i), function () {
            function e() {
                var e = document.querySelectorAll(".amplitude-visualization");
                if (n.default.web_audio_api_available) {
                    if (Object.keys(n.default.visualizations.available).length > 0 && e.length > 0) for (var i = 0; i < e.length; i++) {
                        var d = e[i].getAttribute("data-amplitude-playlist"),
                            s = e[i].getAttribute("data-amplitude-song-index");
                        null == d && null == s && t(e[i]), null != d && null == s && a(e[i], d), null == d && null != s && l(e[i], s), null != d && null != s && u(e[i], d, s)
                    }
                } else o()
            }

            function t(e) {
                var t = n.default.visualization,
                    a = null != n.default.active_index ? n.default.songs[n.default.active_index].visualization : n.default.playlists[n.default.active_playlist].songs[n.default.playlists[n.default.active_playlist].active_index].visualization;
                if (void 0 != a && void 0 != n.default.visualizations.available[a]) i(a, e); else if (void 0 != t && void 0 != n.default.visualizations.available[t]) i(t, e); else {
                    var l = Object.keys(n.default.visualizations.available).length > 0 ? Object.keys(n.default.visualizations.available)[0] : null;
                    null != l && i(l, e)
                }
            }

            function a(e, t) {
                if (t == n.default.active_playlist) {
                    var a = n.default.playlists[n.default.active_playlist].songs[n.default.playlists[n.default.active_playlist].active_index].visualization,
                        l = n.default.playlists[n.default.active_playlist].visualization, u = n.default.visualization;
                    if (void 0 != a && void 0 != n.default.visualizations.available[a]) i(a, e); else if (void 0 != l && void 0 != n.default.visualizations.available[l]) i(l, e); else if (void 0 != u && void 0 != n.default.visualizations.available[u]) i(u, e); else {
                        var d = Object.keys(n.default.visualizations.available).length > 0 ? Object.keys(n.default.visualizations.available)[0] : null;
                        null != d && i(d, e)
                    }
                }
            }

            function l(e, t) {
                if (t == n.default.active_index) {
                    var a = n.default.songs[n.default.active_index].visualization, l = n.default.visualization;
                    if (void 0 != a && void 0 != n.default.visualizations.available[a]) i(a, e); else if (void 0 != l && void 0 != n.default.visualizations.available[l]) i(l, e); else {
                        var u = Object.keys(n.default.visualizations.available).length > 0 ? Object.keys(n.default.visualizations.available)[0] : null;
                        null != u && i(u, e)
                    }
                }
            }

            function u(e, t, a) {
                if (t == n.default.active_playlist && n.default.playlists[t].active_index == a) {
                    var l = n.default.playlists[n.default.active_playlist].songs[n.default.playlists[n.default.active_playlist].active_index].visualization,
                        u = n.default.playlists[n.default.active_playlist].visualization, d = n.default.visualization;
                    if (void 0 != l && void 0 != n.default.visualizations.available[l]) i(l, e); else if (void 0 != u && void 0 != n.default.visualizations.available[u]) i(u, e); else if (void 0 != d && void 0 != n.default.visualizations.available[d]) i(d, e); else {
                        var s = Object.keys(n.default.visualizations.available).length > 0 ? Object.keys(n.default.visualizations.available)[0] : null;
                        null != s && i(s, e)
                    }
                }
            }

            function i(e, t) {
                var a = new n.default.visualizations.available[e].object;
                a.setPreferences(n.default.visualizations.available[e].preferences), a.startVisualization(t), n.default.visualizations.active.push(a)
            }

            function d() {
                for (var e = 0; e < n.default.visualizations.active.length; e++) n.default.visualizations.active[e].stopVisualization();
                n.default.visualizations.active = []
            }

            function s(e, t) {
                var a = new e;
                n.default.visualizations.available[a.getID()] = new Array, n.default.visualizations.available[a.getID()].object = e, n.default.visualizations.available[a.getID()].preferences = t
            }

            function o() {
                var e = document.querySelectorAll(".amplitude-visualization");
                if (e.length > 0) for (var t = 0; t < e.length; t++) {
                    var a = e[t].getAttribute("data-amplitude-playlist"),
                        l = e[t].getAttribute("data-amplitude-song-index");
                    null == a && null == l && f(e[t]), null != a && null == l && r(e[t], a), null == a && null != l && c(e[t], l), null != a && null != l && p(e[t], a, l)
                }
            }

            function f(e) {
                e.style.backgroundImage = "url(" + n.default.active_metadata.cover_art_url + ")"
            }

            function r(e, t) {
                n.default.active_playlist == t && (e.style.backgroundImage = "url(" + n.default.active_metadata.cover_art_url + ")")
            }

            function c(e, t) {
                n.default.active_index == t && (e.style.backgroundImage = "url(" + n.default.active_metadata.cover_art_url + ")")
            }

            function p(e, t, a) {
                n.default.active_playlist == t && n.default.playlists[active_playlist].active_index == a && (e.style.backgroundImage = "url(" + n.default.active_metadata.cover_art_url + ")")
            }

            return {run: e, stop: d, register: s}
        }());
        t.default = d, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(21), d = l(i), s = function () {
            function e(e) {
                s = e;
                var a = document.getElementsByTagName("head")[0], l = document.createElement("script");
                l.type = "text/javascript", l.src = "https://connect.soundcloud.com/sdk.js", l.onreadystatechange = t, l.onload = t, a.appendChild(l)
            }

            function t() {
                SC.initialize({client_id: n.default.soundcloud_client}), a()
            }

            function a() {
                for (var e = /^https?:\/\/(soundcloud.com|snd.sc)\/(.*)$/, t = 0; t < n.default.songs.length; t++) n.default.songs[t].url.match(e) && (n.default.soundcloud_song_count++, u(n.default.songs[t].url, t))
            }

            function l(e, t, a) {
                var l = arguments.length > 3 && void 0 !== arguments[3] && arguments[3];
                SC.get("/resolve/?url=" + e, function (e) {
                    e.streamable ? null != t ? (n.default.playlists[t].songs[a].url = e.stream_url + "?client_id=" + n.default.soundcloud_client, l && (n.default.playlists[t].shuffle_list[a].url = e.stream_url + "?client_id=" + n.default.soundcloud_client), n.default.soundcloud_use_art && (n.default.playlists[t].songs[a].cover_art_url = e.artwork_url, l && (n.default.playlists[t].shuffle_list[a].cover_art_url = e.artwork_url)), n.default.playlists[t].songs[a].soundcloud_data = e, l && (n.default.playlists[t].shuffle_list[a].soundcloud_data = e)) : (n.default.songs[a].url = e.stream_url + "?client_id=" + n.default.soundcloud_client, l && (n.default.shuffle_list[a].stream_url, n.default.soundcloud_client), n.default.soundcloud_use_art && (n.default.songs[a].cover_art_url = e.artwork_url, l && (n.default.shuffle_list[a].cover_art_url = e.artwork_url)), n.default.songs[a].soundcloud_data = e, l && (n.default.shuffle_list[a].soundcloud_data = e)) : null != t ? AmplitudeHelpers.writeDebugMessage(n.default.playlists[t].songs[a].name + " by " + n.default.playlists[t].songs[a].artist + " is not streamable by the Soundcloud API") : AmplitudeHelpers.writeDebugMessage(n.default.songs[a].name + " by " + n.default.songs[a].artist + " is not streamable by the Soundcloud API")
                })
            }

            function u(e, t) {
                SC.get("/resolve/?url=" + e, function (e) {
                    e.streamable ? (n.default.songs[t].url = e.stream_url + "?client_id=" + n.default.soundcloud_client, n.default.soundcloud_use_art && (n.default.songs[t].cover_art_url = e.artwork_url), n.default.songs[t].soundcloud_data = e) : AmplitudeHelpers.writeDebugMessage(n.default.songs[t].name + " by " + n.default.songs[t].artist + " is not streamable by the Soundcloud API"), ++n.default.soundcloud_songs_ready == n.default.soundcloud_song_count && d.default.setConfig(s)
                })
            }

            function i(e) {
                var t = /^https?:\/\/(soundcloud.com|snd.sc)\/(.*)$/;
                return e.match(t)
            }

            var s = {};
            return {loadSoundCloud: e, resolveIndividualStreamableURL: l, isSoundCloudURL: i}
        }();
        t.default = s, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e() {
                for (var e = document.getElementsByClassName("amplitude-playback-speed"), t = 0; t < e.length; t++) switch (e[t].classList.remove("amplitude-playback-speed-10"), e[t].classList.remove("amplitude-playback-speed-15"), e[t].classList.remove("amplitude-playback-speed-20"), u.default.playback_speed) {
                    case 1:
                        e[t].classList.add("amplitude-playback-speed-10");
                        break;
                    case 1.5:
                        e[t].classList.add("amplitude-playback-speed-15");
                        break;
                    case 2:
                        e[t].classList.add("amplitude-playback-speed-20")
                }
            }

            return {sync: e}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e() {
                for (var e = document.getElementsByClassName("amplitude-shuffle"), t = 0; t < e.length; t++) null == e[t].getAttribute("data-amplitude-playlist") && (u.default.shuffle_on ? (e[t].classList.add("amplitude-shuffle-on"), e[t].classList.remove("amplitude-shuffle-off")) : (e[t].classList.add("amplitude-shuffle-off"), e[t].classList.remove("amplitude-shuffle-on")))
            }

            function t(e) {
                for (var t = document.querySelectorAll('.amplitude-shuffle[data-amplitude-playlist="' + e + '"]'), a = 0; a < t.length; a++) u.default.playlists[e].shuffle ? (t[a].classList.add("amplitude-shuffle-on"), t[a].classList.remove("amplitude-shuffle-off")) : (t[a].classList.add("amplitude-shuffle-off"), t[a].classList.remove("amplitude-shuffle-on"))
            }

            return {syncMain: e, syncPlaylist: t}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                t(e), a(e), l(e), n(e)
            }

            function t(e) {
                if (!isNaN(e)) for (var t = document.querySelectorAll(".amplitude-song-played-progress"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist"),
                        u = t[a].getAttribute("data-amplitude-song-index");
                    if (null == l && null == u) {
                        var n = t[a].max;
                        t[a].value = e / 100 * n
                    }
                }
            }

            function a(e) {
                if (!isNaN(e)) for (var t = document.querySelectorAll('.amplitude-song-played-progress[data-amplitude-playlist="' + u.default.active_playlist + '"]'), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-song-index");
                    if (null == l) {
                        var n = t[a].max;
                        t[a].value = e / 100 * n
                    }
                }
            }

            function l(e) {
                if (null == u.default.active_playlist && !isNaN(e)) for (var t = document.querySelectorAll('.amplitude-song-played-progress[data-amplitude-song-index="' + u.default.active_index + '"]'), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist");
                    if (null == l) {
                        var n = t[a].max;
                        t[a].value = e / 100 * n
                    }
                }
            }

            function n(e) {
                if (!isNaN(e)) for (var t = "" != u.default.active_playlist && null != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null, a = document.querySelectorAll('.amplitude-song-played-progress[data-amplitude-playlist="' + u.default.active_playlist + '"][data-amplitude-song-index="' + t + '"]'), l = 0; l < a.length; l++) {
                    var n = a[l].getAttribute("data-amplitude-playlist"),
                        i = a[l].getAttribute("data-amplitude-song-index");
                    if (null != n && null != i) {
                        var d = a[l].max;
                        a[l].value = e / 100 * d
                    }
                }
            }

            function i() {
                for (var e = document.getElementsByClassName("amplitude-song-played-progress"), t = 0; t < e.length; t++) e[t].value = 0
            }

            return {sync: e, resetElements: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
                return typeof e
            } : function (e) {
                return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
            }, n = a(0), i = l(n), d = a(1), s = l(d), o = a(17), f = l(o), r = a(6), c = l(r), p = a(4), v = l(p),
            y = a(5), g = l(y), m = a(13), _ = l(m), h = a(26), b = l(h), A = a(46), x = l(A), M = a(16), P = l(M),
            S = a(22), L = l(S), w = a(3), E = l(w), k = a(9), T = l(k), O = a(48), C = l(O), N = a(19), j = l(N),
            I = a(10), q = l(I), z = a(11), H = l(z), B = a(15), D = l(B), R = a(2), V = l(R), U = a(7), F = l(U),
            W = a(18), G = l(W), Y = a(8), X = l(Y), J = function () {
                function e(e) {
                    var t = !1;
                    if (c.default.resetConfig(), b.default.initialize(), T.default.initialize(), i.default.debug = void 0 != e.debug && e.debug, l(e), e.songs ? 0 != e.songs.length ? (i.default.songs = e.songs, t = !0) : v.default.writeMessage("Please add some songs, to your songs object!") : v.default.writeMessage("Please provide a songs object for AmplitudeJS to run!"), x.default.webAudioAPIAvailable()) {
                        if (x.default.determineUsingAnyFX() && (x.default.configureWebAudioAPI(), document.documentElement.addEventListener("mousedown", function () {
                            "running" !== i.default.context.state && i.default.context.resume()
                        }), document.documentElement.addEventListener("keydown", function () {
                            "running" !== i.default.context.state && i.default.context.resume()
                        }), document.documentElement.addEventListener("keyup", function () {
                            "running" !== i.default.context.state && i.default.context.resume()
                        }), void 0 != e.waveforms && void 0 != e.waveforms.sample_rate && (i.default.waveforms.sample_rate = e.waveforms.sample_rate), L.default.init(), void 0 != e.visualizations && e.visualizations.length > 0)) for (var u = 0; u < e.visualizations.length; u++) P.default.register(e.visualizations[u].object, e.visualizations[u].params)
                    } else v.default.writeMessage("The Web Audio API is not available on this platform. We are using your defined backups!");
                    if (o(), r(), t) {
                        i.default.soundcloud_client = void 0 != e.soundcloud_client ? e.soundcloud_client : "", i.default.soundcloud_use_art = void 0 != e.soundcloud_use_art ? e.soundcloud_use_art : "";
                        var n = {};
                        "" != i.default.soundcloud_client ? (n = e, f.default.loadSoundCloud(n)) : a(e)
                    }
                    v.default.writeMessage("Initialized With: "), v.default.writeMessage(i.default)
                }

                function t() {
                    b.default.initialize(), F.default.displayMetaData()
                }

                function a(e) {
                    e.playlists && d(e.playlists) > 0 && C.default.initialize(e.playlists), void 0 == e.start_song || e.starting_playlist ? E.default.changeSong(i.default.songs[0], 0) : g.default.isInt(e.start_song) ? E.default.changeSong(i.default.songs[e.start_song], e.start_song) : v.default.writeMessage("You must enter an integer index for the start song."), void 0 != e.shuffle_on && e.shuffle_on && (i.default.shuffle_on = !0, _.default.shuffleSongs(), E.default.changeSong(i.default.shuffle_list[0], 0)), i.default.continue_next = void 0 == e.continue_next || e.continue_next, i.default.playback_speed = void 0 != e.playback_speed ? e.playback_speed : 1, s.default.setPlaybackSpeed(i.default.playback_speed), i.default.audio.preload = void 0 != e.preload ? e.preload : "auto", i.default.callbacks = void 0 != e.callbacks ? e.callbacks : {}, i.default.bindings = void 0 != e.bindings ? e.bindings : {}, i.default.volume = void 0 != e.volume ? e.volume : 50, i.default.delay = void 0 != e.delay ? e.delay : 0, i.default.volume_increment = void 0 != e.volume_increment ? e.volume_increment : 5, i.default.volume_decrement = void 0 != e.volume_decrement ? e.volume_decrement : 5, s.default.setVolume(i.default.volume), l(e), n(), void 0 != e.starting_playlist && "" != e.starting_playlist && (i.default.active_playlist = e.starting_playlist, void 0 != e.starting_playlist_song && "" != e.starting_playlist_song ? void 0 != u(e.playlists[e.starting_playlist].songs[parseInt(e.starting_playlist_song)]) ? E.default.changeSongPlaylist(i.default.active_playlist, e.playlists[e.starting_playlist].songs[parseInt(e.starting_playlist_song)], parseInt(e.starting_playlist_song)) : (E.default.changeSongPlaylist(i.default.active_playlist, e.playlists[e.starting_playlist].songs[0], 0), v.default.writeMessage("The index of " + e.starting_playlist_song + " does not exist in the playlist " + e.starting_playlist)) : E.default.changeSong(i.default.active_playlist, e.playlists[e.starting_playlist].songs[0], 0), V.default.sync()), T.default.run("initialized")
                }

                function l(e) {
                    void 0 != e.default_album_art ? i.default.default_album_art = e.default_album_art : i.default.default_album_art = "", void 0 != e.default_playlist_art ? i.default.default_playlist_art = e.default_playlist_art : i.default.default_playlist_art = ""
                }

                function n() {
                    j.default.syncMain(), q.default.setMuted(0 == i.default.volume), H.default.sync(), G.default.sync(), D.default.resetCurrentTimes(), V.default.syncToPause(), F.default.syncMetaData(), X.default.syncRepeatSong()
                }

                function d(e) {
                    var t = 0, a = void 0;
                    for (a in e) e.hasOwnProperty(a) && t++;
                    return v.default.writeMessage("You have " + t + " playlist(s) in your config"), t
                }

                function o() {
                    for (var e = 0; e < i.default.songs.length; e++) void 0 == i.default.songs[e].live && (i.default.songs[e].live = !1)
                }

                function r() {
                    for (var e = 0; e < i.default.songs.length; e++) i.default.songs[e].index = e
                }

                return {initialize: e, setConfig: a, rebindDisplay: t}
            }();
        t.default = J, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e() {
                c = u.default.waveforms.sample_rate;
                var e = document.querySelectorAll(".amplitude-wave-form");
                if (e.length > 0) for (var t = 0; t < e.length; t++) {
                    e[t].innerHTML = "";
                    var a = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    a.setAttribute("viewBox", "0 -1 " + c + " 2"), a.setAttribute("preserveAspectRatio", "none");
                    var l = document.createElementNS("http://www.w3.org/2000/svg", "g");
                    a.appendChild(l);
                    var n = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    n.setAttribute("d", ""), n.setAttribute("id", "waveform"), l.appendChild(n), e[t].appendChild(a)
                }
            }

            function t() {
                if (u.default.web_audio_api_available) if (void 0 == u.default.waveforms.built[Math.abs(u.default.audio.src.split("").reduce(function (e, t) {
                    return (e = (e << 5) - e + t.charCodeAt(0)) & e
                }, 0))]) {
                    var e = new XMLHttpRequest;
                    e.open("GET", u.default.audio.src, !0), e.responseType = "arraybuffer", e.onreadystatechange = function (t) {
                        4 == e.readyState && 200 == e.status && u.default.context.decodeAudioData(e.response, function (e) {
                            r = e, p = l(c, r), a(c, r, p)
                        })
                    }, e.send()
                } else n(u.default.waveforms.built[Math.abs(u.default.audio.src.split("").reduce(function (e, t) {
                    return (e = (e << 5) - e + t.charCodeAt(0)) & e
                }, 0))])
            }

            function a(e, t, a) {
                if (t) {
                    for (var l = a.length, i = "", d = 0; d < l; d++) i += d % 2 == 0 ? " M" + ~~(d / 2) + ", " + a.shift() : " L" + ~~(d / 2) + ", " + a.shift();
                    u.default.waveforms.built[Math.abs(u.default.audio.src.split("").reduce(function (e, t) {
                        return (e = (e << 5) - e + t.charCodeAt(0)) & e
                    }, 0))] = i, n(u.default.waveforms.built[Math.abs(u.default.audio.src.split("").reduce(function (e, t) {
                        return (e = (e << 5) - e + t.charCodeAt(0)) & e
                    }, 0))])
                }
            }

            function l(e, t) {
                for (var a = t.length / e, l = ~~(a / 10) || 1, u = t.numberOfChannels, n = [], i = 0; i < u; i++) for (var d = [], s = t.getChannelData(i), o = 0; o < e; o++) {
                    for (var f = ~~(o * a), r = ~~(f + a), c = s[0], p = s[0], v = f; v < r; v += l) {
                        var y = s[v];
                        y > p && (p = y), y < c && (c = y)
                    }
                    d[2 * o] = p, d[2 * o + 1] = c, (0 === i || p > n[2 * o]) && (n[2 * o] = p), (0 === i || c < n[2 * o + 1]) && (n[2 * o + 1] = c)
                }
                return n
            }

            function n(e) {
                for (var t = document.querySelectorAll(".amplitude-wave-form"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist"),
                        u = t[a].getAttribute("data-amplitude-song-index");
                    null == l && null == u && i(t[a], e), null != l && null == u && d(t[a], e, l), null == l && null != u && s(t[a], e, u), null != l && null != u && o(t[a], e, l, u)
                }
            }

            function i(e, t) {
                e.querySelector("svg g path").setAttribute("d", t)
            }

            function d(e, t, a) {
                if (u.default.active_playlist == a) {
                    e.querySelector("svg g path").setAttribute("d", t)
                }
            }

            function s(e, t, a) {
                if (u.default.active_index == a) {
                    e.querySelector("svg g path").setAttribute("d", t)
                }
            }

            function o(e, t, a, l) {
                if (u.default.active_playlist == a && u.default.playlists[u.default.active_playlist].active_index == l) {
                    e.querySelector("svg g path").setAttribute("d", t)
                }
            }

            function f() {
                return document.querySelectorAll(".amplitude-wave-form").length > 0
            }

            var r = "", c = "", p = "";
            return {init: e, build: t, determineIfUsingWaveforms: f}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e() {
                var e = {},
                    t = (Math.floor(u.default.audio.currentTime % 60) < 10 ? "0" : "") + Math.floor(u.default.audio.currentTime % 60),
                    a = Math.floor(u.default.audio.currentTime / 60), l = "00";
                return a < 10 && (a = "0" + a), a >= 60 && (l = Math.floor(a / 60), (a %= 60) < 10 && (a = "0" + a)), e.seconds = t, e.minutes = a, e.hours = l, e
            }

            function t() {
                var e = {},
                    t = (Math.floor(u.default.audio.duration % 60) < 10 ? "0" : "") + Math.floor(u.default.audio.duration % 60),
                    a = Math.floor(u.default.audio.duration / 60), l = "00";
                return a < 10 && (a = "0" + a), a >= 60 && (l = Math.floor(a / 60), (a %= 60) < 10 && (a = "0" + a)), e.seconds = isNaN(t) ? "00" : t, e.minutes = isNaN(a) ? "00" : a, e.hours = isNaN(l) ? "00" : l.toString(), e
            }

            function a() {
                return u.default.audio.currentTime / u.default.audio.duration * 100
            }

            function l(e) {
                u.default.active_metadata.live || isFinite(e) && (u.default.audio.currentTime = e)
            }

            return {
                computeCurrentTimes: e,
                computeSongDuration: t,
                computeSongCompletionPercentage: a,
                setCurrentTime: l
            }
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e() {
                t(), a(), l(), n()
            }

            function t() {
                for (var e = document.getElementsByClassName("amplitude-buffered-progress"), t = 0; t < e.length; t++) {
                    var a = e[t].getAttribute("data-amplitude-playlist"),
                        l = e[t].getAttribute("data-amplitude-song-index");
                    null != a || null != l || isNaN(u.default.buffered) || (e[t].value = parseFloat(parseFloat(u.default.buffered) / 100))
                }
            }

            function a() {
                for (var e = document.querySelectorAll('.amplitude-buffered-progress[data-amplitude-playlist="' + u.default.active_playlist + '"]'), t = 0; t < e.length; t++) {
                    null != e[t].getAttribute("data-amplitude-song-index") || isNaN(u.default.buffered) || (e[t].value = parseFloat(parseFloat(u.default.buffered) / 100))
                }
            }

            function l() {
                for (var e = document.querySelectorAll('.amplitude-buffered-progress[data-amplitude-song-index="' + u.default.active_index + '"]'), t = 0; t < e.length; t++) {
                    null != e[t].getAttribute("data-amplitude-playlist") || isNaN(u.default.buffered) || (e[t].value = parseFloat(parseFloat(u.default.buffered) / 100))
                }
            }

            function n() {
                for (var e = null != u.default.active_playlist && "" != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null, t = document.querySelectorAll('.amplitude-buffered-progress[data-amplitude-song-index="' + e + '"][data-amplitude-playlist="' + u.default.active_playlist + '"]'), a = 0; a < t.length; a++) isNaN(u.default.buffered) || (t[a].value = parseFloat(parseFloat(u.default.buffered) / 100))
            }

            function i() {
                for (var e = document.getElementsByClassName("amplitude-buffered-progress"), t = 0; t < e.length; t++) e[t].value = 0
            }

            return {sync: e, reset: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(3), d = l(i), s = a(1), o = l(s), f = a(2), r = l(f), c = function () {
            function e() {
                setTimeout(function () {
                    n.default.continue_next ? "" == n.default.active_playlist || null == n.default.active_playlist ? d.default.setNext(!0) : d.default.setNextPlaylist(n.default.active_playlist, !0) : n.default.is_touch_moving || (o.default.stop(), r.default.sync())
                }, n.default.delay)
            }

            return {handle: e}
        }();
        t.default = c, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(27), d = l(i), s = a(42), o = l(s), f = a(25), r = l(f), c = a(35), p = l(c),
            v = a(31), y = l(v), g = a(30), m = l(g), _ = a(32), h = l(_), b = a(41), A = l(b), x = a(28), M = l(x),
            P = a(45), S = l(P), L = a(43), w = l(L), E = a(40), k = l(E), T = a(44), O = l(T), C = a(29), N = l(C),
            j = a(34), I = l(j), q = a(36), z = l(q), H = a(37), B = l(H), D = a(33), R = l(D), V = a(38), U = l(V),
            F = a(39), W = l(F), G = a(22), Y = l(G), X = a(4), J = l(X), $ = function () {
                function e() {
                    J.default.writeMessage("Beginning initialization of event handlers.."), document.addEventListener("touchmove", function () {
                        n.default.is_touch_moving = !0
                    }), document.addEventListener("touchend", function () {
                        n.default.is_touch_moving && (n.default.is_touch_moving = !1)
                    }), t(), a(), l(), u(), i(), s(), f(), c(), v(), g(), _(), b(), x(), P(), L(), E(), T(), C(), j(), q(), H()
                }

                function t() {
                    n.default.audio.removeEventListener("timeupdate", o.default.handle), n.default.audio.addEventListener("timeupdate", o.default.handle), n.default.audio.removeEventListener("durationchange", o.default.handle), n.default.audio.addEventListener("durationchange", o.default.handle)
                }

                function a() {
                    document.removeEventListener("keydown", d.default.handle), document.addEventListener("keydown", d.default.handle)
                }

                function l() {
                    n.default.audio.removeEventListener("ended", r.default.handle), n.default.audio.addEventListener("ended", r.default.handle)
                }

                function u() {
                    n.default.audio.removeEventListener("progress", p.default.handle), n.default.audio.addEventListener("progress", p.default.handle)
                }

                function i() {
                    for (var e = document.getElementsByClassName("amplitude-play"), t = 0; t < e.length; t++) /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (e[t].removeEventListener("touchend", y.default.handle), e[t].addEventListener("touchend", y.default.handle)) : (e[t].removeEventListener("click", y.default.handle), e[t].addEventListener("click", y.default.handle))
                }

                function s() {
                    for (var e = document.getElementsByClassName("amplitude-pause"), t = 0; t < e.length; t++) /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (e[t].removeEventListener("touchend", m.default.handle), e[t].addEventListener("touchend", m.default.handle)) : (e[t].removeEventListener("click", m.default.handle), e[t].addEventListener("click", m.default.handle))
                }

                function f() {
                    for (var e = document.getElementsByClassName("amplitude-play-pause"), t = 0; t < e.length; t++) /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (e[t].removeEventListener("touchend", h.default.handle), e[t].addEventListener("touchend", h.default.handle)) : (e[t].removeEventListener("click", h.default.handle), e[t].addEventListener("click", h.default.handle))
                }

                function c() {
                    for (var e = document.getElementsByClassName("amplitude-stop"), t = 0; t < e.length; t++) /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (e[t].removeEventListener("touchend", A.default.handle), e[t].addEventListener("touchend", A.default.handle)) : (e[t].removeEventListener("click", A.default.handle), e[t].addEventListener("click", A.default.handle))
                }

                function v() {
                    for (var e = document.getElementsByClassName("amplitude-mute"), t = 0; t < e.length; t++) /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? /iPhone|iPad|iPod/i.test(navigator.userAgent) ? J.default.writeMessage("iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4") : (e[t].removeEventListener("touchend", M.default.handle), e[t].addEventListener("touchend", M.default.handle)) : (e[t].removeEventListener("click", M.default.handle), e[t].addEventListener("click", M.default.handle))
                }

                function g() {
                    for (var e = document.getElementsByClassName("amplitude-volume-up"), t = 0; t < e.length; t++) /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? /iPhone|iPad|iPod/i.test(navigator.userAgent) ? J.default.writeMessage("iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4") : (e[t].removeEventListener("touchend", S.default.handle), e[t].addEventListener("touchend", S.default.handle)) : (e[t].removeEventListener("click", S.default.handle), e[t].addEventListener("click", S.default.handle))
                }

                function _() {
                    for (var e = document.getElementsByClassName("amplitude-volume-down"), t = 0; t < e.length; t++) /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? /iPhone|iPad|iPod/i.test(navigator.userAgent) ? J.default.writeMessage("iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4") : (e[t].removeEventListener("touchend", w.default.handle), e[t].addEventListener("touchend", w.default.handle)) : (e[t].removeEventListener("click", w.default.handle), e[t].addEventListener("click", w.default.handle))
                }

                function b() {
                    for (var e = window.navigator.userAgent, t = e.indexOf("MSIE "), a = document.getElementsByClassName("amplitude-song-slider"), l = 0; l < a.length; l++) t > 0 || navigator.userAgent.match(/Trident.*rv\:11\./) ? (a[l].removeEventListener("change", k.default.handle), a[l].addEventListener("change", k.default.handle)) : (a[l].removeEventListener("input", k.default.handle), a[l].addEventListener("input", k.default.handle))
                }

                function x() {
                    for (var e = window.navigator.userAgent, t = e.indexOf("MSIE "), a = document.getElementsByClassName("amplitude-volume-slider"), l = 0; l < a.length; l++) /iPhone|iPad|iPod/i.test(navigator.userAgent) ? J.default.writeMessage("iOS does NOT allow volume to be set through javascript: https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW4") : t > 0 || navigator.userAgent.match(/Trident.*rv\:11\./) ? (a[l].removeEventListener("change", O.default.handle), a[l].addEventListener("change", O.default.handle)) : (a[l].removeEventListener("input", O.default.handle), a[l].addEventListener("input", O.default.handle))
                }

                function P() {
                    for (var e = document.getElementsByClassName("amplitude-next"), t = 0; t < e.length; t++) /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (e[t].removeEventListener("touchend", N.default.handle), e[t].addEventListener("touchend", N.default.handle)) : (e[t].removeEventListener("click", N.default.handle), e[t].addEventListener("click", N.default.handle))
                }

                function L() {
                    for (var e = document.getElementsByClassName("amplitude-prev"), t = 0; t < e.length; t++) /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (e[t].removeEventListener("touchend", I.default.handle), e[t].addEventListener("touchend", I.default.handle)) : (e[t].removeEventListener("click", I.default.handle), e[t].addEventListener("click", I.default.handle))
                }

                function E() {
                    for (var e = document.getElementsByClassName("amplitude-shuffle"), t = 0; t < e.length; t++) e[t].classList.remove("amplitude-shuffle-on"), e[t].classList.add("amplitude-shuffle-off"), /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (e[t].removeEventListener("touchend", U.default.handle), e[t].addEventListener("touchend", U.default.handle)) : (e[t].removeEventListener("click", U.default.handle), e[t].addEventListener("click", U.default.handle))
                }

                function T() {
                    for (var e = document.getElementsByClassName("amplitude-repeat"), t = 0; t < e.length; t++) e[t].classList.remove("amplitude-repeat-on"), e[t].classList.add("amplitude-repeat-off"), /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (e[t].removeEventListener("touchend", z.default.handle), e[t].addEventListener("touchend", z.default.handle)) : (e[t].removeEventListener("click", z.default.handle), e[t].addEventListener("click", z.default.handle))
                }

                function C() {
                    for (var e = document.getElementsByClassName("amplitude-repeat-song"), t = 0; t < e.length; t++) e[t].classList.remove("amplitude-repeat-on"), e[t].classList.add("amplitude-repeat-off"), /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (e[t].removeEventListener("touchend", B.default.handle), e[t].addEventListener("touchend", B.default.handle)) : (e[t].removeEventListener("click", B.default.handle), e[t].addEventListener("click", B.default.handle))
                }

                function j() {
                    for (var e = document.getElementsByClassName("amplitude-playback-speed"), t = 0; t < e.length; t++) /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (e[t].removeEventListener("touchend", R.default.handle), e[t].addEventListener("touchend", R.default.handle)) : (e[t].removeEventListener("click", R.default.handle), e[t].addEventListener("click", R.default.handle))
                }

                function q() {
                    for (var e = document.getElementsByClassName("amplitude-skip-to"), t = 0; t < e.length; t++) /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (e[t].removeEventListener("touchend", W.default.handle), e[t].addEventListener("touchend", W.default.handle)) : (e[t].removeEventListener("click", W.default.handle), e[t].addEventListener("click", W.default.handle))
                }

                function H() {
                    Y.default.determineIfUsingWaveforms() && (n.default.audio.removeEventListener("canplaythrough", Y.default.build), n.default.audio.addEventListener("canplaythrough", Y.default.build))
                }

                return {initialize: e}
            }();
        t.default = $, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(1), d = l(i), s = a(13), o = l(s), f = a(12), r = l(f), c = a(3), p = l(c),
            v = a(8), y = l(v), g = a(2), m = l(g), _ = function () {
                function e(e) {
                    t(e.which)
                }

                function t(e) {
                    if (void 0 != n.default.bindings[e]) switch (n.default.bindings[e]) {
                        case"play_pause":
                            a();
                            break;
                        case"next":
                            l();
                            break;
                        case"prev":
                            u();
                            break;
                        case"stop":
                            i();
                            break;
                        case"shuffle":
                            s();
                            break;
                        case"repeat":
                            f()
                    }
                }

                function a() {
                    n.default.audio.paused ? d.default.play() : d.default.pause(), m.default.sync()
                }

                function l() {
                    "" == n.default.active_playlist || null == n.default.active_playlist ? p.default.setNext() : p.default.setNextPlaylist(n.default.active_playlist)
                }

                function u() {
                    "" == n.default.active_playlist || null == n.default.active_playlist ? p.default.setPrevious() : p.default.setPreviousPlaylist(n.default.active_playlist)
                }

                function i() {
                    m.default.syncToPause(), d.default.stop()
                }

                function s() {
                    "" == n.default.active_playlist || null == n.default.active_playlist ? o.default.toggleShuffle() : o.default.toggleShufflePlaylist(n.default.active_playlist)
                }

                function f() {
                    r.default.setRepeat(!n.default.repeat), y.default.syncRepeat()
                }

                return {handle: e}
            }();
        t.default = _, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(1), d = l(i), s = a(10), o = l(s), f = a(11), r = l(f), c = function () {
            function e() {
                n.default.is_touch_moving || (0 == n.default.volume ? d.default.setVolume(n.default.pre_mute_volume) : (n.default.pre_mute_volume = n.default.volume, d.default.setVolume(0)), o.default.setMuted(0 == n.default.volume), r.default.sync())
            }

            return {handle: e}
        }();
        t.default = c, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(1), d = (l(i), a(2)), s = (l(d), a(9)), o = (l(s), a(3)), f = l(o), r = a(4),
            c = l(r), p = function () {
                function e() {
                    if (!n.default.is_touch_moving) {
                        var e = this.getAttribute("data-amplitude-playlist");
                        null == e && t(), null != e && a(e)
                    }
                }

                function t() {
                    "" == n.default.active_playlist || null == n.default.active_playlist ? f.default.setNext() : f.default.setNextPlaylist(n.default.active_playlist)
                }

                function a(e) {
                    e == n.default.active_playlist ? f.default.setNextPlaylist(e) : c.default.writeMessage("You can not go to the next song on a playlist that is not being played!")
                }

                return {handle: e}
            }();
        t.default = p, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(6), d = (l(i), a(1)), s = l(d), o = a(2), f = l(o), r = function () {
            function e() {
                if (!n.default.is_touch_moving) {
                    var e = this.getAttribute("data-amplitude-song-index"),
                        i = this.getAttribute("data-amplitude-playlist");
                    null == i && null == e && t(), null != i && null == e && a(i), null == i && null != e && l(e), null != i && null != e && u(i, e)
                }
            }

            function t() {
                s.default.pause(), f.default.sync()
            }

            function a(e) {
                n.default.active_playlist == e && (s.default.pause(), f.default.sync())
            }

            function l(e) {
                "" != n.default.active_playlist && null != n.default.active_playlist || n.default.active_index != e || (s.default.pause(), f.default.sync())
            }

            function u(e, t) {
                n.default.active_playlist == e && n.default.playlists[e].active_index == t && (s.default.pause(), f.default.sync())
            }

            return {handle: e}
        }();
        t.default = r, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(6), d = (l(i), a(1)), s = l(d), o = a(5), f = l(o), r = a(3), c = l(r), p = a(2),
            v = l(p), y = function () {
                function e() {
                    if (!n.default.is_touch_moving) {
                        var e = this.getAttribute("data-amplitude-song-index"),
                            i = this.getAttribute("data-amplitude-playlist");
                        null == i && null == e && t(), null != i && null == e && a(i), null == i && null != e && l(e), null != i && null != e && u(i, e)
                    }
                }

                function t() {
                    s.default.play(), v.default.sync()
                }

                function a(e) {
                    f.default.newPlaylist(e) && (c.default.setActivePlaylist(e), n.default.playlists[e].shuffle ? c.default.changeSongPlaylist(e, n.default.playlists[e].shuffle_list[0], 0) : c.default.changeSongPlaylist(e, n.default.playlists[e].songs[0], 0)), s.default.play(), v.default.sync()
                }

                function l(e) {
                    f.default.newPlaylist(null) && (c.default.setActivePlaylist(null), c.default.changeSong(n.default.songs[e], e)), f.default.newSong(null, e) && c.default.changeSong(n.default.songs[e], e), s.default.play(), v.default.sync()
                }

                function u(e, t) {
                    f.default.newPlaylist(e) && (c.default.setActivePlaylist(e), c.default.changeSongPlaylist(e, n.default.playlists[e].songs[t], t)), f.default.newSong(e, t) && c.default.changeSongPlaylist(e, n.default.playlists[e].songs[t], t), s.default.play(), v.default.sync()
                }

                return {handle: e}
            }();
        t.default = y, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(6), d = (l(i), a(1)), s = l(d), o = a(5), f = l(o), r = a(3), c = l(r), p = a(2),
            v = l(p), y = function () {
                function e() {
                    if (!n.default.is_touch_moving) {
                        var e = this.getAttribute("data-amplitude-playlist"),
                            i = this.getAttribute("data-amplitude-song-index");
                        null == e && null == i && t(), null != e && null == i && a(e), null == e && null != i && l(i), null != e && null != i && u(e, i)
                    }
                }

                function t() {
                    n.default.audio.paused ? s.default.play() : s.default.pause(), v.default.sync()
                }

                function a(e) {
                    f.default.newPlaylist(e) && (c.default.setActivePlaylist(e), n.default.playlists[e].shuffle ? c.default.changeSongPlaylist(e, n.default.playlists[e].shuffle_list[0], 0, !0) : c.default.changeSongPlaylist(e, n.default.playlists[e].songs[0], 0)), n.default.audio.paused ? s.default.play() : s.default.pause(), v.default.sync()
                }

                function l(e) {
                    f.default.newPlaylist(null) && (c.default.setActivePlaylist(null), c.default.changeSong(n.default.songs[e], e, !0)), f.default.newSong(null, e) && c.default.changeSong(n.default.songs[e], e, !0), n.default.audio.paused ? s.default.play() : s.default.pause(), v.default.sync()
                }

                function u(e, t) {
                    f.default.newPlaylist(e) && (c.default.setActivePlaylist(e), c.default.changeSongPlaylist(e, n.default.playlists[e].songs[t], t, !0)), f.default.newSong(e, t) && c.default.changeSongPlaylist(e, n.default.playlists[e].songs[t], t, !0), n.default.audio.paused ? s.default.play() : s.default.pause(), v.default.sync()
                }

                return {handle: e}
            }();
        t.default = y, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(1), d = l(i), s = a(18), o = l(s), f = function () {
            function e() {
                if (!n.default.is_touch_moving) {
                    switch (n.default.playback_speed) {
                        case 1:
                            d.default.setPlaybackSpeed(1.5);
                            break;
                        case 1.5:
                            d.default.setPlaybackSpeed(2);
                            break;
                        case 2:
                            d.default.setPlaybackSpeed(1)
                    }
                    o.default.sync()
                }
            }

            return {handle: e}
        }();
        t.default = f, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(3), d = l(i), s = a(4), o = l(s), f = function () {
            function e() {
                if (!n.default.is_touch_moving) {
                    var e = this.getAttribute("data-amplitude-playlist");
                    null == e && t(), null != e && a(e)
                }
            }

            function t() {
                "" == n.default.active_playlist || null == n.default.active_playlist ? d.default.setPrevious() : d.default.setPreviousPlaylist(n.default.active_playlist)
            }

            function a(e) {
                e == n.default.active_playlist ? d.default.setPreviousPlaylist(n.default.active_playlist) : o.default.writeMessage("You can not go to the previous song on a playlist that is not being played!")
            }

            return {handle: e}
        }();
        t.default = f, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(24), d = l(i), s = function () {
            function e() {
                if (n.default.audio.buffered.length - 1 >= 0) {
                    var e = n.default.audio.buffered.end(n.default.audio.buffered.length - 1),
                        t = n.default.audio.duration;
                    n.default.buffered = e / t * 100
                }
                d.default.sync()
            }

            return {handle: e}
        }();
        t.default = s, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(12), d = l(i), s = a(8), o = l(s), f = function () {
            function e() {
                if (!n.default.is_touch_moving) {
                    var e = this.getAttribute("data-amplitude-playlist");
                    null == e && t(), null != e && a(e)
                }
            }

            function t() {
                d.default.setRepeat(!n.default.repeat), o.default.syncRepeat()
            }

            function a(e) {
                d.default.setRepeatPlaylist(!n.default.playlists[e].repeat, e), o.default.syncRepeatPlaylist(e)
            }

            return {handle: e}
        }();
        t.default = f, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(12), d = l(i), s = a(8), o = l(s), f = function () {
            function e() {
                n.default.is_touch_moving || (d.default.setRepeatSong(!n.default.repeat_song), o.default.syncRepeatSong())
            }

            return {handle: e}
        }();
        t.default = f, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(13), d = l(i), s = a(19), o = l(s), f = function () {
            function e() {
                if (!n.default.is_touch_moving) {
                    var e = this.getAttribute("data-amplitude-playlist");
                    null == e ? t() : a(e)
                }
            }

            function t() {
                d.default.toggleShuffle(), o.default.syncMain(n.default.shuffle_on)
            }

            function a(e) {
                d.default.toggleShufflePlaylist(e), o.default.syncPlaylist(e)
            }

            return {handle: e}
        }();
        t.default = f, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(4), d = l(i), s = a(3), o = l(s), f = a(5), r = l(f), c = a(1), p = l(c),
            v = a(2), y = l(v), g = function () {
                function e() {
                    if (!n.default.is_touch_moving) {
                        var e = this.getAttribute("data-amplitude-playlist"),
                            l = this.getAttribute("data-amplitude-song-index"),
                            u = this.getAttribute("data-amplitude-location");
                        null == u && d.default.writeMessage("You must add an 'data-amplitude-location' attribute in seconds to your 'amplitude-skip-to' element."), null == l && d.default.writeMessage("You must add an 'data-amplitude-song-index' attribute to your 'amplitude-skip-to' element."), null != u && null != l && (null == e ? t(parseInt(l), parseInt(u)) : a(e, parseInt(l), parseInt(u)))
                    }
                }

                function t(e, t) {
                    o.default.changeSong(n.default.songs[e], e), p.default.play(), y.default.syncGlobal(), y.default.syncSong(), p.default.skipToLocation(t)
                }

                function a(e, t, a) {
                    r.default.newPlaylist(e) && o.default.setActivePlaylist(e), o.default.changeSongPlaylist(e, n.default.playlists[e].songs[t], t), p.default.play(), y.default.syncGlobal(), y.default.syncPlaylist(), y.default.syncSong(), p.default.skipToLocation(a)
                }

                return {handle: e}
            }();
        t.default = g, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(23), d = l(i), s = a(14), o = l(s), f = function () {
            function e() {
                var e = this.value, i = n.default.audio.duration * (e / 100),
                    d = this.getAttribute("data-amplitude-playlist"),
                    s = this.getAttribute("data-amplitude-song-index");
                null == d && null == s && t(i, e), null != d && null == s && a(i, e, d), null == d && null != s && l(i, e, s), null != d && null != s && u(i, e, d, s)
            }

            function t(e, t) {
                n.default.active_metadata.live || (d.default.setCurrentTime(e), o.default.sync(t, n.default.active_playlist, n.default.active_index))
            }

            function a(e, t, a) {
                n.default.active_playlist == a && (n.default.active_metadata.live || (d.default.setCurrentTime(e), o.default.sync(t, a, n.default.active_index)))
            }

            function l(e, t, a) {
                n.default.active_index == a && null == n.default.active_playlist && (n.default.active_metadata.live || (d.default.setCurrentTime(e), o.default.sync(t, n.default.active_playlist, a)))
            }

            function u(e, t, a, l) {
                n.default.playlists[a].active_index == l && n.default.active_playlist == a && (n.default.active_metadata.live || (d.default.setCurrentTime(e), o.default.sync(t, a, l)))
            }

            return {handle: e}
        }();
        t.default = f, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(6), d = (l(i), a(2)), s = l(d), o = a(1), f = l(o), r = function () {
            function e() {
                n.default.is_touch_moving || (s.default.syncToPause(), f.default.stop())
            }

            return {handle: e}
        }();
        t.default = r, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(24), d = l(i), s = a(15), o = l(s), f = a(14), r = l(f), c = a(20), p = l(c),
            v = a(23), y = l(v), g = a(9), m = (l(g), function () {
                function e() {
                    t(), d.default.sync(), a(), l()
                }

                function t() {
                    if (n.default.audio.buffered.length - 1 >= 0) {
                        var e = n.default.audio.buffered.end(n.default.audio.buffered.length - 1),
                            t = n.default.audio.duration;
                        n.default.buffered = e / t * 100
                    }
                }

                function a() {
                    if (!n.default.active_metadata.live) {
                        var e = y.default.computeCurrentTimes(), t = y.default.computeSongCompletionPercentage(),
                            a = y.default.computeSongDuration();
                        o.default.syncCurrentTimes(e), r.default.sync(t, n.default.active_playlist, n.default.active_index), p.default.sync(t), o.default.syncDurationTimes(e, a)
                    }
                }

                function l() {
                    var e = Math.floor(n.default.audio.currentTime);
                    if (void 0 != n.default.active_metadata.time_callbacks && void 0 != n.default.active_metadata.time_callbacks[e]) n.default.active_metadata.time_callbacks[e].run || (n.default.active_metadata.time_callbacks[e].run = !0, n.default.active_metadata.time_callbacks[e]()); else for (var t in n.default.active_metadata.time_callbacks) n.default.active_metadata.time_callbacks.hasOwnProperty(t) && (n.default.active_metadata.time_callbacks[t].run = !1)
                }

                return {handle: e}
            }());
        t.default = m, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(1), d = l(i), s = a(10), o = l(s), f = a(11), r = l(f), c = function () {
            function e() {
                if (!n.default.is_touch_moving) {
                    var e = null;
                    e = n.default.volume - n.default.volume_increment > 0 ? n.default.volume - n.default.volume_increment : 0, d.default.setVolume(e), o.default.setMuted(0 == n.default.volume), r.default.sync()
                }
            }

            return {handle: e}
        }();
        t.default = c, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(1), d = l(i), s = a(10), o = l(s), f = a(11), r = l(f), c = function () {
            function e() {
                d.default.setVolume(this.value), o.default.setMuted(0 == n.default.volume), r.default.sync()
            }

            return {handle: e}
        }();
        t.default = c, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(1), d = l(i), s = a(10), o = l(s), f = a(11), r = l(f), c = function () {
            function e() {
                if (!n.default.is_touch_moving) {
                    var e = null;
                    e = n.default.volume + n.default.volume_increment <= 100 ? n.default.volume + n.default.volume_increment : 100, d.default.setVolume(e), o.default.setMuted(0 == n.default.volume), r.default.sync()
                }
            }

            return {handle: e}
        }();
        t.default = c, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e() {
                var e = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext;
                e ? (u.default.context = new e, u.default.analyser = u.default.context.createAnalyser(), u.default.audio.crossOrigin = "anonymous", u.default.source = u.default.context.createMediaElementSource(u.default.audio), u.default.source.connect(u.default.analyser), u.default.analyser.connect(u.default.context.destination)) : AmplitudeHelpers.writeDebugMessage("Web Audio API is unavailable! We will set any of your visualizations with your back up definition!")
            }

            function t() {
                var e = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext;
                return u.default.web_audio_api_available = !1, e ? (u.default.web_audio_api_available = !0, !0) : (u.default.web_audio_api_available = !1, !1)
            }

            function a() {
                var e = document.querySelectorAll(".amplitude-wave-form"),
                    t = document.querySelectorAll(".amplitude-visualization");
                return e.length > 0 || t.length > 0
            }

            return {configureWebAudioAPI: e, webAudioAPIAvailable: t, determineUsingAnyFX: a}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(21), n = l(u), i = a(0), d = l(i), s = a(1), o = l(s), f = a(13), r = l(f), c = a(6),
            p = (l(c), a(3)), v = l(p), y = a(12), g = l(y), m = a(5), _ = l(m), h = a(16), b = l(h), A = a(19),
            x = l(A), M = a(8), P = l(M), S = a(14), L = l(S), w = a(20), E = l(w), k = a(15), T = l(k), O = a(2),
            C = l(O), N = a(7), j = l(N), I = a(18), q = l(I), z = a(4), H = l(z), B = a(17), D = l(B),
            R = function () {
                function e(e) {
                    n.default.initialize(e)
                }

                function t() {
                    return d.default
                }

                function a() {
                    n.default.rebindDisplay()
                }

                function l() {
                    return d.default.active_playlist
                }

                function u() {
                    return d.default.playback_speed
                }

                function i(e) {
                    o.default.setPlaybackSpeed(e), q.default.sync()
                }

                function s() {
                    return d.default.repeat
                }

                function f(e) {
                    return d.default.playlists[e].repeat
                }

                function c() {
                    return d.default.shuffle_on
                }

                function p(e) {
                    return d.default.playlists[e].shuffle
                }

                function y(e) {
                    r.default.setShuffle(e), x.default.syncMain()
                }

                function m(e, t) {
                    r.default.setShufflePlaylist(e, t), x.default.syncMain(), x.default.syncPlaylist(e)
                }

                function h(e) {
                    g.default.setRepeat(e), P.default.syncRepeat()
                }

                function A(e, t) {
                    g.default.setRepeatPlaylist(t, e), P.default.syncRepeatPlaylist(e)
                }

                function M(e) {
                    d.default.is_touch_moving || (g.default.setRepeatSong(!d.default.repeat_song), P.default.syncRepeatSong())
                }

                function S() {
                    return d.default.default_album_art
                }

                function w() {
                    return d.default.default_playlist_art
                }

                function k(e) {
                    d.default.default_album_art = e
                }

                function O(e) {
                    d.default.default_plalist_art = e
                }

                function N() {
                    return d.default.audio.currentTime / d.default.audio.duration * 100
                }

                function I() {
                    return d.default.audio.currentTime
                }

                function z() {
                    return d.default.audio.duration
                }

                function B(e) {
                    "number" == typeof e && e > 0 && e < 100 && (d.default.audio.currentTime = d.default.audio.duration * (e / 100))
                }

                function R(e) {
                    d.default.debug = e
                }

                function V() {
                    return d.default.active_metadata
                }

                function U() {
                    return d.default.playlists[d.default.active_playlist]
                }

                function F(e) {
                    return d.default.songs[e]
                }

                function W(e, t) {
                    return d.default.playlists[e].songs[t]
                }

                function G(e) {
                    return void 0 == d.default.songs && (d.default.songs = []), d.default.songs.push(e), d.default.shuffle_on && d.default.shuffle_list.push(e), D.default.isSoundCloudURL(e.url) && D.default.resolveIndividualStreamableURL(e.url, null, d.default.songs.length - 1, d.default.shuffle_on), d.default.songs.length - 1
                }

                function Y(e) {
                    return void 0 == d.default.songs && (d.default.songs = []), d.default.songs.unshift(e), d.default.shuffle_on && d.default.shuffle_list.unshift(e), D.default.isSoundCloudURL(e.url) && D.default.resolveIndividualStreamableURL(e.url, null, d.default.songs.length - 1, d.default.shuffle_on), 0
                }

                function X(e, t) {
                    return void 0 != d.default.playlists[t] ? (d.default.playlists[t].songs.push(e), d.default.playlists[t].shuffle && d.default.playlists[t].shuffle_list.push(e), D.default.isSoundCloudURL(e.url) && D.default.resolveIndividualStreamableURL(e.url, t, d.default.playlists[t].songs.length - 1, d.default.playlists[t].shuffle), d.default.playlists[t].songs.length - 1) : (H.default.writeMessage("Playlist doesn't exist!"), null)
                }

                function J(e, t, a) {
                    if (void 0 == d.default.playlists[e]) {
                        d.default.playlists[e] = {};
                        var l = ["repeat", "shuffle", "shuffle_list", "songs", "src"];
                        for (var u in t) l.indexOf(u) < 0 && (d.default.playlists[e][u] = t[u]);
                        return d.default.playlists[e].songs = a, d.default.playlists[e].active_index = null, d.default.playlists[e].repeat = !1, d.default.playlists[e].shuffle = !1, d.default.playlists[e].shuffle_list = [], d.default.playlists[e]
                    }
                    return H.default.writeMessage("A playlist already exists with that key!"), null
                }

                function $(e) {
                    d.default.songs.splice(e, 1)
                }

                function Q(e, t) {
                    void 0 != d.default.playlists[t] && d.default.playlists[t].songs.splice(e, 1)
                }

                function K(e) {
                    e.url ? (d.default.audio.src = e.url, d.default.active_metadata = e, d.default.active_album = e.album) : H.default.writeMessage("The song needs to have a URL!"), o.default.play(), C.default.sync(), j.default.displayMetaData(), L.default.resetElements(), E.default.resetElements(), T.default.resetCurrentTimes(), T.default.resetDurationTimes()
                }

                function Z(e) {
                    o.default.stop(), _.default.newPlaylist(null) && (v.default.setActivePlaylist(null), v.default.changeSong(d.default.songs[e], e)), _.default.newSong(null, e) && v.default.changeSong(d.default.songs[e], e), o.default.play(), C.default.sync()
                }

                function ee(e, t) {
                    o.default.stop(), _.default.newPlaylist(t) && (v.default.setActivePlaylist(t), v.default.changeSongPlaylist(t, d.default.playlists[t].songs[e], e)), _.default.newSong(t, e) && v.default.changeSongPlaylist(t, d.default.playlists[t].songs[e], e), C.default.sync(), o.default.play()
                }

                function te() {
                    o.default.play()
                }

                function ae() {
                    o.default.pause()
                }

                function le() {
                    o.default.stop()
                }

                function ue() {
                    return d.default.audio
                }

                function ne() {
                    return d.default.analyser
                }

                function ie() {
                    var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : null;
                    "" == e || null == e ? null == d.default.active_playlist || "" == d.default.active_playlist ? v.default.setNext() : v.default.setNextPlaylist(d.default.active_playlist) : v.default.setNextPlaylist(e)
                }

                function de() {
                    var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : null;
                    "" == e || null == e ? null == d.default.active_playlist || "" == d.default.active_playlist ? v.default.setPrevious() : v.default.setPreviousPlaylist(d.default.active_playlist) : v.default.setPreviousPlaylist(e)
                }

                function se() {
                    return d.default.songs
                }

                function oe(e) {
                    return d.default.playlists[e].songs
                }

                function fe() {
                    return d.default.shuffle_on ? d.default.shuffle_list : d.default.songs
                }

                function re(e) {
                    return d.default.playlists[e].shuffle ? d.default.playlists[e].shuffle_list : d.default.playlists[e].songs
                }

                function ce() {
                    return parseInt(d.default.active_index)
                }

                function pe() {
                    return d.default.version
                }

                function ve() {
                    return d.default.buffered
                }

                function ye(e, t) {
                    var a = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : null;
                    e = parseInt(e), null != a ? (_.default.newPlaylist(a) && v.default.setActivePlaylist(a), v.default.changeSongPlaylist(a, d.default.playlists[a].songs[t], t), o.default.play(), C.default.syncGlobal(), C.default.syncPlaylist(), C.default.syncSong(), o.default.skipToLocation(e)) : (v.default.changeSong(d.default.songs[t], t), o.default.play(), C.default.syncGlobal(), C.default.syncSong(), o.default.skipToLocation(e))
                }

                function ge(e, t) {
                    var a = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : null;
                    if ("" != a && null != a && void 0 != d.default.playlists[a]) for (var l in t) t.hasOwnProperty(l) && "url" != l && "URL" != l && "live" != l && "LIVE" != l && (d.default.playlists[a].songs[e][l] = t[l]); else for (var l in t) t.hasOwnProperty(l) && "url" != l && "URL" != l && "live" != l && "LIVE" != l && (d.default.songs[e][l] = t[l]);
                    j.default.displayMetaData(), j.default.syncMetaData()
                }

                function me(e, t) {
                    if (void 0 != d.default.playlists[e]) {
                        var a = ["repeat", "shuffle", "shuffle_list", "songs", "src"];
                        for (var l in t) t.hasOwnProperty(l) && a.indexOf(l) < 0 && (d.default.playlists[e][l] = t[l]);
                        j.default.displayPlaylistMetaData()
                    } else H.default.writeMessage("You must provide a valid playlist key!")
                }

                function _e(e) {
                    d.default.delay = e
                }

                function he() {
                    return d.default.delay
                }

                function be() {
                    return d.default.player_state
                }

                function Ae(e, t) {
                    b.default.register(e, t)
                }

                function xe(e, t) {
                    void 0 != d.default.playlists[e] ? void 0 != d.default.visualizations.available[t] ? d.default.playlists[e].visualization = t : H.default.writeMessage("A visualization does not exist for the key provided.") : H.default.writeMessage("The playlist for the key provided does not exist")
                }

                function Me(e, t) {
                    d.default.songs[e] ? void 0 != d.default.visualizations.available[t] ? d.default.songs[e].visualization = t : H.default.writeMessage("A visualization does not exist for the key provided.") : H.default.writeMessage("A song at that index is undefined")
                }

                function Pe(e, t, a) {
                    void 0 != d.default.playlists[e].songs[t] ? void 0 != d.default.visualizations.available[a] ? d.default.playlists[e].songs[t].visualization = a : H.default.writeMessage("A visualization does not exist for the key provided.") : H.default.writeMessage("The song in the playlist at that key is not defined")
                }

                function Se(e) {
                    void 0 != d.default.visualizations.available[e] ? d.default.visualization = e : H.default.writeMessage("A visualization does not exist for the key provided.")
                }

                function Le(e) {
                    o.default.setVolume(e)
                }

                function we() {
                    return d.default.volume
                }

                return {
                    init: e,
                    getConfig: t,
                    bindNewElements: a,
                    getActivePlaylist: l,
                    getPlaybackSpeed: u,
                    setPlaybackSpeed: i,
                    getRepeat: s,
                    getRepeatPlaylist: f,
                    getShuffle: c,
                    getShufflePlaylist: p,
                    setShuffle: y,
                    setShufflePlaylist: m,
                    setRepeat: h,
                    setRepeatSong: M,
                    setRepeatPlaylist: A,
                    getDefaultAlbumArt: S,
                    setDefaultAlbumArt: k,
                    getDefaultPlaylistArt: w,
                    setDefaultPlaylistArt: O,
                    getSongPlayedPercentage: N,
                    setSongPlayedPercentage: B,
                    getSongPlayedSeconds: I,
                    getSongDuration: z,
                    setDebug: R,
                    getActiveSongMetadata: V,
                    getActivePlaylistMetadata: U,
                    getSongAtIndex: F,
                    getSongAtPlaylistIndex: W,
                    addSong: G,
                    prependSong: Y,
                    addSongToPlaylist: X,
                    removeSong: $,
                    removeSongFromPlaylist: Q,
                    playNow: K,
                    playSongAtIndex: Z,
                    playPlaylistSongAtIndex: ee,
                    play: te,
                    pause: ae,
                    stop: le,
                    getAudio: ue,
                    getAnalyser: ne,
                    next: ie,
                    prev: de,
                    getSongs: se,
                    getSongsInPlaylist: oe,
                    getSongsState: fe,
                    getSongsStatePlaylist: re,
                    getActiveIndex: ce,
                    getVersion: pe,
                    getBuffered: ve,
                    skipTo: ye,
                    setSongMetaData: ge,
                    setPlaylistMetaData: me,
                    setDelay: _e,
                    getDelay: he,
                    getPlayerState: be,
                    addPlaylist: J,
                    registerVisualization: Ae,
                    setPlaylistVisualization: xe,
                    setSongVisualization: Me,
                    setSongInPlaylistVisualization: Pe,
                    setGlobalVisualization: Se,
                    getVolume: we,
                    setVolume: Le
                }
            }();
        t.default = R, e.exports = t.default
    }, function (e, t, a) {
        "use strict";

        function l(e) {
            return e && e.__esModule ? e : {default: e}
        }

        Object.defineProperty(t, "__esModule", {value: !0});
        var u = a(0), n = l(u), i = a(4), d = l(i), s = a(5), o = l(s), f = a(7), r = l(f), c = a(17), p = l(c),
            v = function () {
                function e(e) {
                    n.default.playlists = e, a(), l(), t(), u(), i(), s(), f()
                }

                function t() {
                    for (var e in n.default.playlists) n.default.playlists[e].active_index = null
                }

                function a() {
                    for (var e in n.default.playlists) if (n.default.playlists.hasOwnProperty(e) && n.default.playlists[e].songs) for (var t = 0; t < n.default.playlists[e].songs.length; t++) o.default.isInt(n.default.playlists[e].songs[t]) && (n.default.playlists[e].songs[t] = n.default.songs[n.default.playlists[e].songs[t]], n.default.playlists[e].songs[t].index = t), o.default.isInt(n.default.playlists[e].songs[t]) && !n.default.songs[n.default.playlists[e].songs[t]] && d.default.writeMessage("The song index: " + n.default.playlists[e].songs[t] + " in playlist with key: " + e + " is not defined in your songs array!"), o.default.isInt(n.default.playlists[e].songs[t]) || (n.default.playlists[e].songs[t].index = t)
                }

                function l() {
                    for (var e in n.default.playlists) if (n.default.playlists.hasOwnProperty(e)) for (var t = 0; t < n.default.playlists[e].songs.length; t++) p.default.isSoundCloudURL(n.default.playlists[e].songs[t].url) && void 0 == n.default.playlists[e].songs[t].soundcloud_data && p.default.resolveIndividualStreamableURL(n.default.playlists[e].songs[t].url, e, t)
                }

                function u() {
                    for (var e in n.default.playlists) n.default.playlists[e].shuffle = !1
                }

                function i() {
                    for (var e in n.default.playlists) n.default.playlists[e].repeat = !1
                }

                function s() {
                    for (var e in n.default.playlists) n.default.playlists[e].shuffle_list = []
                }

                function f() {
                    for (var e in n.default.playlists) r.default.setFirstSongInPlaylist(n.default.playlists[e].songs[0], e)
                }

                return {initialize: e}
            }();
        t.default = v, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                for (var t = document.getElementsByClassName("amplitude-song-container"), a = 0; a < t.length; a++) t[a].classList.remove("amplitude-active-song-container");
                if ("" == u.default.active_playlist || null == u.default.active_playlist) {
                    var l = "";
                    if (l = e ? u.default.active_index : u.default.shuffle_on ? u.default.shuffle_list[u.default.active_index].index : u.default.active_index, document.querySelectorAll('.amplitude-song-container[data-amplitude-song-index="' + l + '"]')) for (var n = document.querySelectorAll('.amplitude-song-container[data-amplitude-song-index="' + l + '"]'), i = 0; i < n.length; i++) n[i].hasAttribute("data-amplitude-playlist") || n[i].classList.add("amplitude-active-song-container")
                } else {
                    if (null != u.default.active_playlist && "" != u.default.active_playlist || e) var d = u.default.playlists[u.default.active_playlist].active_index; else {
                        var d = "";
                        d = u.default.playlists[u.default.active_playlist].shuffle ? u.default.playlists[u.default.active_playlist].shuffle_list[u.default.playlists[u.default.active_playlist].active_index].index : u.default.playlists[u.default.active_playlist].active_index
                    }
                    if (document.querySelectorAll('.amplitude-song-container[data-amplitude-song-index="' + d + '"][data-amplitude-playlist="' + u.default.active_playlist + '"]')) for (var s = document.querySelectorAll('.amplitude-song-container[data-amplitude-song-index="' + d + '"][data-amplitude-playlist="' + u.default.active_playlist + '"]'), o = 0; o < s.length; o++) s[o].classList.add("amplitude-active-song-container")
                }
            }

            return {setActive: e}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                t(e), a(e), l(e), n(e)
            }

            function t(e) {
                for (var t = document.querySelectorAll(".amplitude-current-hours"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist"),
                        u = t[a].getAttribute("data-amplitude-song-index");
                    null == l && null == u && (t[a].innerHTML = e)
                }
            }

            function a(e) {
                for (var t = document.querySelectorAll('.amplitude-current-hours[data-amplitude-playlist="' + u.default.active_playlist + '"]'), a = 0; a < t.length; a++) {
                    null == t[a].getAttribute("data-amplitude-song-index") && (t[a].innerHTML = e)
                }
            }

            function l(e) {
                if (null == u.default.active_playlist) for (var t = document.querySelectorAll('.amplitude-current-hours[data-amplitude-song-index="' + u.default.active_index + '"]'), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist");
                    null == l && (t[a].innerHTML = e)
                }
            }

            function n(e) {
                for (var t = "" != u.default.active_playlist && null != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null, a = document.querySelectorAll('.amplitude-current-hours[data-amplitude-playlist="' + u.default.active_playlist + '"][data-amplitude-song-index="' + t + '"]'), l = 0; l < a.length; l++) a[l].innerHTML = e
            }

            function i() {
                for (var e = document.querySelectorAll(".amplitude-current-hours"), t = 0; t < e.length; t++) e[t].innerHTML = "00"
            }

            return {sync: e, resetTimes: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                t(e), a(e), l(e), n(e)
            }

            function t(e) {
                for (var t = document.querySelectorAll(".amplitude-current-minutes"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist"),
                        u = t[a].getAttribute("data-amplitude-song-index");
                    null == l && null == u && (t[a].innerHTML = e)
                }
            }

            function a(e) {
                for (var t = document.querySelectorAll('.amplitude-current-minutes[data-amplitude-playlist="' + u.default.active_playlist + '"]'), a = 0; a < t.length; a++) {
                    null == t[a].getAttribute("data-amplitude-song-index") && (t[a].innerHTML = e)
                }
            }

            function l(e) {
                if (null == u.default.active_playlist) for (var t = document.querySelectorAll('.amplitude-current-minutes[data-amplitude-song-index="' + u.default.active_index + '"]'), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist");
                    null == l && (t[a].innerHTML = e)
                }
            }

            function n(e) {
                for (var t = "" != u.default.active_playlist && null != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null, a = document.querySelectorAll('.amplitude-current-minutes[data-amplitude-playlist="' + u.default.active_playlist + '"][data-amplitude-song-index="' + t + '"]'), l = 0; l < a.length; l++) a[l].innerHTML = e
            }

            function i() {
                for (var e = document.querySelectorAll(".amplitude-current-minutes"), t = 0; t < e.length; t++) e[t].innerHTML = "00"
            }

            return {sync: e, resetTimes: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                t(e), a(e), l(e), n(e)
            }

            function t(e) {
                for (var t = document.querySelectorAll(".amplitude-current-seconds"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist"),
                        u = t[a].getAttribute("data-amplitude-song-index");
                    null == l && null == u && (t[a].innerHTML = e)
                }
            }

            function a(e) {
                for (var t = document.querySelectorAll('.amplitude-current-seconds[data-amplitude-playlist="' + u.default.active_playlist + '"]'), a = 0; a < t.length; a++) {
                    null == t[a].getAttribute("data-amplitude-song-index") && (t[a].innerHTML = e)
                }
            }

            function l(e) {
                if (null == u.default.active_playlist) for (var t = document.querySelectorAll('.amplitude-current-seconds[data-amplitude-song-index="' + u.default.active_index + '"]'), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist");
                    null == l && (t[a].innerHTML = e)
                }
            }

            function n(e) {
                for (var t = "" != u.default.active_playlist && null != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null, a = document.querySelectorAll('.amplitude-current-seconds[data-amplitude-playlist="' + u.default.active_playlist + '"][data-amplitude-song-index="' + t + '"]'), l = 0; l < a.length; l++) a[l].innerHTML = e
            }

            function i() {
                for (var e = document.querySelectorAll(".amplitude-current-seconds"), t = 0; t < e.length; t++) e[t].innerHTML = "00"
            }

            return {sync: e, resetTimes: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                t(e), a(e), l(e), n(e)
            }

            function t(e) {
                var t = document.querySelectorAll(".amplitude-current-time"), a = e.minutes + ":" + e.seconds;
                e.hours > 0 && (a = e.hours + ":" + a);
                for (var l = 0; l < t.length; l++) {
                    var u = t[l].getAttribute("data-amplitude-playlist"),
                        n = t[l].getAttribute("data-amplitude-song-index");
                    null == u && null == n && (t[l].innerHTML = a)
                }
            }

            function a(e) {
                var t = document.querySelectorAll('.amplitude-current-time[data-amplitude-playlist="' + u.default.active_playlist + '"]'),
                    a = e.minutes + ":" + e.seconds;
                e.hours > 0 && (a = e.hours + ":" + a);
                for (var l = 0; l < t.length; l++) {
                    null == t[l].getAttribute("data-amplitude-song-index") && (t[l].innerHTML = a)
                }
            }

            function l(e) {
                if (null == u.default.active_playlist) {
                    var t = document.querySelectorAll('.amplitude-current-time[data-amplitude-song-index="' + u.default.active_index + '"]'),
                        a = e.minutes + ":" + e.seconds;
                    e.hours > 0 && (a = e.hours + ":" + a);
                    for (var l = 0; l < t.length; l++) {
                        null == t[l].getAttribute("data-amplitude-playlist") && (t[l].innerHTML = a)
                    }
                }
            }

            function n(e) {
                var t = "" != u.default.active_playlist && null != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null,
                    a = document.querySelectorAll('.amplitude-current-time[data-amplitude-playlist="' + u.default.active_playlist + '"][data-amplitude-song-index="' + t + '"]'),
                    l = e.minutes + ":" + e.seconds;
                e.hours > 0 && (l = e.hours + ":" + l);
                for (var n = 0; n < a.length; n++) a[n].innerHTML = l
            }

            function i() {
                for (var e = document.querySelectorAll(".amplitude-current-time"), t = 0; t < e.length; t++) e[t].innerHTML = "00:00"
            }

            return {sync: e, resetTimes: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e, u) {
                var i = d(e, u);
                t(i), a(i), l(i), n(i)
            }

            function t(e) {
                for (var t = document.querySelectorAll(".amplitude-time-remaining"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist"),
                        u = t[a].getAttribute("data-amplitude-song-index");
                    null == l && null == u && (t[a].innerHTML = e)
                }
            }

            function a(e) {
                for (var t = document.querySelectorAll('.amplitude-time-remaining[data-amplitude-playlist="' + u.default.active_playlist + '"]'), a = 0; a < t.length; a++) {
                    null == t[a].getAttribute("data-amplitude-song-index") && (t[a].innerHTML = e)
                }
            }

            function l(e) {
                if (null == u.default.active_playlist) for (var t = document.querySelectorAll('.amplitude-time-remaining[data-amplitude-song-index="' + u.default.active_index + '"]'), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist");
                    null == l && (t[a].innerHTML = e)
                }
            }

            function n(e) {
                for (var t = "" != u.default.active_playlist && null != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null, a = document.querySelectorAll('.amplitude-time-remaining[data-amplitude-playlist="' + u.default.active_playlist + '"][data-amplitude-song-index="' + t + '"]'), l = 0; l < a.length; l++) a[l].innerHTML = e
            }

            function i() {
                for (var e = document.querySelectorAll(".amplitude-time-remaining"), t = 0; t < e.length; t++) e[t].innerHTML = "00"
            }

            function d(e, t) {
                var a = "00:00", l = parseInt(e.seconds) + 60 * parseInt(e.minutes) + 60 * parseInt(e.hours) * 60,
                    u = parseInt(t.seconds) + 60 * parseInt(t.minutes) + 60 * parseInt(t.hours) * 60;
                if (!isNaN(l) && !isNaN(u)) {
                    var n = u - l, i = Math.floor(n / 3600), d = Math.floor((n - 3600 * i) / 60),
                        s = n - 3600 * i - 60 * d;
                    a = (d < 10 ? "0" + d : d) + ":" + (s < 10 ? "0" + s : s), i > 0 && (a = i + ":" + a)
                }
                return a
            }

            return {sync: e, resetTimes: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                t(e), a(e), l(e), n(e)
            }

            function t(e) {
                for (var t = document.querySelectorAll(".amplitude-duration-hours"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist"),
                        u = t[a].getAttribute("data-amplitude-song-index");
                    null == l && null == u && (t[a].innerHTML = e)
                }
            }

            function a(e) {
                for (var t = document.querySelectorAll('.amplitude-duration-hours[data-amplitude-playlist="' + u.default.active_playlist + '"]'), a = 0; a < t.length; a++) {
                    null == t[a].getAttribute("data-amplitude-song-index") && (t[a].innerHTML = e)
                }
            }

            function l(e) {
                if (null == u.default.active_playlist) for (var t = document.querySelectorAll('.amplitude-duration-hours[data-amplitude-song-index="' + u.default.active_index + '"]'), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist");
                    null == l && (t[a].innerHTML = e)
                }
            }

            function n(e) {
                for (var t = "" != u.default.active_playlist && null != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null, a = document.querySelectorAll('.amplitude-duration-hours[data-amplitude-playlist="' + u.default.active_playlist + '"][data-amplitude-song-index="' + t + '"]'), l = 0; l < a.length; l++) a[l].innerHTML = e
            }

            function i() {
                for (var e = document.querySelectorAll(".amplitude-duration-hours"), t = 0; t < e.length; t++) e[t].innerHTML = "00"
            }

            return {sync: e, resetTimes: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                t(e), a(e), l(e), n(e)
            }

            function t(e) {
                for (var t = document.querySelectorAll(".amplitude-duration-minutes"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist"),
                        u = t[a].getAttribute("data-amplitude-song-index");
                    null == l && null == u && (t[a].innerHTML = e)
                }
            }

            function a(e) {
                for (var t = document.querySelectorAll('.amplitude-duration-minutes[data-amplitude-playlist="' + u.default.active_playlist + '"]'), a = 0; a < t.length; a++) {
                    null == t[a].getAttribute("data-amplitude-song-index") && (t[a].innerHTML = e)
                }
            }

            function l(e) {
                if (null == u.default.active_playlist) for (var t = document.querySelectorAll('.amplitude-duration-minutes[data-amplitude-song-index="' + u.default.active_index + '"]'), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist");
                    null == l && (t[a].innerHTML = e)
                }
            }

            function n(e) {
                for (var t = "" != u.default.active_playlist && null != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null, a = document.querySelectorAll('.amplitude-duration-minutes[data-amplitude-playlist="' + u.default.active_playlist + '"][data-amplitude-song-index="' + t + '"]'), l = 0; l < a.length; l++) a[l].innerHTML = e
            }

            function i() {
                for (var e = document.querySelectorAll(".amplitude-duration-minutes"), t = 0; t < e.length; t++) e[t].innerHTML = "00"
            }

            return {sync: e, resetTimes: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                t(e), a(e), l(e), n(e)
            }

            function t(e) {
                for (var t = document.querySelectorAll(".amplitude-duration-seconds"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist"),
                        u = t[a].getAttribute("data-amplitude-song-index");
                    null == l && null == u && (t[a].innerHTML = e)
                }
            }

            function a(e) {
                for (var t = document.querySelectorAll('.amplitude-duration-seconds[data-amplitude-playlist="' + u.default.active_playlist + '"]'), a = 0; a < t.length; a++) {
                    null == t[a].getAttribute("data-amplitude-song-index") && (t[a].innerHTML = e)
                }
            }

            function l(e) {
                if (null == u.default.active_playlist) for (var t = document.querySelectorAll('.amplitude-duration-seconds[data-amplitude-song-index="' + u.default.active_index + '"]'), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data--amplitude-playlist");
                    null == l && (t[a].innerHTML = e)
                }
            }

            function n(e) {
                for (var t = "" != u.default.active_playlist && null != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null, a = document.querySelectorAll('.amplitude-duration-seconds[data-amplitude-playlist="' + u.default.active_playlist + '"][data-amplitude-song-index="' + t + '"]'), l = 0; l < a.length; l++) a[l].innerHTML = e
            }

            function i() {
                for (var e = document.querySelectorAll(".amplitude-duration-seconds"), t = 0; t < e.length; t++) e[t].innerHTML = "00"
            }

            return {sync: e, resetTimes: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t, a) {
        "use strict";
        Object.defineProperty(t, "__esModule", {value: !0});
        var l = a(0), u = function (e) {
            return e && e.__esModule ? e : {default: e}
        }(l), n = function () {
            function e(e) {
                var u = d(e);
                t(u), a(u), l(u), n(u)
            }

            function t(e) {
                for (var t = document.querySelectorAll(".amplitude-duration-time"), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist"),
                        u = t[a].getAttribute("data-amplitude-song-index");
                    null == l && null == u && (t[a].innerHTML = e)
                }
            }

            function a(e) {
                for (var t = document.querySelectorAll('.amplitude-duration-time[data-amplitude-playlist="' + u.default.active_playlist + '"]'), a = 0; a < t.length; a++) {
                    null == t[a].getAttribute("data-amplitude-song-index") && (t[a].innerHTML = e)
                }
            }

            function l(e) {
                if (null == u.default.active_playlist) for (var t = document.querySelectorAll('.amplitude-duration-time[data-amplitude-song-index="' + u.default.active_index + '"]'), a = 0; a < t.length; a++) {
                    var l = t[a].getAttribute("data-amplitude-playlist");
                    null == l && (t[a].innerHTML = e)
                }
            }

            function n(e) {
                for (var t = "" != u.default.active_playlist && null != u.default.active_playlist ? u.default.playlists[u.default.active_playlist].active_index : null, a = document.querySelectorAll('.amplitude-duration-time[data-amplitude-playlist="' + u.default.active_playlist + '"][data-amplitude-song-index="' + t + '"]'), l = 0; l < a.length; l++) a[l].innerHTML = e
            }

            function i() {
                for (var e = document.querySelectorAll(".amplitude-duration-time"), t = 0; t < e.length; t++) e[t].innerHTML = "00:00"
            }

            function d(e) {
                var t = "00:00";
                return isNaN(e.minutes) || isNaN(e.seconds) || (t = e.minutes + ":" + e.seconds, !isNaN(e.hours) && e.hours > 0 && (t = e.hours + ":" + t)), t
            }

            return {sync: e, resetTimes: i}
        }();
        t.default = n, e.exports = t.default
    }, function (e, t) {
        e.exports = {
            name: "amplitudejs",
            version: "5.3.2",
            description: "A JavaScript library that allows you to control the design of your media controls in your webpage -- not the browser. No dependencies (jQuery not required) https://521dimensions.com/open-source/amplitudejs",
            main: "dist/amplitude.js",
            devDependencies: {
                "babel-core": "^6.26.3",
                "babel-loader": "^7.1.5",
                "babel-plugin-add-module-exports": "0.2.1",
                "babel-polyfill": "^6.26.0",
                "babel-preset-es2015": "^6.18.0",
                husky: "^1.3.1",
                jest: "^23.6.0",
                prettier: "1.15.1",
                "pretty-quick": "^1.11.1",
                watch: "^1.0.2",
                webpack: "^2.7.0"
            },
            directories: {doc: "docs"},
            files: ["dist"],
            funding: {type: "opencollective", url: "https://opencollective.com/amplitudejs"},
            scripts: {
                build: "node_modules/.bin/webpack",
                prettier: "npx pretty-quick",
                preversion: "npx pretty-quick && npm run test",
                postversion: "git push && git push --tags",
                test: "jest",
                version: "npm run build && git add -A dist"
            },
            repository: {type: "git", url: "git+https://github.com/521dimensions/amplitudejs.git"},
            keywords: ["webaudio", "html5", "javascript", "audio-player"],
            author: "521 Dimensions (https://521dimensions.com)",
            license: "MIT",
            bugs: {url: "https://github.com/521dimensions/amplitudejs/issues"},
            homepage: "https://github.com/521dimensions/amplitudejs#readme"
        }
    }])
});

/*!
 * wavesurfer.js 6.6.4 (2023-06-10)
 * https://wavesurfer-js.org
 * @license BSD-3-Clause
 */
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("WaveSurfer",[],t):"object"==typeof exports?exports.WaveSurfer=t():e.WaveSurfer=t()}(self,(()=>{return e={427:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var n=a(r(138)),i=a(r(56));function a(e){return e&&e.__esModule?e:{default:e}}function o(e){return o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},o(e)}function s(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,(i=n.key,a=void 0,a=function(e,t){if("object"!==o(e)||null===e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var n=r.call(e,t||"default");if("object"!==o(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(i,"string"),"symbol"===o(a)?a:String(a)),n)}var i,a}var u=function(){function e(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.wave=null,this.waveCtx=null,this.progress=null,this.progressCtx=null,this.start=0,this.end=1,this.id=(0,i.default)(void 0!==this.constructor.name?this.constructor.name.toLowerCase()+"_":"canvasentry_"),this.canvasContextAttributes={}}var t,r,a;return t=e,(r=[{key:"initWave",value:function(e){this.wave=e,this.waveCtx=this.wave.getContext("2d",this.canvasContextAttributes)}},{key:"initProgress",value:function(e){this.progress=e,this.progressCtx=this.progress.getContext("2d",this.canvasContextAttributes)}},{key:"updateDimensions",value:function(e,t,r,i){this.start=this.wave.offsetLeft/t||0,this.end=this.start+e/t,this.wave.width=r,this.wave.height=i;var a={width:e+"px"};(0,n.default)(this.wave,a),this.hasProgressCanvas&&(this.progress.width=r,this.progress.height=i,(0,n.default)(this.progress,a))}},{key:"clearWave",value:function(){this.waveCtx.clearRect(0,0,this.waveCtx.canvas.width,this.waveCtx.canvas.height),this.hasProgressCanvas&&this.progressCtx.clearRect(0,0,this.progressCtx.canvas.width,this.progressCtx.canvas.height)}},{key:"setFillStyles",value:function(e,t){this.waveCtx.fillStyle=this.getFillStyle(this.waveCtx,e),this.hasProgressCanvas&&(this.progressCtx.fillStyle=this.getFillStyle(this.progressCtx,t))}},{key:"getFillStyle",value:function(e,t){if("string"==typeof t||t instanceof CanvasGradient)return t;var r=e.createLinearGradient(0,0,0,e.canvas.height);return t.forEach((function(e,n){return r.addColorStop(n/t.length,e)})),r}},{key:"applyCanvasTransforms",value:function(e){e&&(this.waveCtx.setTransform(0,1,1,0,0,0),this.hasProgressCanvas&&this.progressCtx.setTransform(0,1,1,0,0,0))}},{key:"fillRects",value:function(e,t,r,n,i){this.fillRectToContext(this.waveCtx,e,t,r,n,i),this.hasProgressCanvas&&this.fillRectToContext(this.progressCtx,e,t,r,n,i)}},{key:"fillRectToContext",value:function(e,t,r,n,i,a){e&&(a?this.drawRoundedRect(e,t,r,n,i,a):e.fillRect(t,r,n,i))}},{key:"drawRoundedRect",value:function(e,t,r,n,i,a){0!==i&&(i<0&&(r-=i*=-1),e.beginPath(),e.moveTo(t+a,r),e.lineTo(t+n-a,r),e.quadraticCurveTo(t+n,r,t+n,r+a),e.lineTo(t+n,r+i-a),e.quadraticCurveTo(t+n,r+i,t+n-a,r+i),e.lineTo(t+a,r+i),e.quadraticCurveTo(t,r+i,t,r+i-a),e.lineTo(t,r+a),e.quadraticCurveTo(t,r,t+a,r),e.closePath(),e.fill())}},{key:"drawLines",value:function(e,t,r,n,i,a){this.drawLineToContext(this.waveCtx,e,t,r,n,i,a),this.hasProgressCanvas&&this.drawLineToContext(this.progressCtx,e,t,r,n,i,a)}},{key:"drawLineToContext",value:function(e,t,r,n,i,a,o){if(e){var s,u,l,c=t.length/2,f=Math.round(c*this.start),h=f,d=Math.round(c*this.end)+1,p=this.wave.width/(d-h-1),v=n+i,y=r/n;for(e.beginPath(),e.moveTo((h-f)*p,v),e.lineTo((h-f)*p,v-Math.round((t[2*h]||0)/y)),s=h;s<d;s++)u=t[2*s]||0,l=Math.round(u/y),e.lineTo((s-f)*p+this.halfPixel,v-l);for(var m=d-1;m>=h;m--)u=t[2*m+1]||0,l=Math.round(u/y),e.lineTo((m-f)*p+this.halfPixel,v-l);e.lineTo((h-f)*p,v-Math.round((t[2*h+1]||0)/y)),e.closePath(),e.fill()}}},{key:"destroy",value:function(){this.waveCtx=null,this.wave=null,this.progressCtx=null,this.progress=null}},{key:"getImage",value:function(e,t,r){var n=this;return"blob"===r?new Promise((function(r){n.wave.toBlob(r,e,t)})):"dataURL"===r?this.wave.toDataURL(e,t):void 0}}])&&s(t.prototype,r),a&&s(t,a),Object.defineProperty(t,"prototype",{writable:!1}),e}();t.default=u,e.exports=t.default},276:(e,t,r)=>{"use strict";function n(e){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},n(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var i=function(e,t){if(!t&&e&&e.__esModule)return e;if(null===e||"object"!==n(e)&&"function"!=typeof e)return{default:e};var r=a(t);if(r&&r.has(e))return r.get(e);var i={},o=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var s in e)if("default"!==s&&Object.prototype.hasOwnProperty.call(e,s)){var u=o?Object.getOwnPropertyDescriptor(e,s):null;u&&(u.get||u.set)?Object.defineProperty(i,s,u):i[s]=e[s]}return i.default=e,r&&r.set(e,i),i}(r(241));function a(e){if("function"!=typeof WeakMap)return null;var t=new WeakMap,r=new WeakMap;return(a=function(e){return e?r:t})(e)}function o(e,t){for(var r=0;r<t.length;r++){var i=t[r];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,(a=i.key,o=void 0,o=function(e,t){if("object"!==n(e)||null===e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var i=r.call(e,t||"default");if("object"!==n(i))return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(a,"string"),"symbol"===n(o)?o:String(o)),i)}var a,o}function s(e,t){return s=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},s(e,t)}function u(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}();return function(){var r,i=l(e);if(t){var a=l(this).constructor;r=Reflect.construct(i,arguments,a)}else r=i.apply(this,arguments);return function(e,t){if(t&&("object"===n(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}(this,r)}}function l(e){return l=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},l(e)}var c=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&s(e,t)}(l,e);var t,r,n,a=u(l);function l(e,t){var r;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,l),(r=a.call(this)).container=i.withOrientation(e,t.vertical),r.params=t,r.width=0,r.height=t.height*r.params.pixelRatio,r.lastPos=0,r.wrapper=null,r}return t=l,(r=[{key:"style",value:function(e,t){return i.style(e,t)}},{key:"createWrapper",value:function(){this.wrapper=i.withOrientation(this.container.appendChild(document.createElement("wave")),this.params.vertical),this.style(this.wrapper,{display:"block",position:"relative",userSelect:"none",webkitUserSelect:"none",height:this.params.height+"px"}),(this.params.fillParent||this.params.scrollParent)&&this.style(this.wrapper,{width:"100%",cursor:this.params.hideCursor?"none":"auto",overflowX:this.params.hideScrollbar?"hidden":"auto",overflowY:"hidden"}),this.setupWrapperEvents()}},{key:"handleEvent",value:function(e,t){!t&&e.preventDefault();var r,n=i.withOrientation(e.targetTouches?e.targetTouches[0]:e,this.params.vertical).clientX,a=this.wrapper.getBoundingClientRect(),o=this.width,s=this.getWidth(),u=this.getProgressPixels(a,n);return r=!this.params.fillParent&&o<s?u*(this.params.pixelRatio/o)||0:(u+this.wrapper.scrollLeft)/this.wrapper.scrollWidth||0,i.clamp(r,0,1)}},{key:"getProgressPixels",value:function(e,t){return this.params.rtl?e.right-t:t-e.left}},{key:"setupWrapperEvents",value:function(){var e=this;this.wrapper.addEventListener("click",(function(t){var r=i.withOrientation(t,e.params.vertical),n=e.wrapper.offsetHeight-e.wrapper.clientHeight;if(0!==n){var a=e.wrapper.getBoundingClientRect();if(r.clientY>=a.bottom-n)return}e.params.interact&&e.fireEvent("click",t,e.handleEvent(t))})),this.wrapper.addEventListener("dblclick",(function(t){e.params.interact&&e.fireEvent("dblclick",t,e.handleEvent(t))})),this.wrapper.addEventListener("scroll",(function(t){return e.fireEvent("scroll",t)}))}},{key:"drawPeaks",value:function(e,t,r,n){this.setWidth(t)||this.clearWave(),this.params.barWidth?this.drawBars(e,0,r,n):this.drawWave(e,0,r,n)}},{key:"resetScroll",value:function(){null!==this.wrapper&&(this.wrapper.scrollLeft=0)}},{key:"recenter",value:function(e){var t=this.wrapper.scrollWidth*e;this.recenterOnPosition(t,!0)}},{key:"recenterOnPosition",value:function(e,t){var r=this.wrapper.scrollLeft,n=~~(this.wrapper.clientWidth/2),i=this.wrapper.scrollWidth-this.wrapper.clientWidth,a=e-n,o=a-r;if(0!=i){if(!t&&-n<=o&&o<n){var s=this.params.autoCenterRate;s/=n,s*=i,a=r+(o=Math.max(-s,Math.min(s,o)))}(a=Math.max(0,Math.min(i,a)))!=r&&(this.wrapper.scrollLeft=a)}}},{key:"getScrollX",value:function(){var e=0;if(this.wrapper){var t=this.params.pixelRatio;if(e=Math.round(this.wrapper.scrollLeft*t),this.params.scrollParent){var r=~~(this.wrapper.scrollWidth*t-this.getWidth());e=Math.min(r,Math.max(0,e))}}return e}},{key:"getWidth",value:function(){return Math.round(this.container.clientWidth*this.params.pixelRatio)}},{key:"setWidth",value:function(e){if(this.width==e)return!1;if(this.width=e,this.params.fillParent||this.params.scrollParent)this.style(this.wrapper,{width:""});else{var t=~~(this.width/this.params.pixelRatio)+"px";this.style(this.wrapper,{width:t})}return this.updateSize(),!0}},{key:"setHeight",value:function(e){return e!=this.height&&(this.height=e,this.style(this.wrapper,{height:~~(this.height/this.params.pixelRatio)+"px"}),this.updateSize(),!0)}},{key:"progress",value:function(e){var t=1/this.params.pixelRatio,r=Math.round(e*this.width)*t;if(r<this.lastPos||r-this.lastPos>=t){if(this.lastPos=r,this.params.scrollParent&&this.params.autoCenter){var n=~~(this.wrapper.scrollWidth*e);this.recenterOnPosition(n,this.params.autoCenterImmediately)}this.updateProgress(r)}}},{key:"destroy",value:function(){this.unAll(),this.wrapper&&(this.wrapper.parentNode==this.container.domElement&&this.container.removeChild(this.wrapper.domElement),this.wrapper=null)}},{key:"updateCursor",value:function(){}},{key:"updateSize",value:function(){}},{key:"drawBars",value:function(e,t,r,n){}},{key:"drawWave",value:function(e,t,r,n){}},{key:"clearWave",value:function(){}},{key:"updateProgress",value:function(e){}}])&&o(t.prototype,r),n&&o(t,n),Object.defineProperty(t,"prototype",{writable:!1}),l}(i.Observer);t.default=c,e.exports=t.default},646:(e,t,r)=>{"use strict";function n(e){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},n(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var i=u(r(276)),a=function(e,t){if(!t&&e&&e.__esModule)return e;if(null===e||"object"!==n(e)&&"function"!=typeof e)return{default:e};var r=s(t);if(r&&r.has(e))return r.get(e);var i={},a=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if("default"!==o&&Object.prototype.hasOwnProperty.call(e,o)){var u=a?Object.getOwnPropertyDescriptor(e,o):null;u&&(u.get||u.set)?Object.defineProperty(i,o,u):i[o]=e[o]}return i.default=e,r&&r.set(e,i),i}(r(241)),o=u(r(427));function s(e){if("function"!=typeof WeakMap)return null;var t=new WeakMap,r=new WeakMap;return(s=function(e){return e?r:t})(e)}function u(e){return e&&e.__esModule?e:{default:e}}function l(e,t){for(var r=0;r<t.length;r++){var i=t[r];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,(a=i.key,o=void 0,o=function(e,t){if("object"!==n(e)||null===e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var i=r.call(e,t||"default");if("object"!==n(i))return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(a,"string"),"symbol"===n(o)?o:String(o)),i)}var a,o}function c(e,t){return c=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},c(e,t)}function f(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}();return function(){var r,i=h(e);if(t){var a=h(this).constructor;r=Reflect.construct(i,arguments,a)}else r=i.apply(this,arguments);return function(e,t){if(t&&("object"===n(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}(this,r)}}function h(e){return h=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},h(e)}var d=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&c(e,t)}(s,e);var t,r,n,i=f(s);function s(e,t){var r;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,s),(r=i.call(this,e,t)).maxCanvasWidth=t.maxCanvasWidth,r.maxCanvasElementWidth=Math.round(t.maxCanvasWidth/t.pixelRatio),r.hasProgressCanvas=t.waveColor!=t.progressColor,r.halfPixel=.5/t.pixelRatio,r.canvases=[],r.progressWave=null,r.EntryClass=o.default,r.canvasContextAttributes=t.drawingContextAttributes,r.overlap=2*Math.ceil(t.pixelRatio/2),r.barRadius=t.barRadius||0,r.vertical=t.vertical,r}return t=s,r=[{key:"init",value:function(){this.createWrapper(),this.createElements()}},{key:"createElements",value:function(){this.progressWave=a.withOrientation(this.wrapper.appendChild(document.createElement("wave")),this.params.vertical),this.style(this.progressWave,{position:"absolute",zIndex:3,left:0,top:0,bottom:0,overflow:"hidden",width:"0",display:"none",boxSizing:"border-box",borderRightStyle:"solid",pointerEvents:"none"}),this.addCanvas(),this.updateCursor()}},{key:"updateCursor",value:function(){this.style(this.progressWave,{borderRightWidth:this.params.cursorWidth+"px",borderRightColor:this.params.cursorColor})}},{key:"updateSize",value:function(){for(var e=this,t=Math.round(this.width/this.params.pixelRatio),r=Math.ceil(t/(this.maxCanvasElementWidth+this.overlap));this.canvases.length<r;)this.addCanvas();for(;this.canvases.length>r;)this.removeCanvas();var n=this.maxCanvasWidth+this.overlap,i=this.canvases.length-1;this.canvases.forEach((function(t,r){r==i&&(n=e.width-e.maxCanvasWidth*i),e.updateDimensions(t,n,e.height),t.clearWave()}))}},{key:"addCanvas",value:function(){var e=new this.EntryClass;e.canvasContextAttributes=this.canvasContextAttributes,e.hasProgressCanvas=this.hasProgressCanvas,e.halfPixel=this.halfPixel;var t=this.maxCanvasElementWidth*this.canvases.length,r=a.withOrientation(this.wrapper.appendChild(document.createElement("canvas")),this.params.vertical);if(this.style(r,{position:"absolute",zIndex:2,left:t+"px",top:0,bottom:0,height:"100%",pointerEvents:"none"}),e.initWave(r),this.hasProgressCanvas){var n=a.withOrientation(this.progressWave.appendChild(document.createElement("canvas")),this.params.vertical);this.style(n,{position:"absolute",left:t+"px",top:0,bottom:0,height:"100%"}),e.initProgress(n)}this.canvases.push(e)}},{key:"removeCanvas",value:function(){var e=this.canvases[this.canvases.length-1];e.wave.parentElement.removeChild(e.wave.domElement),this.hasProgressCanvas&&e.progress.parentElement.removeChild(e.progress.domElement),e&&(e.destroy(),e=null),this.canvases.pop()}},{key:"updateDimensions",value:function(e,t,r){var n=Math.round(t/this.params.pixelRatio),i=Math.round(this.width/this.params.pixelRatio);e.updateDimensions(n,i,t,r),this.style(this.progressWave,{display:"block"})}},{key:"clearWave",value:function(){var e=this;a.frame((function(){e.canvases.forEach((function(e){return e.clearWave()}))}))()}},{key:"drawBars",value:function(e,t,r,n){var i=this;return this.prepareDraw(e,t,r,n,(function(e){var t=e.absmax,a=e.hasMinVals,o=(e.height,e.offsetY),s=e.halfH,u=e.peaks,l=e.channelIndex;if(void 0!==r)for(var c=a?2:1,f=u.length/c,h=i.params.barWidth*i.params.pixelRatio,d=h+(null===i.params.barGap?Math.max(i.params.pixelRatio,~~(h/2)):Math.max(i.params.pixelRatio,i.params.barGap*i.params.pixelRatio)),p=f/i.width,v=n,y=r;y<v;y+=d){var m=0,b=Math.floor(y*p)*c,g=Math.floor((y+d)*p)*c;do{var A=Math.abs(u[b]);A>m&&(m=A),b+=c}while(b<g);var k=Math.round(m/t*s);i.params.barMinHeight&&(k=Math.max(k,i.params.barMinHeight)),i.fillRect(y+i.halfPixel,s-k+o,h+i.halfPixel,2*k,i.barRadius,l)}}))}},{key:"drawWave",value:function(e,t,r,n){var i=this;return this.prepareDraw(e,t,r,n,(function(e){var t=e.absmax,a=e.hasMinVals,o=(e.height,e.offsetY),s=e.halfH,u=e.peaks,l=e.channelIndex;if(!a){for(var c=[],f=u.length,h=0;h<f;h++)c[2*h]=u[h],c[2*h+1]=-u[h];u=c}void 0!==r&&i.drawLine(u,t,s,o,r,n,l),i.fillRect(0,s+o-i.halfPixel,i.width,i.halfPixel,i.barRadius,l)}))}},{key:"drawLine",value:function(e,t,r,n,i,a,o){var s=this,u=this.params.splitChannelsOptions.channelColors[o]||{},l=u.waveColor,c=u.progressColor;this.canvases.forEach((function(o,u){s.setFillStyles(o,l,c),s.applyCanvasTransforms(o,s.params.vertical),o.drawLines(e,t,r,n,i,a)}))}},{key:"fillRect",value:function(e,t,r,n,i,a){for(var o=Math.floor(e/this.maxCanvasWidth),s=Math.min(Math.ceil((e+r)/this.maxCanvasWidth)+1,this.canvases.length),u=o;u<s;u++){var l=this.canvases[u],c=u*this.maxCanvasWidth,f={x1:Math.max(e,u*this.maxCanvasWidth),y1:t,x2:Math.min(e+r,u*this.maxCanvasWidth+l.wave.width),y2:t+n};if(f.x1<f.x2){var h=this.params.splitChannelsOptions.channelColors[a]||{},d=h.waveColor,p=h.progressColor;this.setFillStyles(l,d,p),this.applyCanvasTransforms(l,this.params.vertical),l.fillRects(f.x1-c,f.y1,f.x2-f.x1,f.y2-f.y1,i)}}}},{key:"hideChannel",value:function(e){return this.params.splitChannels&&this.params.splitChannelsOptions.filterChannels.includes(e)}},{key:"prepareDraw",value:function(e,t,r,n,i,o,s){var u=this;return a.frame((function(){if(e[0]instanceof Array){var l=e;if(u.params.splitChannels){var c,f=l.filter((function(e,t){return!u.hideChannel(t)}));return u.params.splitChannelsOptions.overlay||u.setHeight(Math.max(f.length,1)*u.params.height*u.params.pixelRatio),u.params.splitChannelsOptions&&u.params.splitChannelsOptions.relativeNormalization&&(c=a.max(l.map((function(e){return a.absMax(e)})))),l.forEach((function(e,t){return u.prepareDraw(e,t,r,n,i,f.indexOf(e),c)}))}e=l[0]}if(!u.hideChannel(t)){var h=1/u.params.barHeight;u.params.normalize&&(h=void 0===s?a.absMax(e):s);var d=[].some.call(e,(function(e){return e<0})),p=u.params.height*u.params.pixelRatio,v=p/2,y=p*o||0;return u.params.splitChannelsOptions&&u.params.splitChannelsOptions.overlay&&(y=0),i({absmax:h,hasMinVals:d,height:p,offsetY:y,halfH:v,peaks:e,channelIndex:t})}}))()}},{key:"setFillStyles",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.params.waveColor,r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.params.progressColor;e.setFillStyles(t,r)}},{key:"applyCanvasTransforms",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1];e.applyCanvasTransforms(t)}},{key:"getImage",value:function(e,t,r){if("blob"===r)return Promise.all(this.canvases.map((function(n){return n.getImage(e,t,r)})));if("dataURL"===r){var n=this.canvases.map((function(n){return n.getImage(e,t,r)}));return n.length>1?n:n[0]}}},{key:"updateProgress",value:function(e){this.style(this.progressWave,{width:e+"px"})}}],r&&l(t.prototype,r),n&&l(t,n),Object.defineProperty(t,"prototype",{writable:!1}),s}(i.default);t.default=d,e.exports=t.default},328:(e,t,r)=>{"use strict";function n(e){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},n(e)}var i;function a(e,t){for(var r=0;r<t.length;r++){var i=t[r];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,(a=i.key,o=void 0,o=function(e,t){if("object"!==n(e)||null===e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var i=r.call(e,t||"default");if("object"!==n(i))return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(a,"string"),"symbol"===n(o)?o:String(o)),i)}var a,o}function o(){return o="undefined"!=typeof Reflect&&Reflect.get?Reflect.get.bind():function(e,t,r){var n=function(e,t){for(;!Object.prototype.hasOwnProperty.call(e,t)&&null!==(e=l(e)););return e}(e,t);if(n){var i=Object.getOwnPropertyDescriptor(n,t);return i.get?i.get.call(arguments.length<3?e:r):i.value}},o.apply(this,arguments)}function s(e,t){return s=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},s(e,t)}function u(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}();return function(){var r,i=l(e);if(t){var a=l(this).constructor;r=Reflect.construct(i,arguments,a)}else r=i.apply(this,arguments);return function(e,t){if(t&&("object"===n(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}(this,r)}}function l(e){return l=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},l(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var c=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&s(e,t)}(c,e);var t,r,n,i=u(c);function c(e){var t;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,c),(t=i.call(this,e)).params=e,t.sourceMediaElement=null,t}return t=c,(r=[{key:"init",value:function(){this.setPlaybackRate(this.params.audioRate),this.createTimer(),this.createVolumeNode(),this.createScriptNode(),this.createAnalyserNode()}},{key:"_load",value:function(e,t,r){o(l(c.prototype),"_load",this).call(this,e,t,r),this.createMediaElementSource(e)}},{key:"createMediaElementSource",value:function(e){this.sourceMediaElement=this.ac.createMediaElementSource(e),this.sourceMediaElement.connect(this.analyser)}},{key:"play",value:function(e,t){return this.resumeAudioContext(),o(l(c.prototype),"play",this).call(this,e,t)}},{key:"destroy",value:function(){o(l(c.prototype),"destroy",this).call(this),this.destroyWebAudio()}}])&&a(t.prototype,r),n&&a(t,n),Object.defineProperty(t,"prototype",{writable:!1}),c}(((i=r(743))&&i.__esModule?i:{default:i}).default);t.default=c,e.exports=t.default},743:(e,t,r)=>{"use strict";function n(e){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},n(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var i,a=(i=r(379))&&i.__esModule?i:{default:i},o=function(e,t){if(!t&&e&&e.__esModule)return e;if(null===e||"object"!==n(e)&&"function"!=typeof e)return{default:e};var r=s(t);if(r&&r.has(e))return r.get(e);var i={},a=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if("default"!==o&&Object.prototype.hasOwnProperty.call(e,o)){var u=a?Object.getOwnPropertyDescriptor(e,o):null;u&&(u.get||u.set)?Object.defineProperty(i,o,u):i[o]=e[o]}return i.default=e,r&&r.set(e,i),i}(r(241));function s(e){if("function"!=typeof WeakMap)return null;var t=new WeakMap,r=new WeakMap;return(s=function(e){return e?r:t})(e)}function u(e,t){for(var r=0;r<t.length;r++){var i=t[r];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,(a=i.key,o=void 0,o=function(e,t){if("object"!==n(e)||null===e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var i=r.call(e,t||"default");if("object"!==n(i))return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(a,"string"),"symbol"===n(o)?o:String(o)),i)}var a,o}function l(){return l="undefined"!=typeof Reflect&&Reflect.get?Reflect.get.bind():function(e,t,r){var n=function(e,t){for(;!Object.prototype.hasOwnProperty.call(e,t)&&null!==(e=h(e)););return e}(e,t);if(n){var i=Object.getOwnPropertyDescriptor(n,t);return i.get?i.get.call(arguments.length<3?e:r):i.value}},l.apply(this,arguments)}function c(e,t){return c=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},c(e,t)}function f(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}();return function(){var r,i=h(e);if(t){var a=h(this).constructor;r=Reflect.construct(i,arguments,a)}else r=i.apply(this,arguments);return function(e,t){if(t&&("object"===n(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}(this,r)}}function h(e){return h=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},h(e)}var d=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&c(e,t)}(a,e);var t,r,n,i=f(a);function a(e){var t;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,a),(t=i.call(this,e)).params=e,t.media={currentTime:0,duration:0,paused:!0,playbackRate:1,play:function(){},pause:function(){},volume:0},t.mediaType=e.mediaType.toLowerCase(),t.elementPosition=e.elementPosition,t.peaks=null,t.playbackRate=1,t.volume=1,t.isMuted=!1,t.buffer=null,t.onPlayEnd=null,t.mediaListeners={},t}return t=a,(r=[{key:"init",value:function(){this.setPlaybackRate(this.params.audioRate),this.createTimer()}},{key:"_setupMediaListeners",value:function(){var e=this;this.mediaListeners.error=function(){e.fireEvent("error","Error loading media element")},this.mediaListeners.waiting=function(){e.fireEvent("waiting")},this.mediaListeners.canplay=function(){e.fireEvent("canplay")},this.mediaListeners.ended=function(){e.fireEvent("finish")},this.mediaListeners.play=function(){e.fireEvent("play")},this.mediaListeners.pause=function(){e.fireEvent("pause")},this.mediaListeners.seeked=function(t){e.fireEvent("seek")},this.mediaListeners.volumechange=function(t){e.isMuted=e.media.muted,e.isMuted?e.volume=0:e.volume=e.media.volume,e.fireEvent("volume")},Object.keys(this.mediaListeners).forEach((function(t){e.media.removeEventListener(t,e.mediaListeners[t]),e.media.addEventListener(t,e.mediaListeners[t])}))}},{key:"createTimer",value:function(){var e=this;this.on("play",(function t(){e.isPaused()||(e.fireEvent("audioprocess",e.getCurrentTime()),o.frame(t)())})),this.on("pause",(function(){e.fireEvent("audioprocess",e.getCurrentTime())}))}},{key:"load",value:function(e,t,r,n){var i=document.createElement(this.mediaType);i.controls=this.params.mediaControls,i.autoplay=this.params.autoplay||!1,i.preload=null==n?"auto":n,i.src=e,i.style.width="100%";var a=t.querySelector(this.mediaType);a&&t.removeChild(a),t.appendChild(i),this._load(i,r,n)}},{key:"loadElt",value:function(e,t){e.controls=this.params.mediaControls,e.autoplay=this.params.autoplay||!1,this._load(e,t,e.preload)}},{key:"_load",value:function(e,t,r){if(!(e instanceof HTMLMediaElement)||void 0===e.addEventListener)throw new Error("media parameter is not a valid media element");"function"!=typeof e.load||t&&"none"==r||e.load(),this.media=e,this._setupMediaListeners(),this.peaks=t,this.onPlayEnd=null,this.buffer=null,this.isMuted=e.muted,this.setPlaybackRate(this.playbackRate),this.setVolume(this.volume)}},{key:"isPaused",value:function(){return!this.media||this.media.paused}},{key:"getDuration",value:function(){if(this.explicitDuration)return this.explicitDuration;var e=(this.buffer||this.media).duration;return e>=1/0&&(e=this.media.seekable.end(0)),e}},{key:"getCurrentTime",value:function(){return this.media&&this.media.currentTime}},{key:"getPlayedPercents",value:function(){return this.getCurrentTime()/this.getDuration()||0}},{key:"getPlaybackRate",value:function(){return this.playbackRate||this.media.playbackRate}},{key:"setPlaybackRate",value:function(e){this.playbackRate=e||1,this.media.playbackRate=this.playbackRate}},{key:"seekTo",value:function(e){null==e||isNaN(e)||(this.media.currentTime=e),this.clearPlayEnd()}},{key:"play",value:function(e,t){this.seekTo(e);var r=this.media.play();return t&&this.setPlayEnd(t),r}},{key:"pause",value:function(){var e;return this.media&&(e=this.media.pause()),this.clearPlayEnd(),e}},{key:"setPlayEnd",value:function(e){var t=this;this.clearPlayEnd(),this._onPlayEnd=function(r){r>=e&&(t.pause(),t.seekTo(e))},this.on("audioprocess",this._onPlayEnd)}},{key:"clearPlayEnd",value:function(){this._onPlayEnd&&(this.un("audioprocess",this._onPlayEnd),this._onPlayEnd=null)}},{key:"getPeaks",value:function(e,t,r){return this.buffer?l(h(a.prototype),"getPeaks",this).call(this,e,t,r):this.peaks||[]}},{key:"setSinkId",value:function(e){return e?this.media.setSinkId?this.media.setSinkId(e):Promise.reject(new Error("setSinkId is not supported in your browser")):Promise.reject(new Error("Invalid deviceId: "+e))}},{key:"getVolume",value:function(){return this.volume}},{key:"setVolume",value:function(e){this.volume=e,this.media.volume!==this.volume&&(this.media.volume=this.volume)}},{key:"setMute",value:function(e){this.isMuted=this.media.muted=e}},{key:"destroy",value:function(){var e=this;this.pause(),this.unAll(),this.destroyed=!0,Object.keys(this.mediaListeners).forEach((function(t){e.media&&e.media.removeEventListener(t,e.mediaListeners[t])})),this.params.removeMediaElementOnDestroy&&this.media&&this.media.parentNode&&this.media.parentNode.removeChild(this.media),this.media=null}}])&&u(t.prototype,r),n&&u(t,n),Object.defineProperty(t,"prototype",{writable:!1}),a}(a.default);t.default=d,e.exports=t.default},227:(e,t)=>{"use strict";function r(e){return r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},r(e)}function n(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,(a=i.key,o=void 0,o=function(e,t){if("object"!==r(e)||null===e)return e;var n=e[Symbol.toPrimitive];if(void 0!==n){var i=n.call(e,t||"default");if("object"!==r(i))return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(a,"string"),"symbol"===r(o)?o:String(o)),i)}var a,o}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var i=function(){function e(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.clearPeakCache()}var t,r,i;return t=e,(r=[{key:"clearPeakCache",value:function(){this.peakCacheRanges=[],this.peakCacheLength=-1}},{key:"addRangeToPeakCache",value:function(e,t,r){e!=this.peakCacheLength&&(this.clearPeakCache(),this.peakCacheLength=e);for(var n=[],i=0;i<this.peakCacheRanges.length&&this.peakCacheRanges[i]<t;)i++;for(i%2==0&&n.push(t);i<this.peakCacheRanges.length&&this.peakCacheRanges[i]<=r;)n.push(this.peakCacheRanges[i]),i++;i%2==0&&n.push(r),n=n.filter((function(e,t,r){return 0==t?e!=r[t+1]:t==r.length-1?e!=r[t-1]:e!=r[t-1]&&e!=r[t+1]})),this.peakCacheRanges=this.peakCacheRanges.concat(n),this.peakCacheRanges=this.peakCacheRanges.sort((function(e,t){return e-t})).filter((function(e,t,r){return 0==t?e!=r[t+1]:t==r.length-1?e!=r[t-1]:e!=r[t-1]&&e!=r[t+1]}));var a=[];for(i=0;i<n.length;i+=2)a.push([n[i],n[i+1]]);return a}},{key:"getCacheRanges",value:function(){var e,t=[];for(e=0;e<this.peakCacheRanges.length;e+=2)t.push([this.peakCacheRanges[e],this.peakCacheRanges[e+1]]);return t}}])&&n(t.prototype,r),i&&n(t,i),Object.defineProperty(t,"prototype",{writable:!1}),e}();t.default=i,e.exports=t.default},765:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(e){var t=(0,n.default)(e),r=(0,i.default)(e);return-r>t?-r:t};var n=a(r(178)),i=a(r(706));function a(e){return e&&e.__esModule?e:{default:e}}e.exports=t.default},694:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(e,t,r){return Math.min(Math.max(t,e),r)},e.exports=t.default},342:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(e){if(!e)throw new Error("fetch options missing");if(!e.url)throw new Error("fetch url missing");var t=new i.default,r=new Headers,n=new Request(e.url);t.controller=new AbortController,e&&e.requestHeaders&&e.requestHeaders.forEach((function(e){r.append(e.key,e.value)}));var a=e.responseType||"json",o={method:e.method||"GET",headers:r,mode:e.mode||"cors",credentials:e.credentials||"same-origin",cache:e.cache||"default",redirect:e.redirect||"follow",referrer:e.referrer||"client",signal:t.controller.signal};return fetch(n,o).then((function(e){t.response=e;var r=!0;e.body||(r=!1);var n=e.headers.get("content-length");return null===n&&(r=!1),r?(t.onProgress=function(e){t.fireEvent("progress",e)},new Response(new ReadableStream(new s(t,n,e)),o)):e})).then((function(e){var t;if(e.ok)switch(a){case"arraybuffer":return e.arrayBuffer();case"json":return e.json();case"blob":return e.blob();case"text":return e.text();default:t="Unknown responseType: "+a}throw t||(t="HTTP error status: "+e.status),new Error(t)})).then((function(e){t.fireEvent("success",e)})).catch((function(e){t.fireEvent("error",e)})),t.fetchRequest=n,t};var n,i=(n=r(399))&&n.__esModule?n:{default:n};function a(e){return a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},a(e)}function o(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,(i=n.key,o=void 0,o=function(e,t){if("object"!==a(e)||null===e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var n=r.call(e,t||"default");if("object"!==a(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(i,"string"),"symbol"===a(o)?o:String(o)),n)}var i,o}var s=function(){function e(t,r,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.instance=t,this.instance._reader=n.body.getReader(),this.total=parseInt(r,10),this.loaded=0}var t,r,n;return t=e,(r=[{key:"start",value:function(e){var t=this;!function r(){t.instance._reader.read().then((function(n){var i=n.done,a=n.value;if(i)return 0===t.total&&t.instance.onProgress.call(t.instance,{loaded:t.loaded,total:t.total,lengthComputable:!1}),void e.close();t.loaded+=a.byteLength,t.instance.onProgress.call(t.instance,{loaded:t.loaded,total:t.total,lengthComputable:!(0===t.total)}),e.enqueue(a),r()})).catch((function(t){e.error(t)}))}()}}])&&o(t.prototype,r),n&&o(t,n),Object.defineProperty(t,"prototype",{writable:!1}),e}();e.exports=t.default},412:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(e){return function(){for(var t=arguments.length,r=new Array(t),n=0;n<t;n++)r[n]=arguments[n];return(0,i.default)((function(){return e.apply(void 0,r)}))}};var n,i=(n=r(779))&&n.__esModule?n:{default:n};e.exports=t.default},56:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(e){return void 0===e&&(e="wavesurfer_"),e+Math.random().toString(32).substring(2)},e.exports=t.default},241:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"Observer",{enumerable:!0,get:function(){return s.default}}),Object.defineProperty(t,"absMax",{enumerable:!0,get:function(){return o.default}}),Object.defineProperty(t,"clamp",{enumerable:!0,get:function(){return p.default}}),Object.defineProperty(t,"debounce",{enumerable:!0,get:function(){return f.default}}),Object.defineProperty(t,"fetchFile",{enumerable:!0,get:function(){return d.default}}),Object.defineProperty(t,"frame",{enumerable:!0,get:function(){return c.default}}),Object.defineProperty(t,"getId",{enumerable:!0,get:function(){return n.default}}),Object.defineProperty(t,"ignoreSilenceMode",{enumerable:!0,get:function(){return y.default}}),Object.defineProperty(t,"max",{enumerable:!0,get:function(){return i.default}}),Object.defineProperty(t,"min",{enumerable:!0,get:function(){return a.default}}),Object.defineProperty(t,"preventClick",{enumerable:!0,get:function(){return h.default}}),Object.defineProperty(t,"requestAnimationFrame",{enumerable:!0,get:function(){return l.default}}),Object.defineProperty(t,"style",{enumerable:!0,get:function(){return u.default}}),Object.defineProperty(t,"withOrientation",{enumerable:!0,get:function(){return v.default}});var n=m(r(56)),i=m(r(178)),a=m(r(706)),o=m(r(765)),s=m(r(399)),u=m(r(138)),l=m(r(779)),c=m(r(412)),f=m(r(296)),h=m(r(529)),d=m(r(342)),p=m(r(694)),v=m(r(713)),y=m(r(457));function m(e){return e&&e.__esModule?e:{default:e}}},178:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(e){var t=-1/0;return Object.keys(e).forEach((function(r){e[r]>t&&(t=e[r])})),t},e.exports=t.default},706:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(e){var t=Number(1/0);return Object.keys(e).forEach((function(r){e[r]<t&&(t=e[r])})),t},e.exports=t.default},399:(e,t)=>{"use strict";function r(e){return r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},r(e)}function n(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,(a=i.key,o=void 0,o=function(e,t){if("object"!==r(e)||null===e)return e;var n=e[Symbol.toPrimitive];if(void 0!==n){var i=n.call(e,t||"default");if("object"!==r(i))return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(a,"string"),"symbol"===r(o)?o:String(o)),i)}var a,o}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var i=function(){function e(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this._disabledEventEmissions=[],this.handlers=null}var t,r,i;return t=e,r=[{key:"on",value:function(e,t){var r=this;this.handlers||(this.handlers={});var n=this.handlers[e];return n||(n=this.handlers[e]=[]),n.push(t),{name:e,callback:t,un:function(e,t){return r.un(e,t)}}}},{key:"un",value:function(e,t){if(this.handlers){var r,n=this.handlers[e];if(n)if(t)for(r=n.length-1;r>=0;r--)n[r]==t&&n.splice(r,1);else n.length=0}}},{key:"unAll",value:function(){this.handlers=null}},{key:"once",value:function(e,t){var r=this;return this.on(e,(function n(){for(var i=arguments.length,a=new Array(i),o=0;o<i;o++)a[o]=arguments[o];t.apply(r,a),setTimeout((function(){r.un(e,n)}),0)}))}},{key:"setDisabledEventEmissions",value:function(e){this._disabledEventEmissions=e}},{key:"_isDisabledEventEmission",value:function(e){return this._disabledEventEmissions&&this._disabledEventEmissions.includes(e)}},{key:"fireEvent",value:function(e){for(var t=arguments.length,r=new Array(t>1?t-1:0),n=1;n<t;n++)r[n-1]=arguments[n];if(this.handlers&&!this._isDisabledEventEmission(e)){var i=this.handlers[e];i&&i.forEach((function(e){e.apply(void 0,r)}))}}}],r&&n(t.prototype,r),i&&n(t,i),Object.defineProperty(t,"prototype",{writable:!1}),e}();t.default=i,e.exports=t.default},713:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function e(t,r){return t[i]?t:new Proxy(t,{get:function(t,a,o){if(a===i)return!0;if("domElement"===a)return t;if("style"===a)return e(t.style,r);if("canvas"===a)return e(t.canvas,r);if("getBoundingClientRect"===a)return function(){return e(t.getBoundingClientRect.apply(t,arguments),r)};if("getContext"===a)return function(){return e(t.getContext.apply(t,arguments),r)};var s=t[n(a,r)];return"function"==typeof s?s.bind(t):s},set:function(e,t,i){return e[n(t,r)]=i,!0}})};var r={width:"height",height:"width",overflowX:"overflowY",overflowY:"overflowX",clientWidth:"clientHeight",clientHeight:"clientWidth",clientX:"clientY",clientY:"clientX",scrollWidth:"scrollHeight",scrollLeft:"scrollTop",offsetLeft:"offsetTop",offsetTop:"offsetLeft",offsetHeight:"offsetWidth",offsetWidth:"offsetHeight",left:"top",right:"bottom",top:"left",bottom:"right",borderRightStyle:"borderBottomStyle",borderRightWidth:"borderBottomWidth",borderRightColor:"borderBottomColor"};function n(e,t){return Object.prototype.hasOwnProperty.call(r,e)&&t?r[e]:e}var i=Symbol("isProxy");e.exports=t.default},529:(e,t)=>{"use strict";function r(e){e.stopPropagation(),document.body.removeEventListener("click",r,!0)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(e){document.body.addEventListener("click",r,!0)},e.exports=t.default},779:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=(window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(e,t){return setTimeout(e,1e3/60)}).bind(window);t.default=r,e.exports=t.default},457:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(){var e=new AudioContext,t=e.createBufferSource();t.buffer=e.createBuffer(1,1,44100),t.connect(e.destination),t.start();var r=document.createElement("div");r.innerHTML='<audio x-webkit-airplay="deny"></audio>';var n=r.children.item(0);n.src="data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////8AAABhTEFNRTMuMTAwA8MAAAAAAAAAABQgJAUHQQAB9AAAAnGMHkkIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADgnABGiAAQBCqgCRMAAgEAH///////////////7+n/9FTuQsQH//////2NG0jWUGlio5gLQTOtIoeR2WX////X4s9Atb/JRVCbBUpeRUq//////////////////9RUi0f2jn/+xDECgPCjAEQAABN4AAANIAAAAQVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==",n.preload="auto",n.type="audio/mpeg",n.disableRemotePlayback=!0,n.play(),n.remove(),r.remove()},e.exports=t.default},138:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=function(e,t){return Object.keys(t).forEach((function(r){e.style[r]!==t[r]&&(e.style[r]=t[r])})),e},e.exports=t.default},631:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var n=function(e,t){if(!t&&e&&e.__esModule)return e;if(null===e||"object"!==m(e)&&"function"!=typeof e)return{default:e};var r=c(t);if(r&&r.has(e))return r.get(e);var n={},i=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var a in e)if("default"!==a&&Object.prototype.hasOwnProperty.call(e,a)){var o=i?Object.getOwnPropertyDescriptor(e,a):null;o&&(o.get||o.set)?Object.defineProperty(n,a,o):n[a]=e[a]}return n.default=e,r&&r.set(e,n),n}(r(241)),i=l(r(646)),a=l(r(379)),o=l(r(743)),s=l(r(227)),u=l(r(328));function l(e){return e&&e.__esModule?e:{default:e}}function c(e){if("function"!=typeof WeakMap)return null;var t=new WeakMap,r=new WeakMap;return(c=function(e){return e?r:t})(e)}function f(e,t){return f=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},f(e,t)}function h(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}();return function(){var r,n=v(e);if(t){var i=v(this).constructor;r=Reflect.construct(n,arguments,i)}else r=n.apply(this,arguments);return d(this,r)}}function d(e,t){if(t&&("object"===m(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return p(e)}function p(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function v(e){return v=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},v(e)}function y(e,t,r){return(t=k(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function m(e){return m="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},m(e)}function b(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function g(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,k(n.key),n)}}function A(e,t,r){return t&&g(e.prototype,t),r&&g(e,r),Object.defineProperty(e,"prototype",{writable:!1}),e}function k(e){var t=function(e,t){if("object"!==m(e)||null===e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var n=r.call(e,t||"default");if("object"!==m(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(e,"string");return"symbol"===m(t)?t:String(t)}var w=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&f(e,t)}(r,e);var t=h(r);function r(e){var s;if(b(this,r),y(p(s=t.call(this)),"defaultParams",{audioContext:null,audioScriptProcessor:null,audioRate:1,autoCenter:!0,autoCenterRate:5,autoCenterImmediately:!1,backend:"WebAudio",backgroundColor:null,barHeight:1,barRadius:0,barGap:null,barMinHeight:null,container:null,cursorColor:"#333",cursorWidth:1,dragSelection:!0,drawingContextAttributes:{desynchronized:!1},duration:null,fillParent:!0,forceDecode:!1,height:128,hideScrollbar:!1,hideCursor:!1,ignoreSilenceMode:!1,interact:!0,loopSelection:!0,maxCanvasWidth:4e3,mediaContainer:null,mediaControls:!1,mediaType:"audio",minPxPerSec:20,normalize:!1,partialRender:!1,pixelRatio:window.devicePixelRatio||screen.deviceXDPI/screen.logicalXDPI,plugins:[],progressColor:"#555",removeMediaElementOnDestroy:!0,renderer:i.default,responsive:!1,rtl:!1,scrollParent:!1,skipLength:2,splitChannels:!1,splitChannelsOptions:{overlay:!1,channelColors:{},filterChannels:[],relativeNormalization:!1,splitDragSelection:!1},vertical:!1,waveColor:"#999",xhr:{}}),y(p(s),"backends",{MediaElement:o.default,WebAudio:a.default,MediaElementWebAudio:u.default}),y(p(s),"util",n),s.params=Object.assign({},s.defaultParams,e),s.params.splitChannelsOptions=Object.assign({},s.defaultParams.splitChannelsOptions,e.splitChannelsOptions),s.container="string"==typeof e.container?document.querySelector(s.params.container):s.params.container,!s.container)throw new Error("Container element not found");if(null==s.params.mediaContainer?s.mediaContainer=s.container:"string"==typeof s.params.mediaContainer?s.mediaContainer=document.querySelector(s.params.mediaContainer):s.mediaContainer=s.params.mediaContainer,!s.mediaContainer)throw new Error("Media Container element not found");if(s.params.maxCanvasWidth<=1)throw new Error("maxCanvasWidth must be greater than 1");if(s.params.maxCanvasWidth%2==1)throw new Error("maxCanvasWidth must be an even number");if(!0===s.params.rtl&&(!0===s.params.vertical?n.style(s.container,{transform:"rotateX(180deg)"}):n.style(s.container,{transform:"rotateY(180deg)"})),s.params.backgroundColor&&s.setBackgroundColor(s.params.backgroundColor),s.savedVolume=0,s.isMuted=!1,s.tmpEvents=[],s.currentRequest=null,s.arraybuffer=null,s.drawer=null,s.backend=null,s.peakCache=null,"function"!=typeof s.params.renderer)throw new Error("Renderer parameter is invalid");s.Drawer=s.params.renderer,"AudioElement"==s.params.backend&&(s.params.backend="MediaElement"),"WebAudio"!=s.params.backend&&"MediaElementWebAudio"!==s.params.backend||a.default.prototype.supportsWebAudio.call(null)||(s.params.backend="MediaElement"),s.Backend=s.backends[s.params.backend],s.initialisedPluginList={},s.isDestroyed=!1,s.isReady=!1;var l=0;return s._onResize=n.debounce((function(){s.drawer.wrapper&&l!=s.drawer.wrapper.clientWidth&&!s.params.scrollParent&&(l=s.drawer.wrapper.clientWidth)&&s.drawer.fireEvent("redraw")}),"number"==typeof s.params.responsive?s.params.responsive:100),d(s,p(s))}return A(r,[{key:"init",value:function(){return this.registerPlugins(this.params.plugins),this.createDrawer(),this.createBackend(),this.createPeakCache(),this}},{key:"registerPlugins",value:function(e){var t=this;return e.forEach((function(e){return t.addPlugin(e)})),e.forEach((function(e){e.deferInit||t.initPlugin(e.name)})),this.fireEvent("plugins-registered",e),this}},{key:"getActivePlugins",value:function(){return this.initialisedPluginList}},{key:"addPlugin",value:function(e){var t=this;if(!e.name)throw new Error("Plugin does not have a name!");if(!e.instance)throw new Error("Plugin ".concat(e.name," does not have an instance property!"));e.staticProps&&Object.keys(e.staticProps).forEach((function(r){t[r]=e.staticProps[r]}));var r=e.instance;return Object.getOwnPropertyNames(n.Observer.prototype).forEach((function(e){r.prototype[e]=n.Observer.prototype[e]})),this[e.name]=new r(e.params||{},this),this.fireEvent("plugin-added",e.name),this}},{key:"initPlugin",value:function(e){if(!this[e])throw new Error("Plugin ".concat(e," has not been added yet!"));return this.initialisedPluginList[e]&&this.destroyPlugin(e),this[e].init(),this.initialisedPluginList[e]=!0,this.fireEvent("plugin-initialised",e),this}},{key:"destroyPlugin",value:function(e){if(!this[e])throw new Error("Plugin ".concat(e," has not been added yet and cannot be destroyed!"));if(!this.initialisedPluginList[e])throw new Error("Plugin ".concat(e," is not active and cannot be destroyed!"));if("function"!=typeof this[e].destroy)throw new Error("Plugin ".concat(e," does not have a destroy function!"));return this[e].destroy(),delete this.initialisedPluginList[e],this.fireEvent("plugin-destroyed",e),this}},{key:"destroyAllPlugins",value:function(){var e=this;Object.keys(this.initialisedPluginList).forEach((function(t){return e.destroyPlugin(t)}))}},{key:"createDrawer",value:function(){var e=this;this.drawer=new this.Drawer(this.container,this.params),this.drawer.init(),this.fireEvent("drawer-created",this.drawer),!1!==this.params.responsive&&(window.addEventListener("resize",this._onResize,!0),window.addEventListener("orientationchange",this._onResize,!0)),this.drawer.on("redraw",(function(){e.drawBuffer(),e.drawer.progress(e.backend.getPlayedPercents())})),this.drawer.on("click",(function(t,r){setTimeout((function(){return e.seekTo(r)}),0)})),this.drawer.on("scroll",(function(t){e.params.partialRender&&e.drawBuffer(),e.fireEvent("scroll",t)})),this.drawer.on("dblclick",(function(t,r){e.fireEvent("dblclick",t,r)}))}},{key:"createBackend",value:function(){var e=this;this.backend&&this.backend.destroy(),this.backend=new this.Backend(this.params),this.backend.init(),this.fireEvent("backend-created",this.backend),this.backend.on("finish",(function(){e.drawer.progress(e.backend.getPlayedPercents()),e.fireEvent("finish")})),this.backend.on("play",(function(){return e.fireEvent("play")})),this.backend.on("pause",(function(){return e.fireEvent("pause")})),this.backend.on("audioprocess",(function(t){e.drawer.progress(e.backend.getPlayedPercents()),e.fireEvent("audioprocess",t)})),"MediaElement"!==this.params.backend&&"MediaElementWebAudio"!==this.params.backend||(this.backend.on("seek",(function(){e.drawer.progress(e.backend.getPlayedPercents())})),this.backend.on("volume",(function(){var t=e.getVolume();e.fireEvent("volume",t),e.backend.isMuted!==e.isMuted&&(e.isMuted=e.backend.isMuted,e.fireEvent("mute",e.isMuted))})))}},{key:"createPeakCache",value:function(){this.params.partialRender&&(this.peakCache=new s.default)}},{key:"getDuration",value:function(){return this.backend.getDuration()}},{key:"getCurrentTime",value:function(){return this.backend.getCurrentTime()}},{key:"setCurrentTime",value:function(e){e>=this.getDuration()?this.seekTo(1):this.seekTo(e/this.getDuration())}},{key:"play",value:function(e,t){var r=this;return this.params.ignoreSilenceMode&&n.ignoreSilenceMode(),this.fireEvent("interaction",(function(){return r.play(e,t)})),this.backend.play(e,t)}},{key:"setPlayEnd",value:function(e){this.backend.setPlayEnd(e)}},{key:"pause",value:function(){if(!this.backend.isPaused())return this.backend.pause()}},{key:"playPause",value:function(){return this.backend.isPaused()?this.play():this.pause()}},{key:"isPlaying",value:function(){return!this.backend.isPaused()}},{key:"skipBackward",value:function(e){this.skip(-e||-this.params.skipLength)}},{key:"skipForward",value:function(e){this.skip(e||this.params.skipLength)}},{key:"skip",value:function(e){var t=this.getDuration()||1,r=this.getCurrentTime()||0;r=Math.max(0,Math.min(t,r+(e||0))),this.seekAndCenter(r/t)}},{key:"seekAndCenter",value:function(e){this.seekTo(e),this.drawer.recenter(e)}},{key:"seekTo",value:function(e){var t=this;if("number"!=typeof e||!isFinite(e)||e<0||e>1)throw new Error("Error calling wavesurfer.seekTo, parameter must be a number between 0 and 1!");this.fireEvent("interaction",(function(){return t.seekTo(e)}));var r="WebAudio"===this.params.backend,n=this.backend.isPaused();r&&!n&&this.backend.pause();var i=this.params.scrollParent;this.params.scrollParent=!1,this.backend.seekTo(e*this.getDuration()),this.drawer.progress(e),r&&!n&&this.backend.play(),this.params.scrollParent=i,this.fireEvent("seek",e)}},{key:"stop",value:function(){this.pause(),this.seekTo(0),this.drawer.progress(0)}},{key:"setSinkId",value:function(e){return this.backend.setSinkId(e)}},{key:"setVolume",value:function(e){!0!==this.isMuted?(this.backend.setVolume(e),this.fireEvent("volume",e)):this.savedVolume=e}},{key:"getVolume",value:function(){return this.backend.getVolume()}},{key:"setPlaybackRate",value:function(e){this.backend.setPlaybackRate(e)}},{key:"getPlaybackRate",value:function(){return this.backend.getPlaybackRate()}},{key:"toggleMute",value:function(){this.setMute(!this.isMuted)}},{key:"setMute",value:function(e){e!==this.isMuted?(this.backend.setMute?(this.backend.setMute(e),this.isMuted=e):e?(this.savedVolume=this.backend.getVolume(),this.backend.setVolume(0),this.isMuted=!0,this.fireEvent("volume",0)):(this.backend.setVolume(this.savedVolume),this.isMuted=!1,this.fireEvent("volume",this.savedVolume)),this.fireEvent("mute",this.isMuted)):this.fireEvent("mute",this.isMuted)}},{key:"getMute",value:function(){return this.isMuted}},{key:"getFilters",value:function(){return this.backend.filters||[]}},{key:"toggleScroll",value:function(){this.params.scrollParent=!this.params.scrollParent,this.drawBuffer()}},{key:"toggleInteraction",value:function(){this.params.interact=!this.params.interact}},{key:"getWaveColor",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null;return this.params.splitChannelsOptions.channelColors[e]?this.params.splitChannelsOptions.channelColors[e].waveColor:this.params.waveColor}},{key:"setWaveColor",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;this.params.splitChannelsOptions.channelColors[t]?this.params.splitChannelsOptions.channelColors[t].waveColor=e:this.params.waveColor=e,this.drawBuffer()}},{key:"getProgressColor",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null;return this.params.splitChannelsOptions.channelColors[e]?this.params.splitChannelsOptions.channelColors[e].progressColor:this.params.progressColor}},{key:"setProgressColor",value:function(e,t){this.params.splitChannelsOptions.channelColors[t]?this.params.splitChannelsOptions.channelColors[t].progressColor=e:this.params.progressColor=e,this.drawBuffer()}},{key:"getBackgroundColor",value:function(){return this.params.backgroundColor}},{key:"setBackgroundColor",value:function(e){this.params.backgroundColor=e,n.style(this.container,{background:this.params.backgroundColor})}},{key:"getCursorColor",value:function(){return this.params.cursorColor}},{key:"setCursorColor",value:function(e){this.params.cursorColor=e,this.drawer.updateCursor()}},{key:"getHeight",value:function(){return this.params.height}},{key:"setHeight",value:function(e){this.params.height=e,this.drawer.setHeight(e*this.params.pixelRatio),this.drawBuffer()}},{key:"setFilteredChannels",value:function(e){this.params.splitChannelsOptions.filterChannels=e,this.drawBuffer()}},{key:"drawBuffer",value:function(){var e,t=Math.round(this.getDuration()*this.params.minPxPerSec*this.params.pixelRatio),r=this.drawer.getWidth(),n=t,i=0,a=Math.max(i+r,n);if(this.params.fillParent&&(!this.params.scrollParent||t<r)&&(i=0,a=n=r),this.params.partialRender){var o,s=this.peakCache.addRangeToPeakCache(n,i,a);for(o=0;o<s.length;o++)e=this.backend.getPeaks(n,s[o][0],s[o][1]),this.drawer.drawPeaks(e,n,s[o][0],s[o][1])}else e=this.backend.getPeaks(n,i,a),this.drawer.drawPeaks(e,n,i,a);this.fireEvent("redraw",e,n)}},{key:"zoom",value:function(e){e?(this.params.minPxPerSec=e,this.params.scrollParent=!0):(this.params.minPxPerSec=this.defaultParams.minPxPerSec,this.params.scrollParent=!1),this.drawBuffer(),this.drawer.progress(this.backend.getPlayedPercents()),this.drawer.recenter(this.getCurrentTime()/this.getDuration()),this.fireEvent("zoom",e)}},{key:"loadArrayBuffer",value:function(e){var t=this;this.decodeArrayBuffer(e,(function(e){t.isDestroyed||t.loadDecodedBuffer(e)}))}},{key:"loadDecodedBuffer",value:function(e){this.backend.load(e),this.drawBuffer(),this.isReady=!0,this.fireEvent("ready")}},{key:"loadBlob",value:function(e){var t=this,r=new FileReader;r.addEventListener("progress",(function(e){return t.onProgress(e)})),r.addEventListener("load",(function(e){return t.loadArrayBuffer(e.target.result)})),r.addEventListener("error",(function(){return t.fireEvent("error","Error reading file")})),r.readAsArrayBuffer(e),this.empty()}},{key:"load",value:function(e,t,r,n){if(!e)throw new Error("url parameter cannot be empty");if(this.empty(),r){var i={"Preload is not 'auto', 'none' or 'metadata'":-1===["auto","metadata","none"].indexOf(r),"Peaks are not provided":!t,"Backend is not of type 'MediaElement' or 'MediaElementWebAudio'":-1===["MediaElement","MediaElementWebAudio"].indexOf(this.params.backend),"Url is not of type string":"string"!=typeof e},a=Object.keys(i).filter((function(e){return i[e]}));a.length&&(console.warn("Preload parameter of wavesurfer.load will be ignored because:\n\t- "+a.join("\n\t- ")),r=null)}switch("WebAudio"===this.params.backend&&e instanceof HTMLMediaElement&&(e=e.src),this.params.backend){case"WebAudio":return this.loadBuffer(e,t,n);case"MediaElement":case"MediaElementWebAudio":return this.loadMediaElement(e,t,r,n)}}},{key:"loadBuffer",value:function(e,t,r){var n=this,i=function(t){return t&&n.tmpEvents.push(n.once("ready",t)),n.getArrayBuffer(e,(function(e){return n.loadArrayBuffer(e)}))};if(!t)return i();this.backend.setPeaks(t,r),this.drawBuffer(),this.fireEvent("waveform-ready"),this.tmpEvents.push(this.once("interaction",i))}},{key:"loadMediaElement",value:function(e,t,r,n){var i=this,a=e;if("string"==typeof e)this.backend.load(a,this.mediaContainer,t,r);else{var o=e;this.backend.loadElt(o,t),a=o.src}this.tmpEvents.push(this.backend.once("canplay",(function(){i.backend.destroyed||(i.drawBuffer(),i.isReady=!0,i.fireEvent("ready"))})),this.backend.once("error",(function(e){return i.fireEvent("error",e)}))),t&&(this.backend.setPeaks(t,n),this.drawBuffer(),this.fireEvent("waveform-ready")),t&&!this.params.forceDecode||!this.backend.supportsWebAudio()||this.getArrayBuffer(a,(function(e){i.decodeArrayBuffer(e,(function(e){i.backend.buffer=e,i.backend.setPeaks(null),i.drawBuffer(),i.fireEvent("waveform-ready")}))}))}},{key:"decodeArrayBuffer",value:function(e,t){var r=this;this.isDestroyed||(this.arraybuffer=e,this.backend.decodeArrayBuffer(e,(function(n){r.isDestroyed||r.arraybuffer!=e||(t(n),r.arraybuffer=null)}),(function(){return r.fireEvent("error","Error decoding audiobuffer")})))}},{key:"getArrayBuffer",value:function(e,t){var r=this,i=Object.assign({url:e,responseType:"arraybuffer"},this.params.xhr),a=n.fetchFile(i);return this.currentRequest=a,this.tmpEvents.push(a.on("progress",(function(e){r.onProgress(e)})),a.on("success",(function(e){t(e),r.currentRequest=null})),a.on("error",(function(e){r.fireEvent("error",e),r.currentRequest=null}))),a}},{key:"onProgress",value:function(e){var t;t=e.lengthComputable?e.loaded/e.total:e.loaded/(e.loaded+1e6),this.fireEvent("loading",Math.round(100*t),e.target)}},{key:"exportPCM",value:function(e,t,r,n,i){e=e||1024,n=n||0,t=t||1e4,r=r||!1;var a=this.backend.getPeaks(e,n,i),o=[].map.call(a,(function(e){return Math.round(e*t)/t}));return new Promise((function(e,t){if(!r){var n=new Blob([JSON.stringify(o)],{type:"application/json;charset=utf-8"}),i=URL.createObjectURL(n);window.open(i),URL.revokeObjectURL(i)}e(o)}))}},{key:"exportImage",value:function(e,t,r){return e||(e="image/png"),t||(t=1),r||(r="dataURL"),this.drawer.getImage(e,t,r)}},{key:"cancelAjax",value:function(){this.currentRequest&&this.currentRequest.controller&&(this.currentRequest._reader&&this.currentRequest._reader.cancel().catch((function(e){})),this.currentRequest.controller.abort(),this.currentRequest=null)}},{key:"clearTmpEvents",value:function(){this.tmpEvents.forEach((function(e){return e.un()}))}},{key:"empty",value:function(){this.backend.isPaused()||(this.stop(),this.backend.disconnectSource()),this.isReady=!1,this.cancelAjax(),this.clearTmpEvents(),this.drawer.progress(0),this.drawer.setWidth(0),this.drawer.drawPeaks({length:this.drawer.getWidth()},0)}},{key:"destroy",value:function(){this.destroyAllPlugins(),this.fireEvent("destroy"),this.cancelAjax(),this.clearTmpEvents(),this.unAll(),!1!==this.params.responsive&&(window.removeEventListener("resize",this._onResize,!0),window.removeEventListener("orientationchange",this._onResize,!0)),this.backend&&(this.backend.destroy(),this.backend=null),this.drawer&&this.drawer.destroy(),this.isDestroyed=!0,this.isReady=!1,this.arraybuffer=null}}],[{key:"create",value:function(e){return new r(e).init()}}]),r}(n.Observer);t.default=w,y(w,"VERSION","6.6.4"),y(w,"util",n),e.exports=t.default},379:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var n=function(e,t){if(!t&&e&&e.__esModule)return e;if(null===e||"object"!==a(e)&&"function"!=typeof e)return{default:e};var r=i(t);if(r&&r.has(e))return r.get(e);var n={},o=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var s in e)if("default"!==s&&Object.prototype.hasOwnProperty.call(e,s)){var u=o?Object.getOwnPropertyDescriptor(e,s):null;u&&(u.get||u.set)?Object.defineProperty(n,s,u):n[s]=e[s]}return n.default=e,r&&r.set(e,n),n}(r(241));function i(e){if("function"!=typeof WeakMap)return null;var t=new WeakMap,r=new WeakMap;return(i=function(e){return e?r:t})(e)}function a(e){return a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},a(e)}function o(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,h(n.key),n)}}function s(e,t){return s=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},s(e,t)}function u(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}();return function(){var r,n=c(e);if(t){var i=c(this).constructor;r=Reflect.construct(n,arguments,i)}else r=n.apply(this,arguments);return function(e,t){if(t&&("object"===a(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return l(e)}(this,r)}}function l(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function c(e){return c=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},c(e)}function f(e,t,r){return(t=h(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function h(e){var t=function(e,t){if("object"!==a(e)||null===e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var n=r.call(e,t||"default");if("object"!==a(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(e,"string");return"symbol"===a(t)?t:String(t)}var d="playing",p="paused",v="finished",y=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&s(e,t)}(c,e);var t,r,i,a=u(c);function c(e){var t,r,n;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,c),f(l(n=a.call(this)),"audioContext",null),f(l(n),"stateBehaviors",(f(t={},d,{init:function(){this.addOnAudioProcess()},getPlayedPercents:function(){var e=this.getDuration();return this.getCurrentTime()/e||0},getCurrentTime:function(){return this.startPosition+this.getPlayedTime()}}),f(t,p,{init:function(){},getPlayedPercents:function(){var e=this.getDuration();return this.getCurrentTime()/e||0},getCurrentTime:function(){return this.startPosition}}),f(t,v,{init:function(){this.fireEvent("finish")},getPlayedPercents:function(){return 1},getCurrentTime:function(){return this.getDuration()}}),t)),n.params=e,n.ac=e.audioContext||(n.supportsWebAudio()?n.getAudioContext():{}),n.lastPlay=n.ac.currentTime,n.startPosition=0,n.scheduledPause=null,n.states=(f(r={},d,Object.create(n.stateBehaviors[d])),f(r,p,Object.create(n.stateBehaviors[p])),f(r,v,Object.create(n.stateBehaviors[v])),r),n.buffer=null,n.filters=[],n.gainNode=null,n.mergedPeaks=null,n.offlineAc=null,n.peaks=null,n.playbackRate=1,n.analyser=null,n.scriptNode=null,n.source=null,n.splitPeaks=[],n.state=null,n.explicitDuration=e.duration,n.sinkStreamDestination=null,n.sinkAudioElement=null,n.destroyed=!1,n}return t=c,r=[{key:"supportsWebAudio",value:function(){return!(!window.AudioContext&&!window.webkitAudioContext)}},{key:"getAudioContext",value:function(){return window.WaveSurferAudioContext||(window.WaveSurferAudioContext=new(window.AudioContext||window.webkitAudioContext)),window.WaveSurferAudioContext}},{key:"getOfflineAudioContext",value:function(e){return window.WaveSurferOfflineAudioContext||(window.WaveSurferOfflineAudioContext=new(window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,2,e)),window.WaveSurferOfflineAudioContext}},{key:"init",value:function(){this.createVolumeNode(),this.createScriptNode(),this.createAnalyserNode(),this.setState(p),this.setPlaybackRate(this.params.audioRate),this.setLength(0)}},{key:"disconnectFilters",value:function(){this.filters&&(this.filters.forEach((function(e){e&&e.disconnect()})),this.filters=null,this.analyser.connect(this.gainNode))}},{key:"setState",value:function(e){this.state!==this.states[e]&&(this.state=this.states[e],this.state.init.call(this))}},{key:"setFilter",value:function(){for(var e=arguments.length,t=new Array(e),r=0;r<e;r++)t[r]=arguments[r];this.setFilters(t)}},{key:"setFilters",value:function(e){this.disconnectFilters(),e&&e.length&&(this.filters=e,this.analyser.disconnect(),e.reduce((function(e,t){return e.connect(t),t}),this.analyser).connect(this.gainNode))}},{key:"createScriptNode",value:function(){this.params.audioScriptProcessor&&(this.scriptNode=this.params.audioScriptProcessor,this.scriptNode.connect(this.ac.destination))}},{key:"addOnAudioProcess",value:function(){var e=this;!function t(){var r=e.getCurrentTime();r>=e.getDuration()&&e.state!==e.states[v]?(e.setState(v),e.fireEvent("pause")):r>=e.scheduledPause&&e.state!==e.states[p]?e.pause():e.state===e.states[d]&&(e.fireEvent("audioprocess",r),n.frame(t)())}()}},{key:"createAnalyserNode",value:function(){this.analyser=this.ac.createAnalyser(),this.analyser.connect(this.gainNode)}},{key:"createVolumeNode",value:function(){this.ac.createGain?this.gainNode=this.ac.createGain():this.gainNode=this.ac.createGainNode(),this.gainNode.connect(this.ac.destination)}},{key:"setSinkId",value:function(e){return e?(this.sinkAudioElement||(this.sinkAudioElement=new window.Audio,this.sinkAudioElement.autoplay=!0),this.sinkAudioElement.setSinkId?(this.sinkStreamDestination||(this.sinkStreamDestination=this.ac.createMediaStreamDestination()),this.gainNode.disconnect(),this.gainNode.connect(this.sinkStreamDestination),this.sinkAudioElement.srcObject=this.sinkStreamDestination.stream,this.sinkAudioElement.setSinkId(e)):Promise.reject(new Error("setSinkId is not supported in your browser"))):Promise.reject(new Error("Invalid deviceId: "+e))}},{key:"setVolume",value:function(e){this.gainNode.gain.setValueAtTime(e,this.ac.currentTime)}},{key:"getVolume",value:function(){return this.gainNode.gain.value}},{key:"decodeArrayBuffer",value:function(e,t,r){this.offlineAc||(this.offlineAc=this.getOfflineAudioContext(this.ac&&this.ac.sampleRate?this.ac.sampleRate:44100)),"webkitAudioContext"in window?this.offlineAc.decodeAudioData(e,(function(e){return t(e)}),r):this.offlineAc.decodeAudioData(e).then((function(e){return t(e)})).catch((function(e){return r(e)}))}},{key:"setPeaks",value:function(e,t){null!=t&&(this.explicitDuration=t),this.peaks=e}},{key:"setLength",value:function(e){if(!this.mergedPeaks||e!=2*this.mergedPeaks.length-1+2){this.splitPeaks=[],this.mergedPeaks=[];var t,r=this.buffer?this.buffer.numberOfChannels:1;for(t=0;t<r;t++)this.splitPeaks[t]=[],this.splitPeaks[t][2*(e-1)]=0,this.splitPeaks[t][2*(e-1)+1]=0;this.mergedPeaks[2*(e-1)]=0,this.mergedPeaks[2*(e-1)+1]=0}}},{key:"getPeaks",value:function(e,t,r){if(this.peaks)return this.peaks;if(!this.buffer)return[];if(t=t||0,r=r||e-1,this.setLength(e),!this.buffer)return this.params.splitChannels?this.splitPeaks:this.mergedPeaks;if(!this.buffer.length){var n=this.createBuffer(1,4096,this.sampleRate);this.buffer=n.buffer}var i,a=this.buffer.length/e,o=~~(a/10)||1,s=this.buffer.numberOfChannels;for(i=0;i<s;i++){var u=this.splitPeaks[i],l=this.buffer.getChannelData(i),c=void 0;for(c=t;c<=r;c++){var f=~~(c*a),h=~~(f+a),d=l[f],p=d,v=void 0;for(v=f;v<h;v+=o){var y=l[v];y>p&&(p=y),y<d&&(d=y)}u[2*c]=p,u[2*c+1]=d,(0==i||p>this.mergedPeaks[2*c])&&(this.mergedPeaks[2*c]=p),(0==i||d<this.mergedPeaks[2*c+1])&&(this.mergedPeaks[2*c+1]=d)}}return this.params.splitChannels?this.splitPeaks:this.mergedPeaks}},{key:"getPlayedPercents",value:function(){return this.state.getPlayedPercents.call(this)}},{key:"disconnectSource",value:function(){this.source&&this.source.disconnect()}},{key:"destroyWebAudio",value:function(){this.disconnectFilters(),this.disconnectSource(),this.gainNode.disconnect(),this.scriptNode&&this.scriptNode.disconnect(),this.analyser.disconnect(),this.params.closeAudioContext&&("function"==typeof this.ac.close&&"closed"!=this.ac.state&&this.ac.close(),this.ac=null,this.params.audioContext?this.params.audioContext=null:window.WaveSurferAudioContext=null,window.WaveSurferOfflineAudioContext=null),this.sinkStreamDestination&&(this.sinkAudioElement.pause(),this.sinkAudioElement.srcObject=null,this.sinkStreamDestination.disconnect(),this.sinkStreamDestination=null)}},{key:"destroy",value:function(){this.isPaused()||this.pause(),this.unAll(),this.buffer=null,this.destroyed=!0,this.destroyWebAudio()}},{key:"load",value:function(e){this.startPosition=0,this.lastPlay=this.ac.currentTime,this.buffer=e,this.createSource()}},{key:"createSource",value:function(){this.disconnectSource(),this.source=this.ac.createBufferSource(),this.source.start=this.source.start||this.source.noteGrainOn,this.source.stop=this.source.stop||this.source.noteOff,this.setPlaybackRate(this.playbackRate),this.source.buffer=this.buffer,this.source.connect(this.analyser)}},{key:"resumeAudioContext",value:function(){"suspended"==this.ac.state&&this.ac.resume&&this.ac.resume()}},{key:"isPaused",value:function(){return this.state!==this.states[d]}},{key:"getDuration",value:function(){return this.explicitDuration?this.explicitDuration:this.buffer?this.buffer.duration:0}},{key:"seekTo",value:function(e,t){if(this.buffer)return this.scheduledPause=null,null==e&&(e=this.getCurrentTime())>=this.getDuration()&&(e=0),null==t&&(t=this.getDuration()),this.startPosition=e,this.lastPlay=this.ac.currentTime,this.state===this.states[v]&&this.setState(p),{start:e,end:t}}},{key:"getPlayedTime",value:function(){return(this.ac.currentTime-this.lastPlay)*this.playbackRate}},{key:"play",value:function(e,t){if(this.buffer){this.createSource();var r=this.seekTo(e,t);e=r.start,t=r.end,this.scheduledPause=t,this.source.start(0,e),this.resumeAudioContext(),this.setState(d),this.fireEvent("play")}}},{key:"pause",value:function(){this.scheduledPause=null,this.startPosition+=this.getPlayedTime();try{this.source&&this.source.stop(0)}catch(e){}this.setState(p),this.fireEvent("pause")}},{key:"getCurrentTime",value:function(){return this.state.getCurrentTime.call(this)}},{key:"getPlaybackRate",value:function(){return this.playbackRate}},{key:"setPlaybackRate",value:function(e){this.playbackRate=e||1,this.source&&this.source.playbackRate.setValueAtTime(this.playbackRate,this.ac.currentTime)}},{key:"setPlayEnd",value:function(e){this.scheduledPause=e}}],r&&o(t.prototype,r),i&&o(t,i),Object.defineProperty(t,"prototype",{writable:!1}),c}(n.Observer);t.default=y,e.exports=t.default},296:e=>{function t(e,t,r){var n,i,a,o,s;function u(){var l=Date.now()-o;l<t&&l>=0?n=setTimeout(u,t-l):(n=null,r||(s=e.apply(a,i),a=i=null))}null==t&&(t=100);var l=function(){a=this,i=arguments,o=Date.now();var l=r&&!n;return n||(n=setTimeout(u,t)),l&&(s=e.apply(a,i),a=i=null),s};return l.clear=function(){n&&(clearTimeout(n),n=null)},l.flush=function(){n&&(s=e.apply(a,i),a=i=null,clearTimeout(n),n=null)},l}t.debounce=t,e.exports=t}},t={},function r(n){var i=t[n];if(void 0!==i)return i.exports;var a=t[n]={exports:{}};return e[n](a,a.exports,r),a.exports}(631);var e,t}));
/*

#  EQCSS
## version 1.9.2

A JavaScript plugin to read EQCSS syntax to provide:
scoped styles, element queries, container queries,
meta-selectors, eval(), and element-based units.

- github.com/eqcss/eqcss
- elementqueries.com

Authors: Tommy Hodgins, Maxime Euzière

License: MIT

*/

// Uses Node, AMD or browser globals to create a module
(function (root, factory) {

    if (typeof define === 'function' && define.amd) {

        // AMD: Register as an anonymous module
        define([], factory)

    } else if (typeof module === 'object' && module.exports) {

        // Node: Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node
        module.exports = factory()

    } else {

        // Browser globals (root is window)
        root.EQCSS = factory()

    }

}(this, function () {

    var EQCSS = {
        data: [],
        version: '1.9.2'
    }


    /*
     * EQCSS.load()
     * Called automatically on page load.
     * Call it manually after adding EQCSS code in the page.
     * Loads and parses all the EQCSS code.
     */

    EQCSS.load = function () {

        // Retrieve all style blocks
        var styles = document.getElementsByTagName('style')

        for (var i = 0; i < styles.length; i++) {

            if (styles[i].namespaceURI !== 'http://www.w3.org/2000/svg') {

                // Test if the style is not read yet
                if (styles[i].getAttribute('data-eqcss-read') === null) {

                    // Mark the style block as read
                    styles[i].setAttribute('data-eqcss-read', 'true')

                    // Process
                    EQCSS.process(styles[i].innerHTML)

                }

            }

        }

        // Retrieve all script blocks
        var script = document.getElementsByTagName('script')

        for (i = 0; i < script.length; i++) {

            // Test if the script is not read yet and has type='text/eqcss'
            if (script[i].getAttribute('data-eqcss-read') === null && script[i].type === 'text/eqcss') {

                // Test if they contain external EQCSS code
                if (script[i].src) {

                    // retrieve the file content with AJAX and process it
                    (function () {

                        var xhr = new XMLHttpRequest

                        xhr.open('GET', script[i].src, true)
                        xhr.send(null)
                        xhr.onreadystatechange = function () {

                            if (xhr.readyState === 4 && xhr.status === 200) {

                                EQCSS.process(xhr.responseText)

                            }

                        }

                    })()

                }

                // or embedded EQCSS code
                else {

                    // Process
                    EQCSS.process(script[i].innerHTML)

                }

                // Mark the script block as read
                script[i].setAttribute('data-eqcss-read', 'true')

            }

        }

        // Retrieve all link tags
        var link = document.getElementsByTagName('link')

        for (i = 0; i < link.length; i++) {

            // Test if the link is not read yet, and has rel=stylesheet
            if (link[i].getAttribute('data-eqcss-read') === null && link[i].rel === 'stylesheet') {

                // retrieve the file content with AJAX and process it
                if (link[i].href) {

                    (function () {

                        var xhr = new XMLHttpRequest

                        xhr.open('GET', link[i].href, true)
                        xhr.send(null)
                        xhr.onreadystatechange = function () {

                            if (xhr.readyState === 4 && xhr.status === 200) {

                                EQCSS.process(xhr.responseText)

                            }

                        }

                    })()

                }

                // Mark the link as read
                link[i].setAttribute('data-eqcss-read', 'true')

            }

        }

    }


    /*
     * EQCSS.parse()
     * Called by load for each script / style / link resource.
     * Generates data for each Element Query found
     */

    EQCSS.parse = function (code) {

        var parsed_queries = new Array()

        // Cleanup
        code = code || ''
        code = code.replace(/\s+/g, ' '); // reduce spaces and line breaks
        code = code.replace(/\/\*[\w\W]*?\*\//g, '') // remove comments
        code = code.replace(/@element/g, '\n@element') // one element query per line
        code = code.replace(/(@element.*?\{([^}]*?\{[^}]*?\}[^}]*?)*\}).*/g, '$1') // Keep the queries only (discard regular css written around them)

        // Parse

        // For each query
        code.replace(/(@element.*(?!@element))/g, function (string, query) {

            // Create a data entry
            var dataEntry = {}

            // Extract the selector
            query.replace(/(@element)\s*(".*?"|'.*?'|.*?)\s*(and\s*\(|{)/g, function (string, atrule, selector) {

                // Strip outer quotes if present
                selector = selector.replace(/^\s?['](.*)[']/, '$1')
                selector = selector.replace(/^\s?["](.*)["]/, '$1')

                dataEntry.selector = selector

            })

            // Extract the conditions
            dataEntry.conditions = []
            query.replace(/and ?\( ?([^:]*) ?: ?([^)]*) ?\)/g, function (string, measure, value) {

                // Separate value and unit if it's possible
                var unit = null
                unit = value.replace(/^(\d*\.?\d+)(\D+)$/, '$2')

                if (unit === value) {

                    unit = null

                }

                value = value.replace(/^(\d*\.?\d+)\D+$/, '$1')
                dataEntry.conditions.push({measure: measure, value: value, unit: unit})

            })

            // Extract the styles
            query.replace(/{(.*)}/g, function (string, style) {

                dataEntry.style = style

            })

            // Add it to data
            parsed_queries.push(dataEntry)

        })

        return parsed_queries

    }


    /*
     * EQCSS.register()
     * Add a single object, or an array of objects to EQCSS.data
     *
     */

    EQCSS.register = function (queries) {

        if (Object.prototype.toString.call(queries) === '[object Object]') {

            EQCSS.data.push(queries)

            EQCSS.apply()

        }

        if (Object.prototype.toString.call(queries) === '[object Array]') {

            for (var i = 0; i < queries.length; i++) {

                EQCSS.data.push(queries[i])

            }

            EQCSS.apply()

        }

    }


    /*
     * EQCSS.process()
     * Parse and Register queries with `EQCSS.data`
     */

    EQCSS.process = function (code) {

        var queries = EQCSS.parse(code)

        return EQCSS.register(queries)

    }


    /*
     * EQCSS.apply()
     * Called on load, on resize and manually on DOM update
     * Enable the Element Queries in which the conditions are true
     */

    EQCSS.apply = function () {

        var i, j, k                       // Iterators
        var elements                      // Elements targeted by each query
        var element_guid                  // GUID for current element
        var css_block                     // CSS block corresponding to each targeted element
        var element_guid_parent           // GUID for current element's parent
        var element_guid_prev             // GUID for current element's previous sibling element
        var element_guid_next             // GUID for current element's next sibling element
        var css_code                      // CSS code to write in each CSS block (one per targeted element)
        var element_width, parent_width   // Computed widths
        var element_height, parent_height // Computed heights
        var element_line_height           // Computed line-height
        var test                          // Query's condition test result
        var computed_style                // Each targeted element's computed style
        var parent_computed_style         // Each targeted element parent's computed style

        // Loop on all element queries
        for (i = 0; i < EQCSS.data.length; i++) {

            // Find all the elements targeted by the query
            elements = document.querySelectorAll(EQCSS.data[i].selector)

            // Loop on all the elements
            for (j = 0; j < elements.length; j++) {

                // Create a guid for this element
                // Pattern: 'EQCSS_{element-query-index}_{matched-element-index}'
                element_guid = 'data-eqcss-' + i + '-' + j

                // Add this guid as an attribute to the element
                elements[j].setAttribute(element_guid, '')

                // Create a guid for the parent of this element
                // Pattern: 'EQCSS_{element-query-index}_{matched-element-index}_parent'
                element_guid_parent = 'data-eqcss-' + i + '-' + j + '-parent'

                // Add this guid as an attribute to the element's parent (except if element is the root element)
                if (elements[j] != document.documentElement) {

                    elements[j].parentNode.setAttribute(element_guid_parent, '')

                }

                // Create a guid for the prev sibling of this element
                // Pattern: 'EQCSS_{element-query-index}_{matched-element-index}_prev'
                element_guid_prev = 'data-eqcss-' + i + '-' + j + '-prev'

                // Add this guid as an attribute to the element's prev sibling
                var prev_sibling = (function (el) {

                    while ((el = el.previousSibling)) {

                        if (el.nodeType === 1) {

                            return el

                        }

                    }

                })(elements[j])

                // If there is a previous sibling, add attribute
                if (prev_sibling) {

                    prev_sibling.setAttribute(element_guid_prev, '')

                }

                // Create a guid for the next sibling of this element
                // Pattern: 'EQCSS_{element-query-index}_{matched-element-index}_next'
                element_guid_next = 'data-eqcss-' + i + '-' + j + '-next'

                // Add this guid as an attribute to the element's next sibling
                var next_sibling = (function (el) {

                    while ((el = el.nextSibling)) {

                        if (el.nodeType === 1) {

                            return el

                        }

                    }

                })(elements[j])

                // If there is a next sibling, add attribute
                if (next_sibling) {

                    next_sibling.setAttribute(element_guid_next, '')

                }

                // Get the CSS block associated to this element (or create one in the <HEAD> if it doesn't exist)
                css_block = document.querySelector('#' + element_guid)

                if (!css_block) {

                    css_block = document.createElement('style')
                    css_block.id = element_guid
                    css_block.setAttribute('data-eqcss-read', 'true')
                    document.querySelector('head').appendChild(css_block)

                }

                css_block = document.querySelector('#' + element_guid)

                // Reset the query test's result (first, we assume that the selector is matched)
                test = true

                // Loop on the conditions
                test_conditions: for (k = 0; k < EQCSS.data[i].conditions.length; k++) {

                    // Reuse element and parent's computed style instead of computing it everywhere
                    computed_style = window.getComputedStyle(elements[j], null)

                    parent_computed_style = null

                    if (elements[j] != document.documentElement) {

                        parent_computed_style = window.getComputedStyle(elements[j].parentNode, null)

                    }

                    // Do we have to reconvert the size in px at each call?
                    // This is true only for vw/vh/vmin/vmax
                    var recomputed = false
                    var value

                    // If the condition's unit is vw, convert current value in vw, in px
                    if (EQCSS.data[i].conditions[k].unit === 'vw') {

                        recomputed = true

                        value = parseInt(EQCSS.data[i].conditions[k].value)
                        EQCSS.data[i].conditions[k].recomputed_value = value * window.innerWidth / 100

                    }

                    // If the condition's unit is vh, convert current value in vh, in px
                    else if (EQCSS.data[i].conditions[k].unit === 'vh') {

                        recomputed = true

                        value = parseInt(EQCSS.data[i].conditions[k].value)
                        EQCSS.data[i].conditions[k].recomputed_value = value * window.innerHeight / 100

                    }

                    // If the condition's unit is vmin, convert current value in vmin, in px
                    else if (EQCSS.data[i].conditions[k].unit === 'vmin') {

                        recomputed = true

                        value = parseInt(EQCSS.data[i].conditions[k].value)
                        EQCSS.data[i].conditions[k].recomputed_value = value * Math.min(window.innerWidth, window.innerHeight) / 100

                    }

                    // If the condition's unit is vmax, convert current value in vmax, in px
                    else if (EQCSS.data[i].conditions[k].unit === 'vmax') {

                        recomputed = true

                        value = parseInt(EQCSS.data[i].conditions[k].value)
                        EQCSS.data[i].conditions[k].recomputed_value = value * Math.max(window.innerWidth, window.innerHeight) / 100

                    }

                    // If the condition's unit is set and is not px or %, convert it into pixels
                    else if (EQCSS.data[i].conditions[k].unit != null && EQCSS.data[i].conditions[k].unit != 'px' && EQCSS.data[i].conditions[k].unit != '%') {

                        // Create a hidden DIV, sibling of the current element (or its child, if the element is <html>)
                        // Set the given measure and unit to the DIV's width
                        // Measure the DIV's width in px
                        // Remove the DIV
                        var div = document.createElement('div')

                        div.style.visibility = 'hidden'
                        div.style.border = '1px solid red'
                        div.style.width = EQCSS.data[i].conditions[k].value + EQCSS.data[i].conditions[k].unit

                        var position = elements[j]

                        if (elements[j] != document.documentElement) {

                            position = elements[j].parentNode

                        }

                        position.appendChild(div)
                        EQCSS.data[i].conditions[k].value = parseInt(window.getComputedStyle(div, null).getPropertyValue('width'))
                        EQCSS.data[i].conditions[k].unit = 'px'
                        position.removeChild(div)

                    }

                    // Store the good value in final_value depending if the size is recomputed or not
                    var final_value = recomputed ? EQCSS.data[i].conditions[k].recomputed_value : parseInt(EQCSS.data[i].conditions[k].value)

                    // Check each condition for this query and this element
                    // If at least one condition is false, the element selector is not matched
                    switch (EQCSS.data[i].conditions[k].measure) {

                        // Min-width
                        case 'min-width':

                            // Min-width in px
                            if (recomputed === true || EQCSS.data[i].conditions[k].unit === 'px') {

                                element_width = parseInt(computed_style.getPropertyValue('width'))

                                if (!(element_width >= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // Min-width in %
                            if (EQCSS.data[i].conditions[k].unit === '%') {

                                element_width = parseInt(computed_style.getPropertyValue('width'))
                                parent_width = parseInt(parent_computed_style.getPropertyValue('width'))

                                if (!(parent_width / element_width <= 100 / final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            break

                        // Max-width
                        case 'max-width':

                            // Max-width in px
                            if (recomputed === true || EQCSS.data[i].conditions[k].unit === 'px') {

                                element_width = parseInt(computed_style.getPropertyValue('width'))

                                if (!(element_width <= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // Max-width in %
                            if (EQCSS.data[i].conditions[k].unit === '%') {

                                element_width = parseInt(computed_style.getPropertyValue('width'))
                                parent_width = parseInt(parent_computed_style.getPropertyValue('width'))

                                if (!(parent_width / element_width >= 100 / final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            break

                        // Min-height
                        case 'min-height':

                            // Min-height in px
                            if (recomputed === true || EQCSS.data[i].conditions[k].unit === 'px') {

                                element_height = parseInt(computed_style.getPropertyValue('height'))

                                if (!(element_height >= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // Min-height in %
                            if (EQCSS.data[i].conditions[k].unit === '%') {

                                element_height = parseInt(computed_style.getPropertyValue('height'))
                                parent_height = parseInt(parent_computed_style.getPropertyValue('height'))

                                if (!(parent_height / element_height <= 100 / final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            break

                        // Max-height
                        case 'max-height':

                            // Max-height in px
                            if (recomputed === true || EQCSS.data[i].conditions[k].unit === 'px') {

                                element_height = parseInt(computed_style.getPropertyValue('height'))

                                if (!(element_height <= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // Max-height in %
                            if (EQCSS.data[i].conditions[k].unit === '%') {

                                element_height = parseInt(computed_style.getPropertyValue('height'))
                                parent_height = parseInt(parent_computed_style.getPropertyValue('height'))

                                if (!(parent_height / element_height >= 100 / final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            break

                        // Min-scroll-x
                        case 'min-scroll-x':

                            var element = elements[j]
                            var element_scroll = element.scrollLeft

                            if (!element.hasScrollListener) {

                                if (element === document.documentElement || element === document.body) {

                                    window.addEventListener('scroll', function () {

                                        EQCSS.throttle()
                                        element.hasScrollListener = true

                                    })

                                } else {

                                    element.addEventListener('scroll', function () {

                                        EQCSS.throttle()
                                        element.hasScrollListener = true

                                    })

                                }

                            }

                            // Min-scroll-x in px
                            if (recomputed === true || EQCSS.data[i].conditions[k].unit === 'px') {

                                if (!(element_scroll >= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // Min-scroll-x in %
                            else if (EQCSS.data[i].conditions[k].unit === '%') {

                                var element_scroll_size = elements[j].scrollWidth
                                var element_size

                                if (elements[j] === document.documentElement || elements[j] === document.body) {

                                    element_size = window.innerWidth

                                } else {

                                    element_size = parseInt(computed_style.getPropertyValue('width'))

                                }

                                if (!((element_scroll / (element_scroll_size - element_size)) * 100 >= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            break

                        // Min-scroll-y
                        case 'min-scroll-y':

                            element = elements[j]
                            element_scroll = elements[j].scrollTop

                            if (!element.hasScrollListener) {

                                if (element === document.documentElement || element === document.body) {

                                    window.addEventListener('scroll', function () {

                                        EQCSS.throttle()
                                        element.hasScrollListener = true

                                    })

                                } else {

                                    element.addEventListener('scroll', function () {

                                        EQCSS.throttle()
                                        element.hasScrollListener = true

                                    })

                                }

                            }

                            // Min-scroll-y in px
                            if (recomputed === true || EQCSS.data[i].conditions[k].unit === 'px') {

                                if (!(element_scroll >= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // Min-scroll-y in %
                            else if (EQCSS.data[i].conditions[k].unit === '%') {

                                element_scroll_size = elements[j].scrollHeight
                                element_size

                                if (elements[j] === document.documentElement || elements[j] === document.body) {

                                    element_size = window.innerHeight

                                } else {

                                    element_size = parseInt(computed_style.getPropertyValue('height'))

                                }

                                if (!((element_scroll / (element_scroll_size - element_size)) * 100 >= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            break

                        // Max-scroll-x
                        case 'max-scroll-x':

                            element = elements[j]
                            element_scroll = elements[j].scrollLeft

                            if (!element.hasScrollListener) {

                                if (element === document.documentElement || element === document.body) {

                                    window.addEventListener('scroll', function () {

                                        EQCSS.throttle()
                                        element.hasScrollListener = true

                                    })

                                } else {

                                    element.addEventListener('scroll', function () {

                                        EQCSS.throttle()
                                        element.hasScrollListener = true

                                    })

                                }

                            }

                            // Max-scroll-x in px
                            if (recomputed === true || EQCSS.data[i].conditions[k].unit === 'px') {

                                if (!(element_scroll <= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // Max-scroll-x in %
                            else if (EQCSS.data[i].conditions[k].unit === '%') {

                                element_scroll_size = elements[j].scrollWidth
                                element_size

                                if (elements[j] === document.documentElement || elements[j] === document.body) {

                                    element_size = window.innerWidth

                                } else {

                                    element_size = parseInt(computed_style.getPropertyValue('width'))

                                }

                                if (!((element_scroll / (element_scroll_size - element_size)) * 100 <= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            break

                        // Max-scroll-y
                        case 'max-scroll-y':

                            element = elements[j]
                            element_scroll = elements[j].scrollTop

                            if (!element.hasScrollListener) {

                                if (element === document.documentElement || element === document.body) {

                                    window.addEventListener('scroll', function () {

                                        EQCSS.throttle()
                                        element.hasScrollListener = true

                                    })

                                } else {

                                    element.addEventListener('scroll', function () {

                                        EQCSS.throttle()
                                        element.hasScrollListener = true

                                    })

                                }

                            }

                            // Max-scroll-y in px
                            if (recomputed === true || EQCSS.data[i].conditions[k].unit === 'px') {

                                if (!(element_scroll <= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // Max-scroll-y in %
                            else if (EQCSS.data[i].conditions[k].unit === '%') {

                                element_scroll_size = elements[j].scrollHeight
                                element_size

                                if (elements[j] === document.documentElement || elements[j] === document.body) {

                                    element_size = window.innerHeight

                                } else {

                                    element_size = parseInt(computed_style.getPropertyValue('height'))

                                }

                                if (!((element_scroll / (element_scroll_size - element_size)) * 100 <= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            break

                        // Min-characters
                        case 'min-characters':

                            // form inputs
                            if (elements[j].value) {

                                if (!(elements[j].value.length >= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // blocks
                            else {

                                if (!(elements[j].textContent.length >= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            break

                        // Characters
                        case 'characters':

                            // form inputs
                            if (elements[j].value) {

                                if (elements[j].value.length !== final_value) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // blocks
                            else {

                                if (elements[j].textContent.length !== final_value) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            break

                        // Max-characters
                        case 'max-characters':

                            // form inputs
                            if (elements[j].value) {

                                if (!(elements[j].value.length <= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // blocks
                            else {

                                if (!(elements[j].textContent.length <= final_value)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            break

                        // Min-children
                        case 'min-children':

                            if (!(elements[j].children.length >= final_value)) {

                                test = false
                                break test_conditions

                            }

                            break

                        // Children
                        case 'children':

                            if (elements[j].children.length !== final_value) {

                                test = false
                                break test_conditions

                            }

                            break

                        // Max-children
                        case 'max-children':

                            if (!(elements[j].children.length <= final_value)) {

                                test = false
                                break test_conditions

                            }

                            break

                        // Min-lines
                        case 'min-lines':

                            element_height =
                                parseInt(computed_style.getPropertyValue('height'))
                                - parseInt(computed_style.getPropertyValue('border-top-width'))
                                - parseInt(computed_style.getPropertyValue('border-bottom-width'))
                                - parseInt(computed_style.getPropertyValue('padding-top'))
                                - parseInt(computed_style.getPropertyValue('padding-bottom'))

                            element_line_height = computed_style.getPropertyValue('line-height')

                            if (element_line_height === 'normal') {

                                var element_font_size = parseInt(computed_style.getPropertyValue('font-size'))

                                element_line_height = element_font_size * 1.125

                            } else {

                                element_line_height = parseInt(element_line_height)

                            }

                            if (!(element_height / element_line_height >= final_value)) {

                                test = false
                                break test_conditions

                            }

                            break

                        // Max-lines
                        case 'max-lines':

                            element_height =
                                parseInt(computed_style.getPropertyValue('height'))
                                - parseInt(computed_style.getPropertyValue('border-top-width'))
                                - parseInt(computed_style.getPropertyValue('border-bottom-width'))
                                - parseInt(computed_style.getPropertyValue('padding-top'))
                                - parseInt(computed_style.getPropertyValue('padding-bottom'))

                            element_line_height = computed_style.getPropertyValue('line-height')

                            if (element_line_height === 'normal') {

                                element_font_size = parseInt(computed_style.getPropertyValue('font-size'))

                                element_line_height = element_font_size * 1.125

                            } else {

                                element_line_height = parseInt(element_line_height)

                            }

                            if (!(element_height / element_line_height + 1 <= final_value)) {

                                test = false
                                break test_conditions

                            }

                            break

                        // Orientation
                        case 'orientation':

                            // Square Orientation
                            if (EQCSS.data[i].conditions[k].value === 'square') {

                                if (!(elements[j].offsetWidth === elements[j].offsetHeight)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // Portrait Orientation
                            if (EQCSS.data[i].conditions[k].value === 'portrait') {

                                if (!(elements[j].offsetWidth < elements[j].offsetHeight)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            // Landscape Orientation
                            if (EQCSS.data[i].conditions[k].value === 'landscape') {

                                if (!(elements[j].offsetHeight < elements[j].offsetWidth)) {

                                    test = false
                                    break test_conditions

                                }

                            }

                            break

                        // Min-aspect-ratio
                        case 'min-aspect-ratio':

                            var el_width = EQCSS.data[i].conditions[k].value.split('/')[0]
                            var el_height = EQCSS.data[i].conditions[k].value.split('/')[1]

                            if (!(el_width / el_height <= elements[j].offsetWidth / elements[j].offsetHeight)) {

                                test = false
                                break test_conditions

                            }

                            break

                        // Max-aspect-ratio
                        case 'max-aspect-ratio':

                            el_width = EQCSS.data[i].conditions[k].value.split('/')[0]
                            el_height = EQCSS.data[i].conditions[k].value.split('/')[1]

                            if (!(elements[j].offsetWidth / elements[j].offsetHeight <= el_width / el_height)) {

                                test = false
                                break test_conditions

                            }

                            break

                    }
                }

                // Update CSS block:
                // If all conditions are met: copy the CSS code from the query to the corresponding CSS block
                if (test === true) {

                    // Get the CSS code to apply to the element
                    css_code = EQCSS.data[i].style

                    // Replace eval('xyz') with the result of try{with(element){eval(xyz)}} in JS
                    css_code = css_code.replace(
                        /eval\( *((".*?")|('.*?')) *\)/g,
                        function (string, match) {

                            return EQCSS.tryWithEval(elements[j], match)

                        }
                    )

                    // Replace ':self', '$this' or 'eq_this' with '[element_guid]'
                    css_code = css_code.replace(/(:|\$|eq_)(this|self)/gi, '[' + element_guid + ']')

                    // Replace ':parent', '$parent' or 'eq_parent' with '[element_guid_parent]'
                    css_code = css_code.replace(/(:|\$|eq_)parent/gi, '[' + element_guid_parent + ']')

                    // Replace ':prev', '$prev' or 'eq_prev' with '[element_guid_prev]'
                    css_code = css_code.replace(/(:|\$|eq_)prev/gi, '[' + element_guid_prev + ']')

                    // Replace ':next', '$next' or 'eq_next' with '[element_guid_next]'
                    css_code = css_code.replace(/(:|\$|eq_)next/gi, '[' + element_guid_next + ']')

                    // Replace '$root' or 'eq_root' with 'html'
                    css_code = css_code.replace(/(\$|eq_)root/gi, 'html')

                    // Replace 'ew', 'eh', 'emin', and 'emax' units
                    css_code = css_code.replace(/(\d*\.?\d+)(?:\s*)(ew|eh|emin|emax)/gi, function (match, $1, $2) {

                        switch ($2) {

                            // Element width units
                            case 'ew':

                                return elements[j].offsetWidth / 100 * $1 + 'px'

                                break

                            // Element height units
                            case 'eh':

                                return elements[j].offsetHeight / 100 * $1 + 'px'

                                break

                            // Element min units
                            case 'emin':

                                return Math.min(elements[j].offsetWidth, elements[j].offsetHeight) / 100 * $1 + 'px'

                                break

                            // Element max units
                            case 'emax':

                                return Math.max(elements[j].offsetWidth, elements[j].offsetHeight) / 100 * $1 + 'px'

                                break

                        }

                    })

                    // good browsers
                    try {

                        css_block.innerText = css_code

                    }

                        // IE8
                    catch (e) {

                        if (css_block.styleSheet) {

                            css_block.styleSheet.cssText = css_code

                        }

                    }

                }

                // If condition is not met: empty the CSS block
                else {

                    // Good browsers
                    try {

                        css_block.innerText = ''

                    }

                        // IE8
                    catch (e) {

                        if (css_block.styleSheet) {

                            css_block.styleSheet.cssText = ''

                        }

                    }

                }

            }

        }

    }


    /*
     * Eval('') and $it
     */

    EQCSS.tryWithEval = function (element, string) {

        var $it = element
        var ret = ''

        try {

            // with() is necessary for implicit 'this'!
            with ($it) {
                ret = eval(string.slice(1, -1))
            }

        } catch (e) {

            ret = ''

        }

        return ret

    }


    /*
     * EQCSS.reset
     * Deletes parsed queries removes EQCSS-generated tags and attributes
     * To reload EQCSS again after running EQCSS.reset() use EQCSS.load()
     */

    EQCSS.reset = function () {

        // Reset EQCSS.data, removing previously parsed queries
        EQCSS.data = []

        // Remove EQCSS-generated style tags from head
        var style_tag = document.querySelectorAll('head style[id^="data-eqcss-"]')

        for (var i = 0; i < style_tag.length; i++) {

            style_tag[i].parentNode.removeChild(style_tag[i])

        }

        // Remove EQCSS-generated attributes from all tags
        var tag = document.querySelectorAll('*')

        // For each tag in the document
        for (var j = 0; j < tag.length; j++) {

            // Loop through all attributes
            for (var k = 0; k < tag[j].attributes.length; k++) {

                // If an attribute begins with 'data-eqcss-'
                if (tag[j].attributes[k].name.indexOf('data-eqcss-') === 0) {

                    // Remove the attribute from the tag
                    tag[j].removeAttribute(tag[j].attributes[k].name)

                }

            }

        }

    }


    /*
     * 'DOM Ready' cross-browser polyfill / Diego Perini / MIT license
     * Forked from: https://github.com/dperini/ContentLoaded/blob/master/src/contentloaded.js
     */

    EQCSS.domReady = function (fn) {

        var done = false
        var top = true
        var doc = window.document
        var root = doc.documentElement
        var modern = !~navigator.userAgent.indexOf('MSIE 8')
        var add = modern ? 'addEventListener' : 'attachEvent'
        var rem = modern ? 'removeEventListener' : 'detachEvent'
        var pre = modern ? '' : 'on'
        var init = function (e) {

                if (e.type === 'readystatechange' && doc.readyState !== 'complete') return

                (e.type === 'load' ? window : doc)[rem](pre + e.type, init, false)

                if (!done && (done = true)) fn.call(window, e.type || e)

            },
            poll = function () {

                try {

                    root.doScroll('left')

                } catch (e) {

                    setTimeout(poll, 50)
                    return

                }

                init('poll')

            }

        if (doc.readyState === 'complete') fn.call(window, 'lazy')

        else {

            if (!modern && root.doScroll) {

                try {

                    top = !window.frameElement

                } catch (e) {
                }

                if (top) poll()

            }

            doc[add](pre + 'DOMContentLoaded', init, false)
            doc[add](pre + 'readystatechange', init, false)
            window[add](pre + 'load', init, false)

        }

    }


    /*
     * EQCSS.throttle
     * Ensures EQCSS.apply() is not called more than once every (EQCSS_timeout)ms
     */

    var EQCSS_throttle_available = true
    var EQCSS_throttle_queued = false
    var EQCSS_mouse_down = false
    var EQCSS_timeout = 200

    EQCSS.throttle = function () {

        if (EQCSS_throttle_available) {

            EQCSS.apply()
            EQCSS_throttle_available = false

            setTimeout(function () {

                EQCSS_throttle_available = true

                if (EQCSS_throttle_queued) {

                    EQCSS_throttle_queued = false
                    EQCSS.apply()

                }

            }, EQCSS_timeout)

        } else {

            EQCSS_throttle_queued = true

        }

    }

    // Call load (and apply, indirectly) on page load
    EQCSS.domReady(function () {

        EQCSS.load()
        EQCSS.throttle()

    })

    // On resize, scroll, input, click, mousedown + mousemove, call EQCSS.throttle.
    window.addEventListener('resize', EQCSS.throttle)
    window.addEventListener('input', EQCSS.throttle)
    window.addEventListener('click', EQCSS.throttle)

    window.addEventListener('mousedown', function (e) {

        // If left button click
        if (e.which === 1) {

            EQCSS_mouse_down = true

        }

    })

    window.addEventListener('mousemove', function () {

        if (EQCSS_mouse_down) {

            EQCSS.throttle()

        }

    })

    window.addEventListener('mouseup', function () {

        EQCSS_mouse_down = false
        EQCSS.throttle()

    })

    //window.addEventListener('scroll', EQCSS.throttle)
    // => to avoid annoying slowness, scroll events are only listened on elements that have a scroll EQ.

    // Debug: here's a shortcut for console.log
    function l(a) {
        console.log(a)
    }

    return EQCSS

}))

/*!
 * jQuery Searchable Plugin v1.0.0
 * https://github.com/stidges/jquery-searchable
 *
 * Copyright 2014 Stidges
 * Released under the MIT license
 */
;(function ($, window, document, undefined) {

    var pluginName = 'searchable',
        defaults = {
            selector: 'tbody tr',
            childSelector: 'td',
            searchField: '#search',
            striped: false,
            oddRow: {},
            evenRow: {},
            hide: function (elem) {
                elem.hide();
            },
            show: function (elem) {
                elem.show();
            },
            searchType: 'default',
            onSearchActive: false,
            onSearchEmpty: false,
            onSearchFocus: false,
            onSearchBlur: false,
            clearOnLoad: false
        },
        searchActiveCallback = false,
        searchEmptyCallback = false,
        searchFocusCallback = false,
        searchBlurCallback = false;

    function isFunction(value) {
        return typeof value === 'function';
    }

    function Plugin(element, options) {
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);

        this.init();
    }

    Plugin.prototype = {
        init: function () {
            this.$searchElems = $(this.settings.selector, this.$element);
            this.$search = $(this.settings.searchField);
            this.matcherFunc = this.getMatcherFunction(this.settings.searchType);

            this.determineCallbacks();
            this.bindEvents();
            this.updateStriping();
        },

        destroy: function () {
            // Remove event bindings
            this.$search.off('change keyup');
            if (searchFocusCallback) {
                this.$search.off('focus', this.settings.onSearchFocus);
            }
            if (searchBlurCallback) {
                this.$search.off('blur', this.settings.onSearchBlur);
            }

            // Restore original visibility
            this.$searchElems.show();

            // Reset search field
            this.$search.val('');

            // Remove data associated with the plugin
            this.$element.removeData('plugin_' + pluginName);
        },

        determineCallbacks: function () {
            searchActiveCallback = isFunction(this.settings.onSearchActive);
            searchEmptyCallback = isFunction(this.settings.onSearchEmpty);
            searchFocusCallback = isFunction(this.settings.onSearchFocus);
            searchBlurCallback = isFunction(this.settings.onSearchBlur);
        },

        bindEvents: function () {
            var that = this;

            this.$search.on('change keyup', function () {
                that.search($(this).val());

                that.updateStriping();
            });

            if (searchFocusCallback) {
                this.$search.on('focus', this.settings.onSearchFocus);
            }

            if (searchBlurCallback) {
                this.$search.on('blur', this.settings.onSearchBlur);
            }

            if (this.settings.clearOnLoad === true) {
                this.$search.val('');
                this.$search.trigger('change');
            }

            if (this.$search.val() !== '') {
                this.$search.trigger('change');
            }
        },

        updateStriping: function () {
            var that = this,
                styles = ['oddRow', 'evenRow'],
                selector = this.settings.selector + ':visible';

            if (!this.settings.striped) {
                return;
            }

            $(selector, this.$element).each(function (i, row) {
                $(row).css(that.settings[styles[i % 2]]);
            });
        },

        search: function (term) {
            var matcher, elemCount, children, childCount, hide, $elem, i, x;

            if ($.trim(term).length === 0) {
                this.$searchElems.css('display', '');
                this.updateStriping();

                if (searchEmptyCallback) {
                    this.settings.onSearchEmpty(this.$element);
                }

                return;
            } else if (searchActiveCallback) {
                this.settings.onSearchActive(this.$element, term);
            }

            elemCount = this.$searchElems.length;
            matcher = this.matcherFunc(term);

            for (i = 0; i < elemCount; i++) {
                $elem = $(this.$searchElems[i]);
                children = $elem.find(this.settings.childSelector);
                childCount = children.length;
                hide = true;

                for (x = 0; x < childCount; x++) {
                    if (matcher($(children[x]).text())) {
                        hide = false;
                        break;
                    }
                }

                if (hide === true) {
                    this.settings.hide($elem);
                } else {
                    this.settings.show($elem);
                }
            }
        },

        getMatcherFunction: function (type) {
            if (type === 'fuzzy') {
                return this.getFuzzyMatcher;
            } else if (type === 'strict') {
                return this.getStrictMatcher;
            }

            return this.getDefaultMatcher;
        },

        getFuzzyMatcher: function (term) {
            var regexMatcher,
                pattern = term.split('').reduce(function (a, b) {
                    return a + '[^' + b + ']*' + b;
                });

            regexMatcher = new RegExp(pattern, 'gi');

            return function (s) {
                return regexMatcher.test(s);
            };
        },

        getStrictMatcher: function (term) {
            term = $.trim(term);

            return function (s) {
                return (s.indexOf(term) !== -1);
            };
        },

        getDefaultMatcher: function (term) {
            term = $.trim(term).toLowerCase();

            return function (s) {
                return (s.toLowerCase().indexOf(term) !== -1);
            };
        }
    };

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            var pluginInstance = $.data(this, 'plugin_' + pluginName);
            if (pluginInstance) {
                // Plugin already initialized, so destroy it first
                pluginInstance.destroy();
            }
            // Initialize the plugin
            $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
        });
    };

})(jQuery, window, document);

(function(e){function a(e,t,n,r){return Math.abs(e-t)>=Math.abs(n-r)?e-t>0?"Left":"Right":n-r>0?"Up":"Down"}function f(){s=null;if(t.last){t.el.trigger("longTap");t={}}}function l(){if(s)clearTimeout(s);s=null}function c(){if(n)clearTimeout(n);if(r)clearTimeout(r);if(i)clearTimeout(i);if(s)clearTimeout(s);n=r=i=s=null;t={}}function h(e){return(e.pointerType=="touch"||e.pointerType==e.MSPOINTER_TYPE_TOUCH)&&e.isPrimary}function p(e,t){return e.type=="pointer"+t||e.type.toLowerCase()=="mspointer"+t}var t={},n,r,i,s,o=750,u;e(document).ready(function(){var d,v,m=0,g=0,y,b;if("MSGesture"in window){u=new MSGesture;u.target=document.body}e(document).bind("MSGestureEnd",function(e){var n=e.velocityX>1?"Right":e.velocityX<-1?"Left":e.velocityY>1?"Down":e.velocityY<-1?"Up":null;if(n){t.el.trigger("swipe");t.el.trigger("swipe"+n)}}).on("touchstart MSPointerDown pointerdown",function(r){if((b=p(r,"down"))&&!h(r))return;y=b?r:r.touches[0];if(r.touches&&r.touches.length===1&&t.x2){t.x2=undefined;t.y2=undefined}d=Date.now();v=d-(t.last||d);t.el=e("tagName"in y.target?y.target:y.target.parentNode);n&&clearTimeout(n);t.x1=y.pageX;t.y1=y.pageY;if(v>0&&v<=250)t.isDoubleTap=true;t.last=d;s=setTimeout(f,o);if(u&&b)u.addPointer(r.pointerId)}).on("touchmove MSPointerMove pointermove",function(e){if((b=p(e,"move"))&&!h(e))return;y=b?e:e.touches[0];l();t.x2=y.pageX;t.y2=y.pageY;m+=Math.abs(t.x1-t.x2);g+=Math.abs(t.y1-t.y2)}).on("touchend MSPointerUp pointerup",function(s){if((b=p(s,"up"))&&!h(s))return;l();if(t.x2&&Math.abs(t.x1-t.x2)>30||t.y2&&Math.abs(t.y1-t.y2)>30)i=setTimeout(function(){t.el.trigger("swipe");t.el.trigger("swipe"+a(t.x1,t.x2,t.y1,t.y2));t={}},0);else if("last"in t)if(m<30&&g<30){r=setTimeout(function(){var r=e.Event("tap");r.cancelTouch=c;t.el.trigger(r);if(t.isDoubleTap){if(t.el)t.el.trigger("doubleTap");t={}}else{n=setTimeout(function(){n=null;if(t.el)t.el.trigger("singleTap");t={}},250)}},0)}else{t={}}m=g=0}).on("touchcancel MSPointerCancel pointercancel",c);e(window).on("scroll",c)});["swipe","swipeLeft","swipeRight","swipeUp","swipeDown","doubleTap","tap","singleTap","longTap"].forEach(function(t){e.fn[t]=function(e){return this.on(t,e)}})})(window.$)

/*!
 * liricle v4.2.0
 * Lyrics Synchronizer
 * https://github.com/mcanam/liricle#readme
 * MIT license by mcanam
 */
!function(t,n){"object"==typeof exports&&"undefined"!=typeof module?module.exports=n():"function"==typeof define&&define.amd?define(n):(t="undefined"!=typeof globalThis?globalThis:t||self).Liricle=n()}(this,(function(){"use strict";const t=/\[(ar|ti|al|au|by|length|offset|re|ve):(.*)\]/i,n=/\[\d{2}:\d{2}(.\d{2,})?\]/g,e=/<\d{2}:\d{2}(.\d{2,})?>/g,i=/<\d{2}:\d{2}(.\d{2,})?>\s*[^\s|<]*/g;function r(r,l){const c=r.split(/\r?\n/).map((t=>t.trim())),d=l?.skipBlankLine??!0,u={tags:{},lines:[],enhanced:a(r)};return c.forEach((r=>{if(!r)return;const a=function(n){const e=n.match(t),i=e?.[1],r=e?.[2];return i&&r?{[i]:r.trim()}:null}(r),l=function(t,r){const a=[],l=t.match(n);return l?(l.forEach((n=>{const l=s(t);if(!l&&r)return;const c=o(n),d=function(t){const n=[],r=t.match(i);return r?(r.forEach((t=>{const i=t.match(e)?.[0];i&&n.push({time:o(i),text:s(t)})})),n):null}(t);a.push({time:c,text:l,words:d})})),a):null}(r,d);a&&Object.assign(u.tags,a),l&&u.lines.push(...l)})),u.lines=u.lines.sort(((t,n)=>t.time-n.time)),u}function o(t){return function(t){let[n,e]=t.split(":");return n=60*parseFloat(n),e=parseFloat(e),n+e}(t.replace(/\[|\]|<|>/g,""))}function s(t){return t.replace(n,"").replace(e,"").replace(/\s{2,}/g," ").trim()}function a(t){return i.test(t)}function l(t,n){let e=function(t,n){const e=c(t,n);return null!==e?{index:e,...t[e]}:null}(t.lines,n),i=null;return t.enhanced&&e?.words&&(i=function(t,n){if(!t)return null;const e=c(t,n);return null!==e?{index:e,...t[e]}:null}(e.words,n)),delete e?.words,{line:e,word:i}}function c(t,n){const e=[];if(t.forEach((t=>{const i=n-t.time;i>=0&&e.push(i)})),0===e.length)return null;const i=Math.min(...e);return e.indexOf(i)}return class{#t=null;#n=0;#e=null;#i=null;#r=!1;#o=()=>{};#s=()=>{};#a=()=>{};get data(){return this.#t}get offset(){return this.#n}set offset(t){this.#n=t/1e3}load(t){const n=t?.text,e=t?.url,i=t?.skipBlankLine??!0;if(this.#r=!1,this.#e=null,this.#i=null,!n?.trim()&&!e?.trim())throw Error("[Liricle]: text or url options required.");if(n&&e)throw Error("[Liricle]: text and url options cant be used together.");n&&(this.#t=r(n,{skipBlankLine:i}),this.#r=!0,this.#o(this.#t)),e&&fetch(e).then((t=>{if(!t.ok)throw Error("Network error with status "+t.status);return t.text()})).then((t=>{this.#t=r(t,{skipBlankLine:i}),this.#r=!0,this.#o(this.#t)})).catch((t=>{this.#s(t)}))}sync(t,n=!1){if(!this.#r||!this.#t)return console.warn("[Liricle]: lyrics not loaded yet.");const{enhanced:e}=this.#t,{line:i,word:r}=l(this.#t,t+this.#n);if(!i&&!r)return;if(n)return this.#a(i,r);const o=null!==i&&i.index===this.#e,s=null!==r&&r.index===this.#i;e&&r&&o&&s||!e&&o||(this.#a(i,r),this.#e=i?.index??null,this.#i=r?.index??null)}on(t,n){switch(t){case"load":this.#o=n;break;case"loaderror":this.#s=n;break;case"sync":this.#a=n}}}}));

(function( $ ) {
    $.fn.durationjs = function( settings={} ) {
        var $this = $( this );
        var $lastInput;
        var settings = $.extend({
            display: 'dhm', // days hours & minues by default; must be sequential (i.e., no 'dms')
            sInc: 1,
            mInc: 15,
            hInc: 1,
            dInc: 1,
            initVal: 0, // SECONDS -- EVERYTHING IS SECONDS! (for now, I guess)
        }, settings );

        var tUnits = {
            s: { dsp: "Sec", inc: settings.sInc, val: 0, max: 60, rate: 1}, // default save value in seconds, 1 = 1
            m: { dsp: "Min", inc: settings.mInc, val: 0, max: 60, rate: 60},// 60 secs per min, ...
            h: { dsp: "Hrs", inc: settings.hInc, val: 0, max: 24, rate: 3600},
            d: { dsp: "Day", inc: settings.dInc, val: 0, max: 365, rate: 86400}
        }
        // Calculate initialiation values

        // increment value on up/down button and up/down keypress
        var actionUpDown = function($input, goUp, selectIt = false ){
            // get input unit type
            var tUnit = $input.attr('tunit');

            // get input starting value
            var newVal = parseInt($input.val(), 10);
            newVal = ( isNaN( newVal ) ? 0 : newVal );
            newVal += ( goUp ? 1 : -1 ) * tUnits[tUnit].inc;

            // check if newVal is out of range for input
            // if applicable, increment/decrement sibling input
            if (  newVal <= 0 || newVal >= tUnits[tUnit].max ) {
                if ( newVal == 0 || ( newVal < 0 && $input.index() < 2 ) ){
                    newVal = "00";
                } else if ( $input.index() >= 2 ){
                    let $nextUnit = $input.prev().prev();
                    let nextUnitVal = parseInt($nextUnit.val());

                    if ( newVal < 0 && nextUnitVal > 0 ) {
                        $nextUnit.val( nextUnitVal - 1 ).trigger('blur');
                        newVal = tUnits[tUnit].max - tUnits[tUnit].inc;
                    } else if ( newVal > 0 ) {
                        $nextUnit.val( nextUnitVal + 1).trigger('blur');
                        newVal = "00";
                    } else {
                        newVal = "00";
                    }
                }
            }

            $input.val(newVal)[ selectIt ? 'select' : 'blur']();
            return false;
        }

        // Build the HTML inputs
        var $box = $('<div class="duration-box">');
        var inputTypes = settings.display.split("");
        inputTypes.forEach(function (unit) {
            let inputVal = (tUnits[unit].val).toString().padStart(2,'0');
            let $input = $('<input type="text" maxlength="2" class="duration duration-val">').attr('tunit',unit).val(inputVal);
            let $label = $('<label class="duration">').html( tUnits[unit].dsp )

            //add listeners
            $input.on('focus',function(){
                $lastInput = $( this );
                this.select()
            });
            $input.on('blur',function(){
                if ( isNaN( this.value ) ) this.value = '00';
                this.value = this.value.toString().padStart(2,0);
            });
            $input.on('keyup',function( e ){
                // remove non-integer characters
                this.value = this.value.replace(/\D/g,'');

                // if up (38) or down (40) keypress, increment/decrement value
                if ( e.which == 38 || e.which == 40 ) {
                    return actionUpDown( $(this), ( e.which == 38 ), true );
                }
            });
            $box.append( $input, $label );
        });
        var $btnUp = $( '<i class="fas fa-arrow-up"></i>' );
        var $btnDown = $( '<i class="fas fa-arrow-down"></i>' );
        var $btnConfirm = $( '<i class="fas fa-check"></i>' );
        if($('.countdown-timer').html()=='') {
            var $btnReset = $( '<i class="fas fa-stop disabled"></i>' );
        } else {
            var $btnReset = $( '<i class="fas fa-stop"></i>' );
        }
        $box.append($btnUp,$btnDown,$btnConfirm,$btnReset);
        $lastInput = $box.find('.duration-val').last();

        var updateButtonState = function() {
            var totalSeconds = 0;
            $box.find('.duration-val').each(function() {
                var tUnit = $(this).attr('tunit');
                var unitVal = parseInt($(this).val(), 10) || 0;
                totalSeconds += unitVal * tUnits[tUnit].rate;
            });
            if (totalSeconds <= 0) {
                $btnDown.addClass('disabled');
                $btnConfirm.addClass('disabled');
            } else {
                $btnDown.removeClass('disabled');
                $btnConfirm.removeClass('disabled');
            }
        };

        $box.find('.duration-val').on('input blur keyup', updateButtonState);
        $btnUp.on('click', function() { actionUpDown($lastInput, true); updateButtonState(); });
        $btnDown.on('click', function() { actionUpDown($lastInput, false); updateButtonState(); });

        updateButtonState();

        $btnConfirm.on('click', function() {
            var totalSeconds = 0;
            $box.find('.duration-val').each(function() {
                var tUnit = $(this).attr('tunit'); // Get the unit type (s, m, h, d)
                var unitVal = parseInt($(this).val(), 10) || 0; // Get value, default to 0 if NaN
                totalSeconds += unitVal * tUnits[tUnit].rate; // Convert to seconds and sum up
            });
            $btnReset.removeClass('disabled');
            $this.trigger('durationSelected', [totalSeconds]);
        });

        $btnReset.on('click', function() {
            $this.trigger('resetTimer');
            $btnReset.addClass('disabled');
        });

        $this.append( $box );
    };

}( jQuery ));
