require("dotenv").config();
const envVoiceServers = process.env.voiceServers;
const envSpeakerSpeedScaleUpperLimit = Number(process.env.speakerSpeedScaleUpperLimit);
const envSpeakerSpeedScaleLowerLimit = Number(process.env.speakerSpeedScaleLowerLimit);
const envSpeakerPitchScaleUpperLimit = Number(process.env.speakerPitchScaleUpperLimit);
const envSpeakerPitchScaleLowerLimit = Number(process.env.speakerPitchScaleLowerLimit);

const zBotSlashCommands = [
    {
        "name": "connect",
        "description": "zBotを接続します",
        "options": [
            {
                "type": 7,
                "channel_types": [0],
                "name": "text",
                "description": "読み上げ「元」のテキストチャンネルを選択してください",
                "required": true
            },
            {
                "type": 7,
                "channel_types": [2],
                "name": "voice",
                "description": "読み上げ「先」のボイスチャンネルを選択してください",
                "required": true
            }
        ],

        "excute": async function(interaction, zBotData){
            const {
                zBotGuildConfigs, 
                zBotGuildPlayers,
                zBotGuildPlayerQueues,
            } = zBotData;

            const guildId = interaction.guildId;
            const textCannelId = interaction.options.getChannel("text").id;
            const voiceCannelId = interaction.options.getChannel("voice").id;
            const adapterCreator = interaction.guild.voiceAdapterCreator;
    
            const { joinVoiceChannel } = require("@discordjs/voice");

            const connection = joinVoiceChannel({
                "channelId": voiceCannelId,
                "guildId": guildId,
                "adapterCreator": adapterCreator,
            });
    
            if(!connection){
                interaction.reply("接続に失敗しました")
                .catch((error) => { console.error(error); });

                return;
            }
    
            const { createAudioPlayer, NoSubscriberBehavior } = require("@discordjs/voice");

            const player = createAudioPlayer({
                behaviors: {
                  noSubscriber: NoSubscriberBehavior.Pause,
                },
            });
    
            if(!player){
                connection.destroy();

                interaction.reply("プレイヤーの生成に失敗しました")
                .catch((error) => { console.error(error); });

                return;
            }
    
            const subscribe = connection.subscribe(player);

            if(!subscribe){
                connection.destroy();
                
                interaction.reply("音声チャンネルへのプレイヤーの接続に失敗しました")
                .catch((error) => { console.error(error); });

                return;
            }            
    
            zBotData.restoreConfig(guildId);
            zBotGuildConfigs[guildId].textChannelId = textCannelId;
            zBotGuildConfigs[guildId].voiceChannelId = voiceCannelId;

            zBotData.restoreDictionary(guildId);
            zBotGuildPlayers[guildId] = player;
            zBotGuildPlayerQueues[guildId] = [];

            interaction.reply("こんにちは！zBotを接続しました")
            .catch((error) => { console.error(error); });

            return;            
        }
    },

    {
        "name": "list",
        "description": "話者IDの一覧を表示します",

        "excute": async function(interaction, zBotData){
            let message = "";

            const speakers = await getSpeakersWithStyles()
            .catch((error) => { console.error(error); });

            if(!speakers){
                interaction("話者IDの一覧を作成に失敗しました");
                return;
            };

            for(const speaker of speakers){
                message += speaker.engine + "：" + speaker.speakerName + "（" + speaker.styleName  + "）" + "：" + String(speaker.id) + "\r\n";
            }
 
            const { AttachmentBuilder } = require("discord.js");

            const buffer = Buffer.from(message);
            const attachment = new AttachmentBuilder(buffer, { "name": "speakers.txt" });

            interaction.reply({ "content": "話者IDの一覧を作成しました", "files": [attachment] })
            .catch((error) => { console.error(error); });

            return;
        }
    },

    {
        "name": "speaker",
        "description": "話者を変更します",
        "options": [
            {
                "type": 3,
                "name": "engine",
                "description": "音声合成エンジンを選択してください※エンジンにより選択できる話者が異なります",
                "required": true,
                "choices": getVoiceServerEngineCoices()
            },
            
            {
                "type": 4,
                "name": "id",
                "description": "話者IDを直接入力するか、候補から選択してください※最大表示数が25なのでキーワードで絞り込んでください",
                "required": true,
                "autocomplete": true
            },

            {
                "type": 10,
                "name": "speed",
                "description": "話者のスピード倍率を入力してください※変化させない場合は1を指定",
                "max_value": envSpeakerSpeedScaleUpperLimit,
                "min_value": envSpeakerSpeedScaleLowerLimit,
                "required": false
            },

            {
                "type": 10,
                "name": "pitch",
                "description": "話者のピッチ倍率を入力してください※変化させない場合は0を指定",
                "max_value": envSpeakerPitchScaleUpperLimit,
                "min_value": envSpeakerPitchScaleLowerLimit,
                "required": false
            }

        ],
        
        "excute": async function(interaction, zBotData){
            const { zBotGuildConfigs } = zBotData;

            const guildId = interaction.guildId;
        
            const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
        
            if(!connection){
                interaction.reply("まだ部屋にお呼ばれされてません・・・")
                .catch((error) => { console.error(error); });

                return;
            }
        
            const speakerEngine = interaction.options.getString("engine");
            const speakerId = interaction.options.getInteger("id");
            const speakerSpeedScale = interaction.options.getNumber("speed");
            const speakerPitchScale = interaction.options.getNumber("pitch");

            const memberId = interaction.member.id;
            const memberName = interaction.member.displayName + "さん";
        
            const speakers = await getSpeakersWithStyles()
            .catch((error) => { console.error(error); });
        
            if(!speakers){
                interaction.reply("話者IDの一覧を作成に失敗しました")
                .catch((error) => { console.error(error); });

                return;
            };
        
            const speaker = speakers.find( (x) => { return x.engine === speakerEngine && x.id === speakerId; });
        
            if(!speaker){
                interaction.reply("エンジン「" + speakerEngine + "」に指定のIDに該当する話者が存在しませんでした")
                .catch((error) => { console.error(error); });

                return;   
            }
        
            zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId] = {
                "engine": speakerEngine,
                "id": speakerId,
                "speedScale": (!speakerSpeedScale ? 1.0 : speakerSpeedScale),
                "pitchScale": (!speakerPitchScale ? 0.0 : speakerPitchScale)
            };
        
            const message = 
                memberName + "の話者を「" +
                    speaker.engine + "：" + speaker.speakerName + "（" + speaker.styleName  + "）" +
                    "＃スピード：" + zenkaku2Hankaku(String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].speedScale)) + " " + 
                    "＃ピッチ：" + zenkaku2Hankaku(String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].pitchScale)) +
                "」に変更しました"
            ;    
        
            interaction.reply(message)
            .catch((error) => { console.error(error); });

            return;
        },

        "autocomplete": async function(interaction, zBotData){
            const focusedOption = interaction.options.getFocused(true);

            if(focusedOption.name !== "id"){
                interaction.respond([])
                .catch((error) => { console.error(error); });

                return;
            }
        
            const engine = interaction.options.getString("engine");

            if(!engine){
                interaction.respond([])
                .catch((error) => { console.error(error); });

                return;
            }
        
            const speakers = await getSpeakersWithStyles()
            .catch((error) => { console.error(error); });
        
            if(!speakers){
                interaction.respond([])
                .catch((error) => { console.error(error); });

                return;               
            }
        
            const filtered = speakers.filter(
                (x) => (x.engine === engine) && x.fqn.includes(!focusedOption.value ? "" : focusedOption.value)
            ); 

            const choices = filtered.map(
                (x) => ({ "name": x.fqn, "value": x.id })
            );
        
            if(choices.length > 25){
                choices.length = 25;         
            }

            interaction.respond(choices)
            .catch((error) => { console.error(error); });

            return;        
        }

    },

    {
        "name": "random",
        "description": "話者をランダムに変更します",
        
        "excute": async function(interaction, zBotData){
            const { zBotGuildConfigs } = zBotData;

            const guildId = interaction.guildId;
        
            const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
        
            if(!connection){
                interaction.reply("まだ部屋にお呼ばれされてません・・・")
                .catch((error) => { console.error(error); });

                return;
            }
        
            const memberId = interaction.member.id;
            const memberName = interaction.member.displayName + "さん" ;
        
            const speakers = await getSpeakersWithStyles()
            .catch((error) => { console.error(error); });
        
            if(!speakers){
                interaction.reply("話者IDの一覧を作成に失敗しました")
                .catch((error) => { console.error(error); });

                return;
            };

            const randomNumber = Math.floor(Math.random() * speakers.length);
        
            const speaker = speakers[randomNumber];
        
            zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId] = {
                "engine": speaker.engine,
                "id": speaker.id,
                "speedScale": 1.0,
                "pitchScale": 0.0
            };
        
            const message = 
                memberName + "の話者を「" +
                    speaker.engine + "：" + speaker.speakerName + "（" + speaker.styleName  + "）" +
                    "＃スピード：" + zenkaku2Hankaku(String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].speedScale)) + " " + 
                    "＃ピッチ：" + zenkaku2Hankaku(String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].pitchScale)) +
                "」に変更しました"
            ;    
        
            interaction.reply(message)
            .catch((error) => { console.error(error); });

            return;
        }
    },

    {
        "name": "dict",
        "description": "単語または絵文字の読みを辞書登録します",
        "options": [
            {
                "type": 3,
                "name": "key",
                "description": "単語または絵文字を入力してください",
                "required": true
            },

            {
                "type": 3,
                "name": "value",
                "description": "読みを入力してください、登録解除する場合は「delete」と入力してください",
                "required": true
            }
        ],

        "excute": async function(interaction, zBotData){
            const { zBotGuildDictionaries } = zBotData;

            const guildId = interaction.guildId;

            const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
    
            if(!connection){
                interaction.reply("まだ部屋にお呼ばれされてません・・・")
                .catch((error) => { console.error(error); });

                return;
            }
    
            const orgKey = interaction.options.getString("key");
            const orgValue = interaction.options.getString("value");
    
            let key = orgKey.trim();
            
            const matches = /^<:[a-zA-Z0-9_]+:([0-9]+)>$/.exec(key);

            if(matches){
                key = "<:CustomEmoji:" + matches[1] + ">";
            }
    
            const value = (orgValue === null) ? null : orgValue.trim();
    
            if(value === "delete"){
                if(zBotGuildDictionaries[guildId][key] === void 0){
                    interaction.reply("「" + orgKey + "は辞書登録されていません")
                    .catch((error) => { console.error(error); });

                    return;
                }

                delete zBotGuildDictionaries[guildId][key];
    
                interaction.reply("「" + orgKey + "」の辞書登録を解除しました")
                .catch((error) => { console.error(error); });

                zBotData.saveDictionary(guildId);

                return;
            }
    
            zBotGuildDictionaries[guildId][key] = value;

            interaction.reply("「" + orgKey + "」を「" + orgValue + "」に辞書登録しました")
            .catch((error) => { console.error(error); });
    
            zBotData.saveDictionary(guildId);
            
            return;
        }
    },

    {
        "name": "reaction",
        "description": "リアクションスタンプ読み上げの有効・無効を切り替えます",

        
        "excute": async function(interaction, zBotData){
            const { zBotGuildConfigs } = zBotData;

            const guildId = interaction.guildId;
        
            const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
        
            if(!connection){
                interaction.reply("まだ部屋にお呼ばれされてません・・・")
                .catch((error) => { console.error(error); });

                return;
            }

            if(zBotGuildConfigs[guildId].isReactionSpeach === void 0){
                zBotGuildConfigs[guildId].isReactionSpeach = true;
            }
            
            zBotGuildConfigs[guildId].isReactionSpeach = !zBotGuildConfigs[guildId].isReactionSpeach
            
            if(zBotGuildConfigs[guildId].isReactionSpeach){
                interaction.reply("リアクションスタンプの読み上げを有効にしました")
                .catch((error) => { console.error(error); });
            }else{
                interaction.reply("リアクションスタンプの読み上げを無効にしました")
                .catch((error) => { console.error(error); });
            }
        
            return;
        },
    },

    {
        "name": "export",
        "description": "zBotの設定をエクスポートします",

        "excute": async function(interaction, zBotData){
            const {
                zBotGuildConfigs, 
                zBotGuildDictionaries,
            } = zBotData;

            const guildId = interaction.guildId;

            const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
    
            if(!connection){
                interaction.reply("まだ部屋にお呼ばれされてません・・・")
                .catch((error) => { console.error(error); });

                return;
            }

            const { AttachmentBuilder } = require("discord.js");

            const server = {
                "config": zBotGuildConfigs[guildId],
                "dict": zBotGuildDictionaries[guildId]
            };

            const buffer = Buffer.from(JSON.stringify(server, null, 2));
            const attachment = new AttachmentBuilder(buffer, {"name": "zbot.json"});

            interaction.reply({ "content": "zBotの設定をエクスポートしました", "files": [attachment] })
            .catch((error) => { console.error(error); });

            return;
        }
    },

    {
        "name" : "disconnect",
        "description": "zBotを切断します",

        "excute": async function(interaction, zBotData){
            const guildId = interaction.guildId;

            const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
    
            if(!connection){
                interaction.reply("まだ部屋にお呼ばれされてません・・・")
                .catch((error) => { console.error(error); });

                return;
            }
    
            connection.destroy();

            interaction.reply("さようなら！zBotを切断します")
            .catch((error) => { console.error(error); });
    
            zBotData.saveConfig(guildId);
            zBotData.saveDictionary(guildId);
            
            zBotData.delete(guildId);
            
            return;
        }
    },

    {
        "name": "help",
        "description": "ヘルプを表示します",

        "excute": async function(interaction, zBotData){
            let message = "";
            for(const command of zBotSlashCommands){
                message += "/" + command.name + "\r\n";
                message += "　・・・" + command.description + "\r\n";
            }

            interaction.reply(message)
            .catch((error) => { console.error(error); });

            return;
        }
    }
];


