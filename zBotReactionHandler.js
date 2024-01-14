require("dotenv").config();

async function zBotReactionHandler(reaction, user, zBotData){
    const {
        zBotServerConfigs, 
        zBotServerDictionaries,
        zBotServerPlayers,
        zBotServerPlayerQueues
    } = zBotData;

    if(user.bot) return;
    if(reaction.count !== 1) return;

    const guildId = reaction.message.guildId;
    const memberId = user.id;
    const textChannelId = reaction.message.channel.id;

    const { getVoiceConnection } = require("@discordjs/voice");
    const connection = getVoiceConnection(guildId);

    if(!connection) return;

    if(textChannelId !== zBotServerConfigs[guildId].textChannelId) return;

    if(zBotServerConfigs[guildId].isReactionSpeach === void 0){
        zBotServerConfigs[guildId].isReactionSpeach = true;
    }

    if(!zBotServerConfigs[guildId].isReactionSpeach) return;

    const conf = zBotServerConfigs[guildId].memberSpeakerConfigs;

    if(conf[memberId] === void 0){
        conf[memberId] = zBotData.makeDefaultSpeakerConfig();        
    }

    if(conf[memberId].id < 0) return;

    const text =
        (reaction.emoji.id === null) ? reaction.emoji.name : "<:CustomEmoji:" + reaction.emoji.id + ">";

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

module.exports = zBotReactionHandler;