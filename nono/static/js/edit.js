var countId;
var curLineId;
var lines = [];

function addYoutube(videoId) {
    swfobject.embedSWF('http://www.youtube.com/v/' + videoId + '?enablejsapi=1&playerapiid=video&version=3',
                       'video', "550", "360", "8", null, null, 
                       {allowScriptAccess: "always"}, {id: 'video'});
}

function getYoutubeId(url) {
    var match1 = url.match(/.+youtube.com\/watch\?.*(v=([^&]+)).*/);
    var match2 = url.match(/youtu.be\/(.+)/);
    var videoId = null;
    if(match1 != null)
        videoId = match1[2];
    if(match2 != null)
        videoId = match2[1];
    return videoId;
}

function getTimeStr(seconds) {
    seconds = parseFloat(String(seconds));
    if(seconds < 0)
        seconds = 0;
    if(seconds > 60 * 60)
        seconds = 60 * 60 - 0.1;
    var date = new Date(seconds * 1000.0);
    var mm = ((date.getMinutes() < 10) ? '0' : '') + date.getMinutes();
    var ss = ((date.getSeconds() < 10) ? '0' : '') + date.getSeconds();
    var ii = Math.floor(date.getMilliseconds() / 100.0);
    return (mm + ':' + ss + '.' + ii);
}

function parseTimeStr(str) {
    var match = $.trim(str).match(/(\d+):(\d+)\.(\d)/);
    if(match == null)
        return null;
    var mm = parseInt(match[1]);
    var ss = parseInt(match[2]);
    var ii = parseInt(match[3]);
    return (mm * 60 + ss + ii / 10.0);
}

function setTiming(timing) {
    timing.val(getTimeStr(video.getCurrentTime()));
}

function startCount(timing) {
    countId = setInterval(function() {
        setTiming(timing);
        if(timing.attr('id') == 'start-timing')
            lines[curLineId].start = $('#start-timing').val();
        else if(timing.attr('id') == 'end-timing')
            lines[curLineId].end = $('#end-timing').val();
        updateAllLines();
    }, 90);
}

function disableAllChecks() {
    $.each([$('#start-check'), $('#end-check')], function(idx, value) {
        value.removeClass('btn-success')
             .removeClass('btn-info')
             .addClass('btn-disabled');
    });
}

function setCheckClick(check) {
    check.removeClass('btn-disabled').addClass('btn-info');
    check.click(function() {
        if(check.hasClass('btn-disabled') || check.hasClass('btn-success') || !check.hasClass('btn-info'))
            return;
        check.removeClass('btn-info').addClass('btn-success');
        clearInterval(countId);
        if(check.attr('id') == 'start-check') {
            startCount($('#end-timing'));
            $('#end-check').removeClass('btn-disabled').addClass('btn-info');
            setTiming($('#start-timing'));
            lines[curLineId].start = $('#start-timing').val();
        } else if(check.attr('id') == 'end-check') {
            video.pauseVideo();
            setTiming($('#end-timing'));
            lines[curLineId].end = $('#end-timing').val();
        }
        updateAllLines();
    });
}

function createLine() {
    var lineId;
    while(true) {
        lineId = Math.floor(Math.random() * 100000);
        if($.inArray(lineId, Object.keys(lines)) == -1)
            break;
    }
    var pos = Object.keys(lines).length;
    lines[lineId] = {
        words: '一句台詞',
        start: '00:00.0',
        end: '00:00.0',
        pos: pos,
        id: lineId,
    };
    return lineId;
}

function updateAllLines() {
    var sortedLines = [];
    for(var lineId in lines)
        sortedLines.push(lines[lineId]);

    sortedLines.sort(function(line1, line2) {
        if(line1.pos < line2.pos)
            return -1;
        if(line1.pos > line2.pos)
            return 1;
        return 0;
    });

    $('#lines-content').empty();
    $.each(sortedLines, function(idx, value) {
        var words = $('<h4/>').addClass('todo-name')
                              .html(value.words);
        if($.trim(value.words) == '')
            words.html($('<br/>'));
        var line = $('<div/>').attr('id', 'line-' + value.id)
                              .addClass('todo-content')
                              .append(words)
                              .append($('<span>').html(value.start + ' - ' + value.end));
        if(curLineId == value.id)
            line.prepend($('<span/>').addClass('fui-check'));
        line.click(function() {
            curLineId = value.id;
            updateAllLines();
        });
        $('#lines-content').append($('<li/>').append(line));
    });
}

function showCurDetail() {
    $('#input-line').val(lines[curLineId].words);
    if(video.getPlayerState() != 1) {
        $('#start-timing').val(lines[curLineId].start);
        $('#end-timing').val(lines[curLineId].end);
    }
}

function addNewLine() {
    curLineId = createLine();
    updateAllLines();
    showCurDetail();
    disableAllChecks();
    $('#start-check').removeClass('btn-disabled').addClass('btn-info');
    video.playVideo();
    startCount($('#start-timing'));
}

function putAddNewLine() {
    var add = $('<div/>').addClass('todo-content')
                         .append($('<div/>').addClass('fui-plus'))
                         .append($('<h4/>').addClass('todo-name').html('新增一句'));
    add.click(function() {
        clearInterval(countId);
        if(lines[curLineId].end == '00:00.0') {
            console.log(video.getCurrentTime());
            var seconds = video.getCurrentTime();
            lines[curLineId].end = getTimeStr(seconds);
            updateAllLines();
        }
        addNewLine();
    });
    $('#lines-add').append($('<li/>').addClass('todo-done').append(add));
}

function enableTiming(timing) {
    timing.removeAttr('disabled');
    timing.keydown(function(evt) {
        if(video.getPlayerState() == 1)
            return false;
        var code = evt.which;
        console.log(code);
        var valid = (code >= 48 && code <= 57) || // left numbers
                    (code >= 96 && code <= 105) || // right numbers
                    (code >= 37 && code <= 40) || // arrow keys
                    code == 8 || // backspace
                    code == 46 || // delete
                    code == 186; // colon sign
        if(!valid)
            return false;

        if(code == 38 || code == 40) {
            var times = parseTimeStr(timing.val());
            if(times == null)
                showCurDetail();
            else {
                if(code == 38)
                    seconds += 0.2;
                else if(code == 40)
                    seconds -= 0.2;
                timing.val(getTimeStr(seconds));
            }
            return false;
        }

        return true;
    });
}

function enableInputLine() {
    $('#input-line').removeAttr('disabled')
                    .keyup(function(evt) {
                        lines[curLineId].words = $('#input-line').val();
                        updateAllLines();
                    });
}

function showVideo() {
    var url = $.trim($('#youtube-url').val());
    if(url == '') {
        $('#youtube-msg').html('請輸入 Youtube 的網址!!');
        return;
    }
    var videoId = getYoutubeId(url);
    if(videoId == null) {
        $('#youtube-msg').html('網址好像怪怪的!!');
        return;
    }

    $('#video').empty();
    $('#right').css('float', 'right')
               .css('margin-right', '30px');
    addYoutube(videoId);
}

function onYouTubePlayerReady(playerId) {
    setCheckClick($('#start-check'));
    setCheckClick($('#end-check'));
    enableTiming($('#start-timing'));
    enableTiming($('#end-timing'));
    putAddNewLine();
    addNewLine();
    enableInputLine();
}

$('#youtube-submit').click(showVideo);
$('#youtube-url').focus();
$('#youtube-url').keyup(function(evt) {
    if(evt.which == 13)
        showVideo();
});

