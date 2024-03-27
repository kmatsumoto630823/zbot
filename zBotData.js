require("dotenv").config();

const envDefaultSpeakerEngine = process.env.defaultSpeakerEngine;
const envDefaultSpeakerId = parseInt(process.env.defaultSpeakerId);
const envDefaultSpeakerSpeedScale = Number(process.env.defaultSpeakerSpeedScale);
const envDefaultSpeakerPitchScale = Number(process.env.defaultSpeakerPitchScale);
const envDefaultSpeakerIntonationScale = Number(process.env.defaultSpeakerIntonationScale);

const envGuildConfigsDir = process.env.guildConfigsDir;
const envGuildDictionariesDir = process.env.guildDictionariesDir;

const fs = require("fs");

const zBotData = {
    "zBotGuildConfigs": {},
    "zBotGuildDictionaries": {},
    "zBotGuildPlayers": {},
    "zBotGuildPlayerQueues": {},

    "saveConfig": function(guildId){
        const path = envGuildConfigsDir + "/" + String(guildId) + ".json";
    
        try{
            //const fs = require("fs");
            fs.writeFileSync(path, JSON.stringify(this.zBotGuildConfigs[guildId]));
        }catch{
            return false;
        }

        return true;
    },

    "restoreConfig": function(guildId){
        const defaultGuildConfig = {
            "textChannelId": "",
            "voiceChannelId": "",
            "isReactionSpeach": true,
            "memberSpeakerConfigs": {},
        };
    
        const path = envGuildConfigsDir + "/" + String(guildId) + ".json";
    
        try{
            //const fs = require("fs");
            const text = fs.readFileSync(path);
            this.zBotGuildConfigs[guildId] = JSON.parse(text);
        }catch{
            this.zBotGuildConfigs[guildId] = defaultGuildConfig;
        }

        return true;
    },

    "saveDictionary": function(guildId){
        const path = envGuildDictionariesDir + "/" + String(guildId) + ".json";

        try{
            //const fs = require("fs");
            fs.writeFileSync(path, JSON.stringify(this.zBotGuildDictionaries[guildId]));
        }catch{
            return false;
        }

        return true;
    },

    "restoreDictionary": function(guildId){
        const path = envGuildDictionariesDir + "/" + String(guildId) + ".json";
    
        try{
            //const fs = require("fs");
            const text = fs.readFileSync(path);
            this.zBotGuildDictionaries[guildId] = JSON.parse(text);
        }catch{
            this.zBotGuildDictionaries[guildId] = {};
        }
        
        return true;
    },

    "delete": function(guildId){
        this.zBotGuildPlayers[guildId].stop();
            
        delete this.zBotGuildConfigs[guildId];
        delete this.zBotGuildDictionaries[guildId];
        delete this.zBotGuildPlayers[guildId];
        delete this.zBotGuildPlayerQueues[guildId];        
    },

    "initMemberSpeakerConfigIfUndefined": function(guildId, memberId){
        const guildConfig = this.zBotGuildConfigs[guildId];
        
        if(guildConfig === void 0) return;

        const memberSpeakerConfigs = guildConfig.memberSpeakerConfigs[memberId];

        if(memberSpeakerConfigs !== void 0) return;

        const config = {
            "engine": envDefaultSpeakerEngine,
            "id": envDefaultSpeakerId,
            "speedScale": envDefaultSpeakerSpeedScale,
            "pitchScale": envDefaultSpeakerPitchScale,
            "intonationScale": envDefaultSpeakerIntonationScale,
        };

        this.zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId] = config;
    },

    "setMemberSpeakerConfig": function(guildId, memberId, engine, id, speedScale, pitchScale, intonationScale){
        const guildConfig = this.zBotGuildConfigs[guildId];
        
        if(guildConfig === void 0) return;
        
        const config = {
            "engine": !engine ? envDefaultSpeakerEngine : engine,
            "id": !id ? envDefaultSpeakerId : id,
            "speedScale": !speedScale ? envDefaultSpeakerSpeedScale : speedScale,
            "pitchScale": !pitchScale ? envDefaultSpeakerPitchScale : pitchScale,
            "intonationScale": !intonationScale ? envDefaultSpeakerIntonationScale : intonationScale,
        };

        this.zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId] = config;
    }
};

module.exports = zBotData;
 