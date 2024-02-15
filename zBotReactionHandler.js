const { getVoiceConnection } = require("@discordjs/voice");
const zBotTextPreprocessor = require("./zBotTextPreprocessor");
const zBotTextToSpeech = require("./zBotTextToSpeech");

async function zBotReactionHandler(reaction, user, zBotData){
    const {
        zBotGuildConfigs, 
        zBotGuildDictionaries,
        zBotGuildPlayers,
        zBotGuildPlayerQueues
    } = zBotData;

    if(user.bot) return;
    
    if(reaction.count !== 1) return;

    const guildId = reaction.message.guildId;
    const memberId = user.id;
    const textChannelId = reaction.message.channel.id;

    //const { getVoiceConnection } = require("@discordjs/voice");
    const connection = getVoiceConnection(guildId);

    if(!connection) return;

    if(textChannelId !== zBotGuildConfigs[guildId].textChannelId) return;

    //if(zBotGuildConfigs[guildId].isReactionSpeach === void 0){
    //    zBotGuildConfigs[guildId].isReactionSpeach = true;
    //}

    if(!zBotGuildConfigs[guildId].isReactionSpeach) return;

    zBotData.initMemberSpeakerConfigIfUndefined(guildId, memberId);

    if(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].id < 0) return;

    const text =
        (reaction.emoji.id === null) ? reaction.emoji.name : "<:CustomEmoji:" + reaction.emoji.id + ">";

    //const zBotTextPreprocessor = require("./zBotTextPreprocessor");
    const splitedText = zBotTextPreprocessor(text, zBotGuildDictionaries[guildId]);

    //const zBotTextToSpeech = require("./zBotTextToSpeech");
    zBotTextToSpeech(
        splitedText,
        zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId],
        zBotGuildPlayers[guildId],
        zBotGuildPlayerQueues[guildId]
    )
    .catch((error) => { console.error(error); });

    return;
};

module.exports = zBotReactionHandler;