const { app } = require('electron');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
