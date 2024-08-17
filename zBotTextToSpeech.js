require("dotenv").config();

const envVoiceServers = process.env.voiceServers;
const envVoiceServerTextLengthLimit = parseInt(process.env.voiceServerTextLengthLimit);

const envSamplingRate = parseInt(process.env.samplingRate);
const envQueueTimeout = parseInt(process.env.queueTimeout);
const envQueryTimeout = parseInt(process.env.queryTimeout);

const crypto = require("crypto");
const { setTimeout } = require("timers/promises");
const { entersState, AudioPlayerStatus } = require("@discordjs/voice");

async function zBotTextToSpeech(splitedText, speaker, player, queue)
{
    const fullTextLength = splitedText.reduce((sum, text) => sum + text.length, 0);
    if(fullTextLength > envVoiceServerTextLengthLimit){
        splitedText = ["文字数が多すぎます"];
    }

    //const crypto = require("crypto");
    const uuid = crypto.randomUUID();

    enQueue(queue, uuid);

    let count = envQueueTimeout / 100;

    while(queue[0] !== uuid){
        //const { setTimeout } = require("timers/promises");
        await setTimeout(100);

        count--;

        if(queue.length == 0 || count === 0){
            deQueue(queue, uuid);
            return;
        }
    }

    const resources = [];

    for(const text of splitedText){
        const resource = await voiceSynthesis(text, speaker);
        resources.push(resource);
    }

    for(const resource of resources){
        //const { entersState, AudioPlayerStatus } = require("@discordjs/voice");
        await entersState(player, AudioPlayerStatus.Idle, 30 * 1000);

        if(queue.length == 0 || queue[0] !== uuid){
            deQueue(queue, uuid);
            return;
        }

        player.play(resource);
    }

    deQueue(queue, uuid);

    return;
}

const { default: axios } = require("axios");
const { Readable } = require("stream");
const { createAudioResource, StreamType } = require("@discordjs/voice");

async function voiceSynthesis(text, speaker){
    const server = getVoiceServers().find( (x) => { return x.engine === speaker.engine; });

    //const { default: axios } = require("axios");
    const rpc = axios.create({ "baseURL": server.baseURL, "proxy": false, "timeout": envQueryTimeout });

    const response_audio_query = await rpc.post("audio_query?text=" + encodeURIComponent(text) + "&speaker=" + speaker.id, {
        headers:{ "accept": "application/json" },
    });

    if(!response_audio_query || response_audio_query.status !== 200) return;

    const audioQuery = JSON.parse(JSON.stringify(response_audio_query.data));

    audioQuery.speedScale       = speaker.speedScale;
    audioQuery.pitchScale       = speaker.pitchScale;
    audioQuery.intonationScale  = speaker.intonationScale;
    audioQuery.volumeScale      = speaker.volumeScale;

    audioQuery.outputSamplingRate = envSamplingRate;

    const response_synthesis = await rpc.post("synthesis?speaker=" + speaker.id, JSON.stringify(audioQuery), {
        responseType: "arraybuffer",
        headers: {
            "accept": "audio/wav",
            "Content-Type": "application/json"
        }
    });

    if(!response_synthesis || response_synthesis.status !== 200) return;

    //const { Readable } = require("stream");
    const stream = new Readable();

    stream.push(response_synthesis.data);
    stream.push(null);

    //const { createAudioResource, StreamType } = require("@discordjs/voice");
    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
    
    return resource;
}

function enQueue(queue, uuid){
    if(!queue || !uuid) return;

    queue.push(uuid);
    return;
}

function deQueue(queue, uuid){
    if(!queue || !uuid) return;

    const index = queue.indexOf(uuid);

    if(index !== -1){
        queue.splice(0, index + 1);
    }
    
    return;
}

function getVoiceServers(){
    const servers = [];

    for(const splited of envVoiceServers.split(";")){
        const url = new URL(splited.trim());

        const engine = 
            url.searchParams.has("engine") ? url.searchParams.get("engine") : null;
            
        const baseURL = url.origin;

        if(engine === null) return null;

        servers.push({ "engine": engine, "baseURL": baseURL });
    }

    return servers;
}

module.exports = zBotTextToSpeech;
