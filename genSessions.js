const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');

const WIKI_BASE = "https://events.ccc.de";
const TIMETABLE = "/camp/2019/wiki/Static:Timetable";

function parseSessions(data) {
    var sessions = []
    const $ = cheerio.load(data);
    $('table.wikitable > tbody > tr').each((i, row) => {
        const title = $(row).find('.Has-event-title').text();

        var sessionHref = $(row).find('.Has-event-title a').attr('href');
        sessionHref = sessionHref ? `${WIKI_BASE}${sessionHref}` : undefined;        

        const session = $(row).find('.Session').text();

        var start = $(row).find('.Start').text();
        start = moment(start, "DD MMMM YYYY kk:mm:ss");
        
        var duration = $(row).find('.Duration').attr('data-sort-value');
        duration = Number(duration) || undefined;
        
        var end = undefined;
        if (start && duration) {
            end = start.clone().add(duration, 'minutes');
        }

        const location = $(row).find('.Location').text();
        var locationHref = $(row).find('.Location a').attr('href');
        locationHref = locationHref ? `${WIKI_BASE}${locationHref}` : undefined;        
        
        if (title && start && start.isValid()) {
            sessions.push({
                title,
                sessionHref,
                session,
                start: start ? start.toDate() : start,
                end: end ? end.toDate() : end,
                duration,
                location,
                locationHref
            });
        }
    });
    return sessions;
}

(async () => {
    try {
        const response = await axios.get(`${WIKI_BASE}${TIMETABLE}`);
        const sessions = parseSessions(response.data);
        fs.writeFileSync("sessions.json", JSON.stringify(sessions));
    } catch(err) {
        console.error(err);
        process.exit(err);
    }
})();
