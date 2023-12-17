require("dotenv").config();

const envVoiceServers = process.env.voiceServers;
const envVoiceServerTextLengthLimit = parseInt(process.env.voiceServerTextLengthLimit);
const envSamplingRate = parseInt(process.env.samplingRate);

module.exports = async function(textLines, speaker, player, queue)
{
    const crypto = require("crypto");
    const uuid = crypto.randomUUID();

    enQueue(queue, uuid);

    let count = 60;
    while(queue[0] !== uuid){
        const {setTimeout} = require("timers/promises");
        await setTimeout(1000);

        count--;

        if(count === 0){
            deQueue(queue, uuid);
            return;
        }
    }

    for(const text of textLines){
        if(text.length > envVoiceServerTextLengthLimit) continue;

        await zBotTextToSpeechImp(text, speaker, player);
    }

    deQueue(queue, uuid);
}

async function zBotTextToSpeechImp(text, speaker, player){

    const server = getVoiceServers().find( (x) => { return x.engine === speaker.engine; });

    const {default: axios} = require("axios");
    const rpc = axios.create({ "baseURL": server.baseURL, "proxy": false });

    const response_audio_query = await rpc.post("audio_query?text=" + encodeURIComponent(text) + "&speaker=" + speaker.id, {
        headers:{"accept": "application/json"},
    })
    .catch((error) => { console.log(error); });

    if(!response_audio_query || response_audio_query.status !== 200) return;

    const audioQuery = JSON.parse(JSON.stringify(response_audio_query.data));
    audioQuery.speedScale = speaker.speedScale;
    audioQuery.pitchScale = speaker.pitchScale;
    audioQuery.outputSamplingRate = envSamplingRate;

    const response_synthesis = await rpc.post("synthesis?speaker=" + speaker.id, JSON.stringify(audioQuery), {
        responseType: "arraybuffer",
        headers: {
            "accept": "audio/wav",
            "Content-Type": "application/json"
        }
    })
    .catch((error) => { console.log(error); });


    if(!response_synthesis || response_synthesis.status !== 200) return;

    const {Readable} = require("stream");
    const stream = new Readable();
    stream.push(response_synthesis.data);
    stream.push(null);

    
    const {
        createAudioResource,
        StreamType,
        entersState,
        AudioPlayerStatus
    } = require("@discordjs/voice");

    const resource = createAudioResource(stream, {inputType: StreamType.Arbitrary});

    await entersState(player, AudioPlayerStatus.Idle, 60 * 1000)
    .catch((error) => { console.log(error); });

    player.play(resource);
}

function enQueue(queue, uuid){
    queue.push(uuid);    
}

function deQueue(queue, uuid){
    const index = queue.indexOf(uuid);
    if(index !== -1){
        queue.splice(0, index + 1);
    }     
}

function getVoiceServers(){
    const servers = [];

    for(const splited of envVoiceServers.split(";")){
        const url = new URL(splited);

        const engine = url.searchParams.has("engine") ? url.searchParams.get("engine") : null;
        const baseURL = url.origin;

        if(engine === null) return null;

        servers.push({ "engine": engine, "baseURL": baseURL });
    }

    return servers;
}
