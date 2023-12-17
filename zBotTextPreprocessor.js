module.exports = function(orgText, dictionary){
    
    let text = orgText;

    for(const key in dictionary){
        let before = key;
        let after =  dictionary[key];

        const keyMatches = /^<:[a-zA-Z0-9_]+:([0-9]+)>$/.exec(key);
        if(keyMatches){
            const textMatches = RegExp("<:[a-zA-Z0-9_]+:" + keyMatches[1] + ">").exec(text);
            if(textMatches){
                before = textMatches[0];
            }else{
                continue;
            }
        }

        text = text
            .split(before + " ").join(after)
            .split(before).join(after)
        ;
    }

    const twEmojiDict = require("./utils/twEmojiDict");

    for(const key in twEmojiDict){
        let before = key;
        let after =  twEmojiDict[key];

        text = text
            .split(before + " ").join(after)
            .split(before).join(after)
        ; 
    }

    const emojiRegex = require("./utils/emojiRegex");

    text = text
        .replace(/(https?|ftp)(:\/\/[\w\/:%#\$&\?\(\)~\.=\+\-]+)/g, "")
        .replace(/<:[a-zA-Z0-9_]+:[0-9]+>|:[a-zA-Z0-9_]+:/g, "")
        .replace(emojiRegex(), "")
    ;
    
    text = text
        .replace(/\r?\n/g, "\0")
        .replace(/[!\?！？。)]+/g, (x) => { return x + "\0\0"; })
        .replace(/(?<!\0)\0(?!\0)/g, "、")
        .replace(/\0{2,}/g, "\0")
    ;

    const retTextLines = [];
    for(const splited of text.split("\0")){
        if(splited === "") continue;
        retTextLines.push(splited);
    }

    console.log(retTextLines);
    return retTextLines;

};