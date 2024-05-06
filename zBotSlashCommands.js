require("dotenv").config();

const envVoiceServers = process.env.voiceServers;

const envSpeakerSpeedScaleUpperLimit = Number(process.env.speakerSpeedScaleUpperLimit);
const envSpeakerSpeedScaleLowerLimit = Number(process.env.speakerSpeedScaleLowerLimit);

const envSpeakerPitchScaleUpperLimit = Number(process.env.speakerPitchScaleUpperLimit);
const envSpeakerPitchScaleLowerLimit = Number(process.env.speakerPitchScaleLowerLimit);

const envSpeakerIntonationScaleUpperLimit = Number(process.env.speakerIntonationScaleUpperLimit);
const envSpeakerIntonationScaleLowerLimit = Number(process.env.speakerIntonationScaleLowerLimit);

const autocompleteLimit = 25;

const { getVoiceConnection } = require("@discordjs/voice");
const { joinVoiceChannel } = require("@discordjs/voice");
const { createAudioPlayer, NoSubscriberBehavior } = require("@discordjs/voice");
const { AttachmentBuilder } = require("discord.js");

const zBotSlashCommands = [
    {
        "name": "connect",
        "description": "zBotを接続します",
        "options": [
            {
                "type": 7,
                "channel_types": [0],
                "name": "text",
                "description": "読み上げ「元」の「テキスト」チャンネルを選択してください",
                "required": true
            },
            
            {
                "type": 7,
                "channel_types": [2],
                "name": "voice",
                "description": "読み上げ「先」の「ボイス」チャンネルを選択してください",
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
    
            //const { joinVoiceChannel } = require("@discordjs/voice");
            const connection = joinVoiceChannel({
                "channelId": voiceCannelId,
                "guildId": guildId,
                "adapterCreator": adapterCreator
            });
    
            if(!connection){
                await interaction.reply("接続に失敗しました");
                return;
            }
    
            //const { createAudioPlayer, NoSubscriberBehavior } = require("@discordjs/voice");
            const player = createAudioPlayer({
                behaviors: {
                  noSubscriber: NoSubscriberBehavior.Pause,
                },
            });
    
            if(!player){
                connection.destroy();

                await interaction.reply("プレイヤーの生成に失敗しました");
                return;
            }
    
            const subscribe = connection.subscribe(player);

            if(!subscribe){
                connection.destroy();
                
                await interaction.reply("音声チャンネルへのプレイヤーの接続に失敗しました");
                return;
            }            
    
            zBotData.restoreConfig(guildId);
            zBotGuildConfigs[guildId].textChannelId = textCannelId;
            zBotGuildConfigs[guildId].voiceChannelId = voiceCannelId;

            zBotData.restoreDictionary(guildId);
            zBotGuildPlayers[guildId] = player;
            zBotGuildPlayerQueues[guildId] = [];

            await interaction.reply("こんにちは！zBotを接続しました");
            return;            
        }
    },

    {
        "name": "list",
        "description": "話者IDの一覧を表示します",

        "excute": async function(interaction, zBotData){
            let message = "";

            const speakers = await getSpeakersWithStyles();

            if(!speakers){
                await interaction.reply("話者IDの一覧を作成に失敗しました");
                return;
            };

            for(const speaker of speakers){
                message += speaker.fqn + "\r\n";
            }
 
            const buffer = Buffer.from(message);
            //const { AttachmentBuilder } = require("discord.js");
            const attachment = new AttachmentBuilder(buffer, { "name": "speakers.txt" });

            await interaction.reply({ "content": "話者IDの一覧を作成しました", "files": [attachment] });
            return;
        }
    },

    {
        "name": "speaker",
        "description": "話者を変更します",
        "options": [
            {
                "type": 3,
                "name": "speaker",
                "description": `話者を「エンジン名(省略可)/話者名(省略可)/ID」の形式で指定、または候補から選択してください※候補表示の上限が${autocompleteLimit}のためをキーワードで絞り込んでください`,
                "required": true,
                "autocomplete": true
            }
        ],
        
        "excute": async function(interaction, zBotData){
            const { zBotGuildConfigs } = zBotData;

            const guildId = interaction.guildId;
        
            //const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
        
            if(!connection){
                await interaction.reply("まだ部屋にお呼ばれされてません・・・");
                return;
            }

            const [speakerEngine, speakerName, speakerId] = 
                interaction.options.getString("speaker").trim().split("/");
        
            const speakers = await getSpeakersWithStyles();

            const speaker = speakers.find(
                (x) => {
                    if(speakerEngine !== x.engine && speakerEngine) return false;
                    if(speakerName !== `${x.speakerName}(${x.styleName})` && speakerName) /*return false*/;
                    if(parseInt(speakerId) !== x.id) return false;
                    
                    return true;
                }
            );

            if(!speaker){
                await interaction.reply("話者の指定が不正です");
                return;                
            }

            const memberId = interaction.member.id;
            const memberName = interaction.member.displayName + "さん";

            zBotData.initMemberSpeakerConfig(guildId, memberId);

            zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].engine = speaker.engine;
            zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].id = speaker.id;

            const message = memberName + "の話者を「" + speaker.fqn + "」に変更しました";
        
            await interaction.reply(message);
            return;
        },

        "autocomplete": async function(interaction, zBotData){
            const focusedOption = interaction.options.getFocused(true);

            if(focusedOption.name !== "speaker"){
                await interaction.respond([]);
                return;
            }
        
            const speakers = await getSpeakersWithStyles();
        
            if(!speakers){
                await interaction.respond([]);
                return;               
            }

            const value = focusedOption.value ?? "";

            const keywords = value.trim().split("/");

            const filtered = speakers.filter(
                (keywords.length === 1 && keywords[0] === "") ? (x) => { return true } :

                (x) => {
                    for(const keyword of keywords){
                        if(!x.fqn.includes(keyword)){
                            return false;
                        }
                    }

                    return true;
                }
            );

            const choices = filtered.map(
                (x) => ({ "name": x.fqn, "value": x.fqn })
            );
        
            if(choices.length > autocompleteLimit){
                choices.length = autocompleteLimit;         
            }

            await interaction.respond(choices);
            return;        
        }

    },

    {
        "name": "random",
        "description": "話者をランダムに変更します",
        
        "excute": async function(interaction, zBotData){
            const { zBotGuildConfigs } = zBotData;

            const guildId = interaction.guildId;
        
            //const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
        
            if(!connection){
                await interaction.reply("まだ部屋にお呼ばれされてません・・・");
                return;
            }
        
            const memberId = interaction.member.id;
            const memberName = interaction.member.displayName + "さん" ;
        
            const speakers = await getSpeakersWithStyles();
        
            if(!speakers){
                await interaction.reply("話者IDの一覧を作成に失敗しました");
                return;
            };

            const randomNumber = Math.floor(Math.random() * speakers.length);
            const speaker = speakers[randomNumber];

            zBotData.initMemberSpeakerConfig(guildId, memberId);

            zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].engine = speaker.engine;
            zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].id = speaker.id;
        
            const message = memberName + "の話者を「" + speaker.fqn + "」に変更しました";
        
            await interaction.reply(message);
            return;
        }
    },

    {
        "name": "speed",
        "description": "話者の話速を変更します",
        "options": [
            {
                "type": 10,
                "name": "scale",
                "description": `話者の話速倍率を入力してください※標準は1.0、範囲は${envSpeakerSpeedScaleLowerLimit}～${envSpeakerSpeedScaleUpperLimit}で指定`,
                "max_value": envSpeakerSpeedScaleUpperLimit,
                "min_value": envSpeakerSpeedScaleLowerLimit,
                "required": true
            }
        ],

        "excute": async function(interaction, zBotData){
            const { zBotGuildConfigs } = zBotData;

            const guildId = interaction.guildId;
        
            //const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
        
            if(!connection){
                await interaction.reply("まだ部屋にお呼ばれされてません・・・");
                return;
            }

            const memberId = interaction.member.id;
            const memberName = interaction.member.displayName + "さん";

            zBotData.initMemberSpeakerConfigIfUndefined(guildId, memberId);

            const currentScale = zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].speedScale;

            const scale = clamp(
                interaction.options.getNumber("scale") ?? currentScale,
                this.options[0].min_value,
                this.options[0].max_value
            );

            zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].speedScale = scale;
         
            const message = 
                memberName + "の話者を「" +
                    "#話速:" + String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].speedScale) + " " + 
                    "#音高:" + String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].pitchScale) + " " +
                    "#抑揚:" + String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].intonationScale) +
                "」に変更しました"
            ;
        
            await interaction.reply(message);
            return;
        }
    },

    {
        "name": "pitch",
        "description": "話者の音高を変更します",
        "options": [
            {
                "type": 10,
                "name": "scale",
                "description": `話者の音高倍率を入力してください※標準は0.0、範囲は${envSpeakerPitchScaleLowerLimit}～${envSpeakerPitchScaleUpperLimit}で指定`,
                "max_value": envSpeakerPitchScaleUpperLimit,
                "min_value": envSpeakerPitchScaleLowerLimit,
                "required": true
            }
        ],

        "excute": async function(interaction, zBotData){
            const { zBotGuildConfigs } = zBotData;

            const guildId = interaction.guildId;
        
            //const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
        
            if(!connection){
                await interaction.reply("まだ部屋にお呼ばれされてません・・・");
                return;
            }

            const memberId = interaction.member.id;
            const memberName = interaction.member.displayName + "さん";

            zBotData.initMemberSpeakerConfigIfUndefined(guildId, memberId);

            const currentScale = zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].pitchScale;

            const scale = clamp(
                interaction.options.getNumber("scale") ?? currentScale,
                this.options[0].min_value,
                this.options[0].max_value
            );

            zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].pitchScale = scale;

            const message = 
                memberName + "の話者を「" +
                    "#話速:" + String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].speedScale) + " " + 
                    "#音高:" + String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].pitchScale) + " " +
                    "#抑揚:" + String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].intonationScale) +
                "」に変更しました"
            ;
        
            await interaction.reply(message);
            return;
        }
    },

    {
        "name": "intonation",
        "description": "話者の抑揚を変更します",
        "options": [
            {
                "type": 10,
                "name": "scale",
                "description": `話者の抑揚倍率を入力してください※標準は1.0、範囲は${envSpeakerIntonationScaleLowerLimit}～${envSpeakerIntonationScaleUpperLimit}で指定`,
                "max_value": envSpeakerIntonationScaleUpperLimit,
                "min_value": envSpeakerIntonationScaleLowerLimit,
                "required": true
            }
        ],

        "excute": async function(interaction, zBotData){
            const { zBotGuildConfigs } = zBotData;

            const guildId = interaction.guildId;
        
            //const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
        
            if(!connection){
                await interaction.reply("まだ部屋にお呼ばれされてません・・・");
                return;
            }

            const memberId = interaction.member.id;
            const memberName = interaction.member.displayName + "さん";

            zBotData.initMemberSpeakerConfigIfUndefined(guildId, memberId);

            const currentScale = zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].intonationScale;

            const scale = clamp(
                interaction.options.getNumber("scale") ?? currentScale,
                this.options[0].min_value,
                this.options[0].max_value
            );

            zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].intonationScale = scale;

            const message = 
                memberName + "の話者を「" +
                    "#話速:" + String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].speedScale) + " " + 
                    "#音高:" + String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].pitchScale) + " " +
                    "#抑揚:" + String(zBotGuildConfigs[guildId].memberSpeakerConfigs[memberId].intonationScale) +
                "」に変更しました"
            ;
        
            await interaction.reply(message);
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
                "description": "読みを入力してください、登録解除する場合は「delete」または「null」と入力してください",
                "required": true
            }
        ],

        "excute": async function(interaction, zBotData){
            const { zBotGuildDictionaries } = zBotData;

            const guildId = interaction.guildId;

            //const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
    
            if(!connection){
                await interaction.reply("まだ部屋にお呼ばれされてません・・・");
                return;
            }

            let key = (interaction.options.getString("key") ?? "").trim();
            let value = (interaction.options.getString("value") ?? "").trim();

            if(key === "" || value === ""){
                await interaction.reply("keyまたはvalueが入力されてません");
                return;
            }
            
            const matches = /^<:[a-zA-Z0-9_]+:([0-9]+)>$/.exec(key);

            if(matches){
                key = "<:CustomEmoji:" + matches[1] + ">";
            }
    
            if(value === "delete" || value === "null"){
                if(zBotGuildDictionaries[guildId][key] === void 0){
                    await interaction.reply("「" + key + "は辞書登録されていません");
                    return;
                }

                delete zBotGuildDictionaries[guildId][key];
                zBotData.saveDictionary(guildId);
                
                await interaction.reply("「" + key + "」の辞書登録を解除しました");
                return;
            }
    
            zBotGuildDictionaries[guildId][key] = value;

            await interaction.reply("「" + key + "」を「" + value + "」に辞書登録しました");
            return;
        }
    },

    {
        "name": "reaction",
        "description": "リアクションスタンプ読み上げの有効・無効を切り替えます",

        
        "excute": async function(interaction, zBotData){
            const { zBotGuildConfigs } = zBotData;

            const guildId = interaction.guildId;
        
            //const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
        
            if(!connection){
                await interaction.reply("まだ部屋にお呼ばれされてません・・・");
                return;
            }

            const current = zBotGuildConfigs[guildId].isReactionSpeach;
            zBotGuildConfigs[guildId].isReactionSpeach = !current;
            
            if(zBotGuildConfigs[guildId].isReactionSpeach){
                await interaction.reply("リアクションスタンプの読み上げを有効にしました");
            }else{
                await interaction.reply("リアクションスタンプの読み上げを無効にしました");
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

            //const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
    
            if(!connection){
                await interaction.reply("まだ部屋にお呼ばれされてません・・・");
                return;
            }

            const { AttachmentBuilder } = require("discord.js");

            const server = {
                "config": zBotGuildConfigs[guildId],
                "dict": zBotGuildDictionaries[guildId]
            };

            const buffer = Buffer.from(JSON.stringify(server, null, 2));
            const attachment = new AttachmentBuilder(buffer, {"name": "zbot.json"});

            await interaction.reply({ "content": "zBotの設定をエクスポートしました", "files": [attachment] });
            return;
        }
    },

    {
        "name" : "disconnect",
        "description": "zBotを切断します",

        "excute": async function(interaction, zBotData){
            const guildId = interaction.guildId;

            //const { getVoiceConnection } = require("@discordjs/voice");
            const connection = getVoiceConnection(guildId);
    
            if(!connection){
                interaction.reply("まだ部屋にお呼ばれされてません・・・");
                return;
            }
    
            connection.destroy();
    
            zBotData.saveConfig(guildId);
            zBotData.saveDictionary(guildId);
            
            zBotData.delete(guildId);
            
            await interaction.reply("さようなら！zBotを切断します");
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

            await interaction.reply(message);
            return;
        }
    }
];

function clamp(value, min, max){
    return Math.min(Math.max(value, min), max);
}

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
        const rpc = axios.create({ "baseURL": baseURL, "proxy": false, "timeout": 30 * 1000 });

        const response = await rpc.get("speakers", {
            headers: { "accept" : "application/json" },
        });

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
                    "fqn": `${engine}/${speaker.name}(${style.name})/${style.id}`
                });
            }
        }
    }
    
    return this.speakersWithStyles;
}

module.exports = zBotSlashCommands;