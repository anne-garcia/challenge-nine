import fs from 'fs';

const bannedListFile = fs.readFileSync(`./json/banned_words.json`);
const bannedListJson = JSON.parse(bannedListFile);

// Just basic checking, if the given text contains any of the "banned" words, text is invalid.
export function ValidateText(text) {
    for(const word of bannedListJson) {
        if(text.includes(word)) {
            return false;
        }
    }
    return true;
}