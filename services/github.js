const http = require('http');
const createHandler = require('github-webhook-handler');
const config = require('../config.js');
const github = config.github;
const handler = createHandler({ path: '/webhook', secret: config.github_secret });

const setUp = (outputResponse) => {
  http.createServer(function (req, res) {
    handler(req, res, function (err) {
      console.log(err);
      res.statusCode = 404;
      res.end('no such location');
    });
  }).listen(7777);

  handler.on('error', function (err) {
    console.error('Error:', err.message);
  });

  handler.on('push', function (event) {
    const data = event.payload;
    const name = data.repository.full_name;
    const rooms = getRoomsForAction(name, "push");
    const user = data.sender.login;
    const url = data.head_commit.url;
    const ref = data.ref.split('/').slice(-1)[0];
    const number = data.commits.length;

    const string = `${user} pushed ${number} commits to ${ref} on ${name} (head: ${url})`;
    sendToRooms(rooms, string);
  });

  handler.on('pull_request', function (event) {
    const data = event.payload;
    const name = data.repository.full_name;
    const rooms = getRoomsForAction(name, "pull_request");
    const user = data.sender.login;
    const number = data.pull_request.number;
    const title = data.pull_request.title;
    const url = data.pull_request.url;

    let actioned = data.action;
    if (actioned === 'closed' && data.pull_request.merged_at !== null) {
      actioned = "merged";
    } else if (actioned === 'closed') {
      actioned = "closed without merging";
    }

    const string = `${user} ${actioned} PR# ${number} (${title}) on ${name} (${url})`;
    sendToRooms(rooms, string);
  });

  handler.on('issues', function (event) {
    const data = event.payload;
    const name = data.repository.full_name;
    const rooms = getRoomsForAction(name, "issues");
    const user = data.sender.login;
    const actioned = data.action;
    const number = data.issue.number;
    const title = data.issue.title;
    const url = data.issue.url;
    const string = `${user} ${actioned} issue# ${number} (${title}) on ${name} (${url})`;
    sendToRooms(rooms, string);
  });

  const getRoomsForAction = (name, action) => {
    const rooms = github[name]['all'].concat(github[name][action]);
    // Ensure no duplicates
    return [...new Set(rooms)];
  };

  const sendToRooms = (rooms, string) => {
    for (let room in rooms) {
      if (rooms[room]) {
        outputResponse(rooms[room], string);
      }
    }
  };
};


module.exports = {
  setUp: setUp
};
