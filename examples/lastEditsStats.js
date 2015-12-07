/**
 * Gets stats for the recent changes:
 *  - most active editors
 *  - most actively edited articles
 */
'use strict';

var bot = require('..'),
	client = new bot('config.js'),
	START = '2015-10-22 00:00:00',
	END = '2015-10-26 23:59:59',
	PRINT_PAGES_STATS = false,
	PRINT_USERS_STATS = true,
	LIMIT = 5000;

function recentChangesCallback(err, data, next) {
        var usersStats = {},
                pagesStats = {},
                count = 0,
                from,
                to;

        data.forEach(function(entry) {
                if (count >= LIMIT) {
                        return;
                }

                count++;

                // only main namespace
                if (entry.ns !== 0) {
                        return;
                }

                // register timestamp
                if (!from) {
                        from = entry.timestamp;
                }

                to = entry.timestamp;

                // console.log(JSON.stringify(entry));

                // register pages stats
                if (!pagesStats[entry.title]) {
                        pagesStats[entry.title] = {
                                title: entry.title,
                                edits: 0,
                                editors: [],
                                diff: 0
                        };
                }

                var pagesItem = pagesStats[entry.title];
                pagesItem.edits++;

                if (pagesItem.editors.indexOf(entry.user) === -1) {
                        pagesItem.editors.push(entry.user);
                }

                // register users stats
                if (!usersStats[entry.user]) {
                        usersStats[entry.user] = {
                                user: entry.user,
                                edits: 0,
                                created: 0,
                                diff: 0
                        };

                        // mark bots
                        if (typeof entry.bot !== 'undefined') {
                                usersStats[entry.user].bot = true;
                        }
                }

                var usersItem = usersStats[entry.user];

                switch(entry.type) {
                        case 'new':
                                usersItem.created++;
                                break;

                        default:
                        case 'edit':
                                usersItem.edits++;
                }

                // edit size difference
                var diff = entry.newlen - entry.oldlen;
                pagesItem.diff += diff;
                usersItem.diff += diff;
        });

        // generate an array of results
        var key,
                pages = [],
                users = [];

        for (key in pagesStats) {
                pages.push(pagesStats[key]);
        }

        for (key in usersStats) {
                users.push(usersStats[key]);
        }

        // sort them
        pages.sort(function(a, b) {
                return b.edits - a.edits;
        });

        users.sort(function(a, b) {
                return b.diff - a.diff;
        });

        // emit results
        console.log('Stats for the last ' + count + ' recent changes (from ' + from + ' back to ' + to + ')...');

        if(PRINT_PAGES_STATS) {
          console.log('Pages statistcs:');
          console.log(pages);
        }

        if(PRINT_USERS_STATS) {
          console.log('Users statistcs:');
          console.log(users);
        }
}

client.getRecentChanges(START, END, recentChangesCallback);

