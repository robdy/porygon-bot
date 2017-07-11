'use strict';
const db = require('../services/db');

module.exports = {
  db_required: true,
  message_regex: /^.(?:quote)(?: ([^ ]+)|$)(?: (.+)|$)$/,
  allow: ({isMod, isAuthenticated, isPM}) => isMod && isAuthenticated && !isPM,
  response ({message_match: [, command, quote], author_match: [author], channel}) {
    if (!command) {
			command = 'get';
		}
    switch(command.toLowerCase()) {
      case 'add':
      case 'store':
        if (!quote) {
          return 'No quote to store.';
        }
        return db.conn.query('INSERT INTO `Quote` (`Author`, `Message`, `Chan`) VALUES (?, ?, ?);',
          [author, quote, channel]
        ).then(created => `Storing quote '${quote}' from '${author}' on '${channel}', with id '${created.insertId}'`);
			case 'get':
				if (quote) {
					return db.conn.query('SELECT * FROM Quote WHERE Quote.ID = ?', [quote]).get(0).then(result => {
						return result ? `${result.Message} (submitted by ${result.Author})` : `No quote with ID ${quote}`;
					});
				}
				return db.conn.query('SELECT * FROM Quote WHERE Quote.Chan = ? ORDER BY RAND() LIMIT 1', [channel]).get(0).then(result => {
					return `${result.Message} (submitted by ${result.Author})`;
				});
      case 'search':
        if (!quote) {
          return 'No term to search for.';
        }
        return db.conn.query('SELECT * FROM Quote WHERE Quote.Chan = ? AND Quote.Message LIKE ? ORDER BY RAND() LIMIT 1',
          [channel, `%${quote}%`]).get(0).then(result => {
          return result ? `${result.Message} (submitted by ${result.Author})` : `No results for ${quote}`;
        });
			case 'help':
				return [
					'Add \'quote\' to add a new quote',
					'Get \'id\' to get a specific quote, or omit id for a random one',
					'Search \'term\' to search for quote with a searchterm'
				];
    }
  }
};
