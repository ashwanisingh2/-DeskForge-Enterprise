import {startDeskForgeWorkers} from '../lib/queues/workers';

async function main(){
  let workers=startDeskForgeWorkers();
  console.log(`DeskForge workers started: ${workers.map(w=>w.name).join(', ')}`);
  async function shutdown(){
    await Promise.allSettled(workers.map(w=>w.close()));
    process.exit(0);
  }
  process.on('SIGINT',shutdown);
  process.on('SIGTERM',shutdown);
}

main().catch(error=>{
  console.error(error);
  process.exit(1);
});
