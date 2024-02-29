const { getVoiceConnection } = require("@discordjs/voice");
const zBotTextPreprocessor = require("./zBotTextPreprocessor");
const zBotTextToSpeech = require("./zBotTextToSpeech");

async function zBotMessageHandler(message, zBotData){
    const {
        zBotGuildConfigs, 
        zBotGuildDictionaries,
        zBotGuildPlayers,
        zBotGuildPlayerQueues
    } = zBotData;

    if(message.author.bot) return;

    const guildId = message.guildId;
    const memberId = message.member.id;
    const textChannelId = message.channel.id;

    //const { getVoiceConnection } = require("@discordjs/voice");
    const connection = getVoiceConnection(guildId);

    if(!connection) return;

    if(textChannelId !== zBotGuildConfigs[guildId].textChannelId) return;

    zBotData.initMemberSpeakerConfigIfUndefined(guildId, memberId);

    if(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].id < 0) return;

    const text = message.content;

    //const zBotTextPreprocessor = require("./zBotTextPreprocessor");
    const splitedText = zBotTextPreprocessor(text, zBotGuildDictionaries[guildId]);

    //const zBotTextToSpeech = require("./zBotTextToSpeech");
    await zBotTextToSpeech(
        splitedText,
        zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId],
        zBotGuildPlayers[guildId],
        zBotGuildPlayerQueues[guildId]
    );

    return;
};

module.exports = zBotMessageHandler;