async function getSpeakersWithStyles(){

    if(this.speakersWithStyles !== void 0){
        return this.speakersWithStyles;
    }

    this.speakersWithStyles = [];

    for(const splited of envVoiceServers.split(";")){
        const url = new URL(splited);

        const engine = url.searchParams.get("engine");
        const baseURL = url.origin;

        if(!engine) return;

        const { default: axios } = require("axios");
        const rpc = axios.create({ "baseURL": baseURL, "proxy": false });

        const response = await rpc.get("speakers", {
            headers: { "accept" : "application/json" },
        })
        .catch((error) => { console.error(error); });

        if(!response) return;
        if(response.status !== 200) return;
        
        const speakers = JSON.parse(JSON.stringify(response.data));

        for(const speaker of speakers){
            for(const style of speaker.styles){
            
                this.speakersWithStyles.push({
                    "engine": engine,
                    "id": style.id,
                    "speakerName": speaker.name,
                    "styleName": style.name,
                    "fqn": `${engine}:${speaker.name}(${style.name}):${style.id}`
                });
            }
        }
    }
    
    return this.speakersWithStyles;
}


function getVoiceServerEngineCoices(){
    const choices = [];

    for(const splited of envVoiceServers.split(";")){
        const url = new URL(splited);
        const engine = url.searchParams.get("engine");

        if(!engine) return;

        choices.push({ "name": engine, "value": engine });
    }

    return choices;
}

function zenkaku2Hankaku(str) {
    return str.replace(/[A-Za-z0-9]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    });
}

module.exports = zBotSlashCommands;