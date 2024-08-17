const twEmojiDict = require("./utils/twEmojiDict");
const emojiRegex = require("./utils/emojiRegex");

function zBotTextPreprocessor(text, dictionary){
    text = text
        .replace(/(https?|ftp)(:\/\/[\w\/:%#\$&\?\(\)~\.\,=\+\-]+)/g, "")
        .replace(/<(@!?|#|@&)[0-9]+>/g, "")
        .replace(/(@everyone|@here)/g, "")
    ;

    for(const key in dictionary){
        let before = key;
        let after =  dictionary[key];

        const keyMatches = /^<:[a-zA-Z0-9_]+:([0-9]+)>$/.exec(key);

        if(keyMatches){
            const textMatches = RegExp("<:[a-zA-Z0-9_]+:" + keyMatches[1] + ">").exec(text);

            if(textMatches){
                before = textMatches[0];
            }
            else{
                continue;
            }
        }

        text = text
            .split(before + " ").join(after)
            .split(before).join(after)
        ;
    }

    //const twEmojiDict = require("./utils/twEmojiDict");
    for(const key in twEmojiDict){
        let before = key;
        let after =  twEmojiDict[key];

        text = text
            .split(before + " ").join(after)
            .split(before).join(after)
        ; 
    }

    //const emojiRegex = require("./utils/emojiRegex");
    text = text
        .replace(/<:[a-zA-Z0-9_]+:[0-9]+>/g, "")
        .replace(emojiRegex(), "")
    ;
    
    text = text
        .replace(/\r?\n/g, "\0")
        .replace(/[!\?！？。)]+/g, (x) => { return x + "\0\0"; })
        .replace(/(?<!\0)\0(?!\0)/g, "、")
        .replace(/\0{2,}/g, "\0")
    ;

    const splitedText = [];
    
    for(const splited of text.split("\0")){
        if(splited === "") continue;
        splitedText.push(splited);
    }

    return splitedText;
};

module.exports = zBotTextPreprocessor;