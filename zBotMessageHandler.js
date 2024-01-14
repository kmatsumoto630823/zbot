require("dotenv").config();

async function zBotMessageHandler(message, zBotData){
    const {
        zBotServerConfigs, 
        zBotServerDictionaries,
        zBotServerPlayers,
        zBotServerPlayerQueues
    } = zBotData;

    if(message.author.bot) return;

    const guildId = message.guildId;
    const memberId = message.member.id;
    const textChannelId = message.channel.id;

    const { getVoiceConnection } = require("@discordjs/voice");
    const connection = getVoiceConnection(guildId);

    if(!connection) return;

    if(textChannelId !== zBotServerConfigs[guildId].textChannelId) return;

    const conf = zBotServerConfigs[guildId].memberSpeakerConfigs;
    if(conf[memberId] === void 0){
        conf[memberId] = zBotData.makeDefaultSpeakerConfig();        
    }

    if(conf[memberId].id < 0) return;

    //const text = message.cleanContent;
    const text = message.content;
    console.log(text);

    const zBotTextPreprocessor = require("./zBotTextPreprocessor");
    const textLines = zBotTextPreprocessor(text, zBotServerDictionaries[guildId]);

    const zBotTextToSpeech = require("./zBotTextToSpeech");
    zBotTextToSpeech(
        textLines,
        zBotServerConfigs[guildId].memberSpeakerConfigs[memberId],
        zBotServerPlayers[guildId],
        zBotServerPlayerQueues[guildId]
    )
    .catch((error) => { console.log(error); });
};

module.exports = zBotMessageHandler;