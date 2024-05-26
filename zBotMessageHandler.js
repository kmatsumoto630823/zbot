const { getVoiceConnection } = require("@discordjs/voice");
const zBotTextPreprocessor = require("./zBotTextPreprocessor");
const zBotTextToSpeech = require("./zBotTextToSpeech");

async function zBotMessageHandler(message, zBotGData){
    if(message.author.bot) return;

    const guildId = message.guildId;
    const memberId = message.member.id;

    //const { getVoiceConnection } = require("@discordjs/voice");
    const connection = getVoiceConnection(guildId);

    if(!connection) return;

    const guildConfig = zBotGData.initGuildConfigIfUndefined(guildId);

    const onEventTextChannelId = message.channel.id;
    const targetTextChannelId = guildConfig.textChannelId;

    if(onEventTextChannelId !== targetTextChannelId) return;

    const memberSpeakerConfig = zBotGData.initMemberSpeakerConfigIfUndefined(guildId, memberId);

    const text = message.content;
    const dictionary = zBotGData.initGuildDictionaryIfUndefined(guildId);

    //const zBotTextPreprocessor = require("./zBotTextPreprocessor");
    const splitedText = zBotTextPreprocessor(text, dictionary);
    
    const speaker = memberSpeakerConfig;
    const player = connection.state.subscription.player;
    const queue = zBotGData.initGuildQueueIfUndefined(guildId);

    //const zBotTextToSpeech = require("./zBotTextToSpeech");
    await zBotTextToSpeech(splitedText, speaker, player, queue);

    return;
};

module.exports = zBotMessageHandler;