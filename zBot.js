require("dotenv").config();

const envToken = process.env.token;
const envServerIds = process.env.serverIds;

const zBotData = require("./zBotData");
const zBotSlashCommands = require("./zBotSlashCommands");

const {Client, GatewayIntentBits, Events} = require("discord.js");

const client = new Client({"intents": [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
]});

client.once(Events.ClientReady, (cl) => {

    for(const id of envServerIds.split(";")){
        cl.application.commands.set(zBotSlashCommands, id);
    }

	console.log("Ready! (" + cl.user.tag + ")");
});


client.on(Events.InteractionCreate, async(interaction) => {
    
    const command = zBotSlashCommands.find(
        (x) => { return x.name === interaction.commandName; }
    );

    if(!command){
        interaction.reply("コマンドに紐づけされた処理がありません")
        .catch((error) => { console.log(error); });

        return;
    }

    if(interaction.isChatInputCommand()){
        command.excute(interaction, zBotData)
        .catch((error) => { console.log(error); });
    }
    else if(interaction.isAutocomplete()){
        command.autocomplete(interaction, zBotData)
        .catch((error) => { console.log(error); });
    }
});

client.on(Events.MessageCreate, async(message) => {
    const zBotMessageHandler = require("./zBotMessageHandler");
    
    zBotMessageHandler(message, zBotData)
    .catch((error) => { console.log(error); });
});

client.on(Events.MessageReactionAdd, async(reaction, user) => {
    const zBotReactionHandler = require("./zBotReactionHandler");

    zBotReactionHandler(reaction, user, zBotData)
    .catch((error) => { console.log(error); });
});

client.on(Events.ShardError, async(error) => { console.error(error); });

client.login(envToken); 