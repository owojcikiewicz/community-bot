### Community Bot
The project uses Discord.js for it's bot functionality and Express with a handful of libraries for the API services. One of the more notable features is an authentication system created with Passport. It allows users to connect their Discord and Steam accounts together and retrieve information from gameservers. The bot also features a chat relay buit with web sockets which syncs all messages and creates a chat between all gameservers and the Discord. Less notable features include a support ticket system, reaction roles, server statistics, bug reports pushed from an in-game panel which are automatically sent to a Trello board and a REST API to retrieve information about users.

### History 
The project was started in 2020 and is being maintained to this day. For security reasons, a new repo was created prior to open-sourcing. The original repository has over 500 commits. 

### Demo
The bot is being used on a daily basis on the [Exhibition Roleplay](https://discord.gg/WMJHrqJTrt) discord server. 

### Installation 
Fill out all of the environment variables located in `.env.example` and configure the bot in the `config.json` file. Next, run `npm run build` in order to build the project. After that, simply run `npm run production` to start the bot. You can also run the bot in dev mode using `npm run dev`. 
