const DATA_URL = 'https://jsonp.afeld.me/?url=https://data.c3voc.de/camp2019/everything.schedule.json';
//const DATA_URL = 'everything.schedule.json';

function getMaxBodyHeight() {
    var body = document.body;
    var html = document.documentElement;
    return Math.max( 
        body.scrollHeight, 
        body.offsetHeight,
        html.clientHeight, 
        html.scrollHeight,
        html.offsetHeight
    );
}

function parseDuration(s) {
    var duration = 0;
    var d = s.split(':').reverse();
    for (var i=0; i<d.length; i++) {
        duration += i>0 ? Number(d[i])*(60*i) : Number(d[i]);
    }
    return duration;
}

window.Timeline = {

    loadData: function(callback) {
        fetch(DATA_URL).then(function(r) {
            return r.json() ;
        }).then(function(data) {
          const conference = data.schedule.conference;
          if (callback) callback(conference);
        });
    },

    getItems: function(conference) {
        const days = conference.days;

        var types = new Set();

        days.forEach((day) => {
            var rooms = day.rooms;
            var roomKeys = Object.keys(rooms);
            roomKeys.forEach((roomName) => {
                var talks = rooms[roomName];
                talks.forEach((talk) => { 
                    var item = {
                        id: talk.id,
                        type: 'point',
                        content: talk.title,
                        start: moment(talk.date),
                        group: roomName
                    };

                    if (talk.url) {
                        item.content = `<a 
                            href="${talk.url}" 
                            title="${talk.description || talk.title}" 
                            target="_blank"
                        >${talk.title}</a>`
                    }

                    if (talk.duration) {
                        var durationInMinutes = parseDuration(talk.duration);
                        item.end = moment(talk.date).add(durationInMinutes, 'minutes');
                        item.type = 'range'
                    } else {
                        console.warn(`No duration found for item ${talk.guid}`);
                    }

                    if (talk.type) {
                        type = talk.type;
                        type = type.replace(' ', '_');
                        type = type.replace('(', '').replace(')', '');
                        item.className = type;
                        types.add(type);
                    }

                    if (!this.items.get(item.id)) {
                        this.items.add(item);
                    } else {
                        console.warn(`entry with id ${item.id} already exists! I'm updating instead...`);
                        this.items.update(item);
                    } 
                });
            })
        });
        console.log("Types: ", types);
        return this.items;
    },

    getGroups: function(conference) {
        const days = conference.days;
        days.forEach((day) => {
            var rooms = day.rooms;
            var roomKeys = Object.keys(rooms);
            roomKeys.forEach((roomName) => {
                if (!this.groups.get(roomName)) {
                    this.groups.add({
                        id: roomName,
                        //content: `<a href="${session.locationHref}" target="_blank">${roomName}</a>`
                        content: roomName
                    });
                }
            });
        });
        return this.groups
    },

    getOptions(conference) {
        return {
            start: new Date(),
            //end: new Date("2019-08-26T18:00:00"),
            end: new Date(1000*60*60*3 + (new Date()).valueOf()),
            min: new Date("2019-08-21T09:00:00"),
            max: new Date("2019-08-26T00:00:00"),
            zoomMin: 1000*60*60*1,
            zoomMax: 1000*60*60*19,
            verticalScroll: true, 
            zoomKey: 'ctrlKey',
            orientation: {
                axis: 'top'
            },
            maxHeight: getMaxBodyHeight(),
            loadingScreenTemplate: function() {
                return '<h1>loading sessions...</h1>'
            },
            rollingMode: {
                follow: true,
                offset: 0.5
            },
            hiddenDates: [
                {start: '2019-08-21 04:00:00', end: '2019-08-21 08:59:59', repeat: 'daily' }
            ],
            groupOrder: function (a, b) {
                return a.id.localeCompare(b.id);
            },
        };
    },

    init: function(containerId) {
        console.log("init");

        this.items = new vis.DataSet();
        this.groups = new vis.DataSet();

        this.container = document.getElementById(containerId);
        this.loadData(function(conference) {
            this.items = this.getItems(conference);
            this.groups = this.getGroups(conference);
            this.options = this.getOptions(conference);
            this.timeline = new vis.Timeline(this.container, this.items, this.groups, this.options);
        }.bind(this));
    },

    redraw: function() {
        console.log("redraw");
    }

}