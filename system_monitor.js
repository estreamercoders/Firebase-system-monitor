/**
 * Autor: Mario Pérez Esteso <mario@geekytheory.com>
 * Web: geekytheory.com
 */
 
const {intervals} = require('./config'),
  {execHandler, errorHandler, saveData} = require('./utils');


// Function for checking memory
execHandler("egrep --color 'MemTotal' /proc/meminfo | egrep '[0-9.]{4,}' -o")
  .then(stdout => {
    saveData('memoryTotal', stdout);
  })
  .catch(errorHandler);

execHandler("hostname")
  .then(stdout => saveData('hostname', stdout))
  .catch(errorHandler);

execHandler("uptime | tail -n 1 | awk '{print $1}'")
  .then(stdout => saveData('uptime', stdout))
  .catch(errorHandler);
  
execHandler("uname -r")
  .then(stdout => saveData('kernel', stdout))
  .catch(errorHandler);

execHandler("top -d 1 -b -n2 | tail -n 10 | awk '{print $12}'")
  .then(stdout => saveData('toplist', stdout))
  .catch(errorHandler);


setInterval(function() {

    Promise.all([
        execHandler("egrep --color 'MemFree' /proc/meminfo | egrep '[0-9.]{4,}' -o"),
        execHandler("egrep --color 'Buffers' /proc/meminfo | egrep '[0-9.]{4,}' -o"),
        execHandler("egrep --color 'Cached' /proc/meminfo | egrep '[0-9.]{4,}' -o"),
        execHandler("egrep --color 'MemTotal' /proc/meminfo | egrep '[0-9.]{4,}' -o")
      ])
      .then(stdouts => {
        const memFree = stdouts[0];
        const memBuffered = stdouts[1];
        const memCached = stdouts[2];
        const memTotal = stdouts[3];
        
        const memUsed = parseInt(memTotal, 10) - parseInt(memFree, 10);
        const percentUsed = Math.round(parseInt(memUsed, 10) * 100 / parseInt(memTotal, 10));
        const percentFree = 100 - percentUsed;
        const percentBuffered = Math.round(parseInt(memBuffered, 10) * 100 / parseInt(memTotal, 10));
        const percentCached = Math.round(parseInt(memCached, 10) * 100 / parseInt(memTotal, 10));
        
        saveData('memoryUpdate', {percentFree, percentUsed, percentBuffered, percentCached});
        
      }).catch(errorHandler);


    // Function for measuring temperature
    execHandler("cat /sys/class/thermal/thermal_zone0/temp")
      .then(stdout => {
        const date = new Date().getTime();
        const temp = parseFloat(stdout) / 1000;
        saveData('temperatureUpdate', {date, temp});
      })
      .catch(errorHandler);

}, intervals.short);

// Uptime
setInterval(function() {
    execHandler("uptime | tail -n 1 | awk '{print $3 $4 $5}'")
      .then(stdout => saveData('uptime', stdout))
      .catch(errorHandler);
      
}, intervals.medium);

// TOP list
setInterval(function() {
    execHandler("ps aux --width 30 --sort -rss --no-headers | head  | awk '{print $11}'")
      .then(stdout => saveData('toplist', stdout.split("\n").filter(item => item)))
      .catch(errorHandler);

    execHandler("top -d 1 -b -n2 | grep 'Cpu(s)'|tail -n 1 | awk '{print $2 + $4}'")
      .then(stdout => {
        const date = new Date().getTime();
        saveData('cpuUsageUpdate', {date, use: parseFloat(stdout)});
      })
      .catch(errorHandler);
    
}, intervals.long);


