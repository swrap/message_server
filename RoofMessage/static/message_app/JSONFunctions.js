/**
 * Created by Jesse Saran on 7/25/2016.
 */

/**
 * Querying all contacts
 */
function getContacts() {
    var json = {
        "action" : "get_contacts"
    };
    return JSON.stringify(json);
}

/**
 * Querying all conversations.
 */
function getConversations() {
    var json = {
        "action" : "get_conversations"
    };
    return JSON.stringify(json);
}

/**
 * The thread_id = conversation_id to query the messages for
 * @param thread_id
 */
function getMessages(thread_id, amount, offset) {
    var json = {
        "action" : "get_messages",
        "thread_id" : thread_id,
        "amount" : amount,
        "offset" : offset
    };
    return JSON.stringify(json);
}

/**
 * 
 * @param body              The text message that will be sent.
 * @param data              NOT USED (but will be image data/etc)  
 * @param numbers           Array of numbers (only one number implemented on backend)
 * @param temp_message_id   The temporary id of the message before getting actual id
 */
function sendMessages(body, data, numbers, temp_message_id) {
    var json = {
        "action" : "send_messages",
        "body" : body,
        "data" : data,
        "temp_message_id" : temp_message_id,
        "numbers" : []
    };
    for (var i in numbers) {
        var number = numbers[i];
        json.numbers.push({
            "number" : number
        })
    }
    return JSON.stringify(json);
}

const CONTACTS = "contacts";
const CONVERSATIONS = "conversations";
const MESSAGES = "messages";

const BUFFER = "_";

var contacts_key_array = [];
var conversations_key_array = [];

/**
 * Used to store all contacts into session storage
 *
 * @param jsonObject    json contacts arraylist (contains contact json objects)
 */
function storeContacts(jsonObject) {
    var contacts = jsonObject[CONTACTS];
    for (var i in contacts) {
        var key = Object.keys(contacts[i])[0];
        var object = contacts[i][key];
        key = CONTACTS + key;
        sessionStorage.setItem(key, JSON.stringify(object));
        contacts_key_array.push(key);
    }
}

/**
 * Used to retrieve a complete arraylist of json contact objects
 *
 * @returns {Array}
 */
function retrieveContacts() {
    var complete_contact_array = [];
    for (var i in contacts_key_array) {
        complete_contact_array.push(JSON.parse(sessionStorage.getItem(contacts_key_array[i])));
    }
    return complete_contact_array;
}

/**
 * Used to store all contacts into session storage
 *
 * @param jsonObject    json conversations arraylist (contains conversation json objects)
 */
function storeConversations(jsonObject) {
    var contacts = jsonObject[CONVERSATIONS];
    for (var i in contacts) {
        var key = Object.keys(contacts[i])[0];
        var object = contacts[i][key];
        key = CONVERSATIONS + key;
        sessionStorage.setItem(key, JSON.stringify(object));
        conversations_key_array.push(key);
    }
}

/**
 * Used to retrieve a complete arraylist of json contact objects
 *
 * @returns {Array}
 */
function retrieveConversations() {
    var complete_conversation_array = [];
    for (var i in conversations_key_array) {
        complete_conversation_array.push(JSON.parse(sessionStorage.getItem(conversations_key_array[i])));
    }
    return complete_conversation_array;
}

/**
 * Used to store all contacts into session storage
 *
 * @param jsonObject    json conversations arraylist (contains conversation json objects)
 */
function storeMessages(jsonObject) {
    var conversation = null;
    var keys = Object.keys(jsonObject);
    for (var i in keys) {
        if (keys[i] != "action") {
            conversation = keys[i];
        }
    }
    var key = MESSAGES + conversation;
    sessionStorage.setItem(key, JSON.stringify(jsonObject[conversation]));

    return true;
}

/**
 * Used to retrieve a complete arraylist of json contact objects
 *
 * @returns {Array}
 */
function retrieveMessages(convo_id) {
    return JSON.parse(sessionStorage.getItem(MESSAGES + convo_id));
}