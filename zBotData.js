require("dotenv").config();

const envDefaultSpeakerEngine = process.env.defaultSpeakerEngine;
const envDefaultSpeakerId = parseInt(process.env.defaultSpeakerId);
const envServerConfigsDir = process.env.serverConfigsDir;
const envServerDictionaryDir = process.env.serverDictionaryDir;


const zBotData = {
    "zBotServerConfigs": {},
    "zBotServerDictionaries": {},
    "zBotServerPlayers": {},
    "zBotServerPlayerQueues": {},

    "saveConfig": function(guildId){
        const fs = require("fs");
        const path = envServerConfigsDir + "/" + String(guildId) + ".json";
    
        try{
            fs.writeFileSync(path, JSON.stringify(this.zBotServerConfigs[guildId]));
        }catch{
            return false;
        }

        return true;
    },

    "restoreConfig": function(guildId){
        const defaultServerConfig = {
            "textChannelId": "",
            "voiceChannelId": "",
            "isReactionSpeach": true,
            "memberSpeakerConfigs": {},
        };
    
        const fs = require("fs");
        const path = envServerConfigsDir + "/" + String(guildId) + ".json";
    
        try{
            const text = fs.readFileSync(path);
            this.zBotServerConfigs[guildId] = JSON.parse(text);
        }catch{
            this.zBotServerConfigs[guildId] = defaultServerConfig;
        }

        return true;
    },

    "saveDictionary": function(guildId){
        const fs = require("fs");
        const path = envServerDictionaryDir + "/" + String(guildId) + ".json";

        try{
            fs.writeFileSync(path, JSON.stringify(this.zBotServerDictionaries[guildId]));
        }catch{
            return false;
        }

        return true;
    },

    "restoreDictionary": function(guildId){
        const fs = require("fs");
        const path = envServerDictionaryDir + "/" + String(guildId) + ".json";
    
        try{
            const text = fs.readFileSync(path);
            this.zBotServerDictionaries[guildId] = JSON.parse(text);
        }catch{
            this.zBotServerDictionaries[guildId] = {};
        }
        
        return true;
    },

    "delete": function(guildId){
        this.zBotServerPlayers[guildId].stop();
            
        delete this.zBotServerConfigs[guildId];
        delete this.zBotServerDictionaries[guildId];
        delete this.zBotServerPlayers[guildId];
        delete this.zBotServerPlayerQueues[guildId];        
    },

    "makeDefaultSpeakerConfig": function(){
        const config = {
            "engine": envDefaultSpeakerEngine,
            "id": envDefaultSpeakerId,
            "speedScale": 1.0,
            "pitchScale": 0.0
        };

        return config;
    }
};

module.exports = zBotData;
 