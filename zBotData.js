require("dotenv").config();

const envDefaultSpeakerEngine = process.env.defaultSpeakerEngine;
const envDefaultSpeakerId = parseInt(process.env.defaultSpeakerId);
const envDefaultSpeakerSpeedScale = Number(process.env.defaultSpeakerSpeedScale);
const envDefaultSpeakerPitchScale = Number(process.env.defaultSpeakerPitchScale);
const envDefaultSpeakerIntonationScale = Number(process.env.defaultSpeakerIntonationScale);

const envGuildConfigsDir = process.env.guildConfigsDir;
const envGuildDictionariesDir = process.env.guildDictionariesDir;

const fs = require("fs");
const crypto = require("crypto");

const zBotData = {
    "zBotGuildConfigs": {},
    "zBotGuildDictionaries": {},
    "zBotGuildPlayers": {},
    "zBotGuildPlayerQueues": {},

    "initGuildConfig": function(guildId){
        const defaultConfig = {
            "textChannelId": "",
            "voiceChannelId": "",
            "isReactionSpeach": true,
            "memberSpeakerConfigs": {},
        };

        this.zBotGuildConfigs[guildId] = defaultConfig;

        return;
    },

    "initGuildConfigIfUndefined": function(guildId){
        const guildConfig = this.zBotGuildConfigs[guildId];
        
        if(guildConfig !== void 0) return;

        this.initGuildConfig(guildId);

        return;
    },

    "initMemberSpeakerConfig": function(guildId, memberId){
        const guildConfig = this.zBotGuildConfigs[guildId];
        
        if(guildConfig === void 0) return;

        const defaultConfig = {
            "engine": envDefaultSpeakerEngine,
            "id": envDefaultSpeakerId,
            "speedScale": envDefaultSpeakerSpeedScale,
            "pitchScale": envDefaultSpeakerPitchScale,
            "intonationScale": envDefaultSpeakerIntonationScale,
        };

        this.zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId] = defaultConfig;
        
        return;
    },

    "initMemberSpeakerConfigIfUndefined": function(guildId, memberId){
        const guildConfig = this.zBotGuildConfigs[guildId];
        
        if(guildConfig === void 0) return;

        const memberSpeakerConfigs = guildConfig.memberSpeakerConfigs[memberId];

        if(memberSpeakerConfigs !== void 0) return;

        this.initMemberSpeakerConfig(guildId, memberId);

        return;
    },

    "initGuildDictionary": function(guildId){
        const defaultDictionary = {};

        this.zBotGuildDictionaries[guildId] = defaultDictionary;

        return;
    },

    "initGuildDictionaryIfUndefined": function(guildId){
        const guildDictionary = this.zBotGuildDictionaries[guildId];
        
        if(guildDictionary !== void 0) return;

        this.initGuildDictionary(guildId);

        return;
    },

    "restoreConfig": function(guildId){
        const path = envGuildConfigsDir + "/" + String(guildId) + ".json";
    
        try{
            //const fs = require("fs");
            const text = fs.readFileSync(path);
            this.zBotGuildConfigs[guildId] = JSON.parse(text);
        }catch{
            this.initGuildConfigIfUndefined(guildId);
        }

        //const crypto = require("crypto");
        const uuidPropertyName = crypto.createHash("md5").update(`GUILD-CONFIG-${guildId}`).digest("hex");
        const uuid = crypto.randomUUID();

        this.zBotGuildConfigs[guildId][uuidPropertyName] ??= uuid;

        return true;
    },

    "saveConfig": function(guildId){
        const path = envGuildConfigsDir + "/" + String(guildId) + ".json";

        //const crypto = require("crypto");
        const uuidPropertyName = crypto.createHash("md5").update(`GUILD-CONFIG-${guildId}`).digest("hex");

        try{
            const text = fs.readFileSync(path);
            const uuid = this.zBotGuildConfigs[guildId][uuidPropertyName];

            if(text.includes(uuidPropertyName) && !text.includes(uuid)) return false;
        }catch{
            //Nothing To Do.
        }
    
        try{
            //const fs = require("fs");
            fs.writeFileSync(path, JSON.stringify(this.zBotGuildConfigs[guildId]));
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
            this.initGuildDictionaryIfUndefined(guildId);
        }

        //const crypto = require("crypto");
        const uuidPropertyName = crypto.createHash("md5").update(`GUILD-DICTIONARY-${guildId}`).digest("hex");
        const uuid = crypto.randomUUID();

        this.zBotGuildDictionaries[guildId][uuidPropertyName] ??= uuid;

        return true;
    },

    "saveDictionary": function(guildId){
        const path = envGuildDictionariesDir + "/" + String(guildId) + ".json";

        //const crypto = require("crypto");
        const uuidPropertyName = crypto.createHash("md5").update(`GUILD-DICTIONARY-${guildId}`).digest("hex");

        try{
            const text = fs.readFileSync(path);
            const uuid = this.zBotGuildDictionaries[guildId][uuidPropertyName];

            if(text.includes(uuidPropertyName) && !text.includes(uuid)) return false;
        }catch{
            //Nothing To Do.
        }

        try{
            //const fs = require("fs");
            fs.writeFileSync(path, JSON.stringify(this.zBotGuildDictionaries[guildId]));
        }catch{
            return false;
        }

        return true;
    },

    "delete": function(guildId){
        this.zBotGuildPlayers[guildId].stop();
            
        delete this.zBotGuildConfigs[guildId];
        delete this.zBotGuildDictionaries[guildId];
        delete this.zBotGuildPlayers[guildId];
        delete this.zBotGuildPlayerQueues[guildId];
        
        return;
    }
};

module.exports = zBotData;
 