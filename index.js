require("dotenv").config();

const envToken = process.env.token;
const envGuildIds = process.env.guildIds;

const { Client, GatewayIntentBits, Events } = require("discord.js");

const client = new Client({ "intents": [
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
]});

client.zBotGData = require("./zBotGData");
client.zBotSlashCommands = require("./zBotSlashCommands");

client.once(Events.ClientReady, (cl) => {
    for(const id of envGuildIds.split(";")){
        if(id.trim() === "") continue;
        
        cl.application.commands.set(cl.zBotSlashCommands, id.trim());
    }

	console.log(`Ready! (${cl.user.tag})`);

    return;
});

client.on(Events.InteractionCreate, async(interaction) => {
    const { zBotGData, zBotSlashCommands } = interaction.client;

    const command = zBotSlashCommands.find(
        (x) => { return x.name === interaction.commandName; }
    );

    if(!command){
        interaction.reply("コマンドに紐づけされた処理がありません")
        .catch((error) => { console.error(error); });

        return;
    }

    if(interaction.isChatInputCommand()){
        command.excute(interaction, zBotGData)
        .catch((error) => { console.error(error); });

        return;
    }
    
    if(interaction.isAutocomplete()){
        command.autocomplete(interaction, zBotGData)
        .catch((error) => { console.error(error); });

        return;
    }

    interaction.reply("コマンドに非対応なイベントです")
    .catch((error) => { console.error(error); });

    return;
});

const zBotMessageHandler = require("./zBotMessageHandler");

client.on(Events.MessageCreate, async(message) => {
    const { zBotGData } = message.client;
    
    //const zBotMessageHandler = require("./zBotMessageHandler");
    zBotMessageHandler(message, zBotGData)
    .catch((error) => { console.error(error); });

    return;
});

const zBotReactionHandler = require("./zBotReactionHandler");

client.on(Events.MessageReactionAdd, async(reaction, user) => {
    const { zBotGData } = reaction.client;
    
    //const zBotReactionHandler = require("./zBotReactionHandler");
    zBotReactionHandler(reaction, user, zBotGData)
    .catch((error) => { console.error(error); });

    return;
});

client.login(envToken); 