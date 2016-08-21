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
 * The thread_id = conversation_id to query the messages for.
 * @param thread_id
 * @param amount
 * @param offset NOTE if offset < 0 will query amount in array to send
 */
function getMessagesJSON(thread_id, amount, offset) {
    if (thread_id == null) {
        return false;
    }

    if (parseInt(offset) < 0) {
        var keys = Object.keys(retrieveMessages(thread_id));
        offset = keys.length;
    }
    var json = {
        "action" : "get_messages",
        "thread_id" : thread_id,
        "amount" : amount,
        "offset" : offset
    };
    return JSON.stringify(json);
}

/**
 * Creates a JSON For sending a message
 * @param body              The text message that will be sent.
 * @param data              NOT USED (but will be image data/etc)  
 * @param numbers           Array of numbers (only one number implemented on backend)
 * @param temp_message_id   The temporary id of the message before getting actual id
 */
function prepareMessages(body, data, numbers, temp_message_id) {
    var json = {
        "action" : "send_messages",
        "body" : body,
        "data" : data,
        "temp_message_id" : temp_message_id,
        "numbers": numbers,
    };
    return JSON.stringify(json);
}

var CONTACTS = "contacts";
var CONVERSATIONS = "conversations";
var MESSAGES = "messages";
var RECIPIENTS = "recipients";
var SCROLL_TOP = "scroll_top";
var FULL_NAME = "full_name";
var PHONE_NUMBER = "phone_number";
var TEMP_MESSAGE_ID = "temp_message_id";
var MESSAGE_ID = "message_id";
var MESSAGE = "message";
var DATE = "date";
var CONVO_ID = "convo_id";
var NUMBER = "number";
var KEY = "key";

var TRUE = "true";

//Used for sending a message to send.
var tempIdArr = [];

/**
 * Used to store all contacts into session storage
 *
 * @param jsonObject    json contacts arraylist (contains contact json objects)
 */
function storeContacts(jsonObject) {
    var contacts = jsonObject[CONTACTS];
    var jsonStorage = sessionStorage.getItem(CONTACTS);
    if (jsonStorage == null) {
        jsonStorage = {};
    } else {
        jsonStorage = JSON.parse(jsonStorage);
    }
    //todo switch other JSON sets use the key to sort like contacts
    for (var i in contacts) {
        var key = Object.keys(contacts[i])[0];
        contacts[i][key][KEY] = key;
        var contact = contacts[i][key][FULL_NAME];
        jsonStorage[contact] = contacts[i][key];
    }
    sessionStorage.setItem(CONTACTS, JSON.stringify(jsonStorage));
}

/**
 * Used to retrieve a complete array of json contact objects
 *
 * @returns {Array}
 */
function retrieveContacts() {
    var contacts = sessionStorage.getItem(CONTACTS);
    if (contacts == null) {
        contacts = {};
    } else {
        contacts = JSON.parse(contacts);
    }
    return contacts;
}

/**
 * Used to retrieve a complete arraylist of json contact objects
 *
 * @param id id of the contact object to retrieve
 * @returns {Array}
 */
function retrieveContact(id) {
    var contacts_array = JSON.parse(sessionStorage.getItem(CONTACTS));
    return contacts_array[id];
}

/**
 * Used to store all contacts into session storage
 *
 * @param jsonObject    json conversations arraylist (contains conversation json objects)
 */
function storeConversations(jsonObject) {
    var conversations = jsonObject[CONVERSATIONS];
    var jsonStorage = sessionStorage.getItem(CONVERSATIONS);
    if (jsonStorage == null) {
        jsonStorage = {};
    } else {
        var tempStorage = {};
        jsonStorage = JSON.parse(jsonStorage);
        $.each(jsonStorage, function (index, value) {
            var tempKey = Object.keys(value)[0];
            tempStorage[tempKey] = value[tempKey];
        });
        jsonStorage = tempStorage;
    }
    for (var i in conversations) {
        var key = Object.keys(conversations[i])[0];
        jsonStorage[key] = conversations[i][key];
    }
    const ordered = [];
    var keys = Object.keys(jsonStorage);
    keys = keys.sort(function(a, b){
        return parseInt(jsonStorage[b][DATE]) - parseInt(jsonStorage[a][DATE]);
    });
    for (var i in keys) {
        var keyValue = {};
        var tempKey = keys[i];
        keyValue[tempKey] = jsonStorage[tempKey];
        ordered.push(keyValue);
    }
    sessionStorage.setItem(CONVERSATIONS,JSON.stringify(ordered));
}

/**
 * Used to retrieve a complete arraylist of json contact objects
 *
 * @returns {Array}
 */
function retrieveConversations(){
    var convos = sessionStorage.getItem(CONVERSATIONS);
    if (convos == null) {
        convos = {};
    } else {
        convos = JSON.parse(convos);
    }
    return convos;
}

/**
 * Retrieves conversation from convo id
 * @param convo_id int id of conversation
 */
function retrieveConversation(convo_id) {
    var conversations = JSON.parse(sessionStorage.getItem(CONVERSATIONS));
    var convo = null
    $.each(conversations, function (index, value) {
        var key = Object.keys(value)[0];
        if (key == convo_id) {
             convo = value[convo_id];
        }
    });
    return convo;
}

/**
 * Used to store all contacts into session storage
 *
 * @param jsonObject    json conversations arraylist (contains conversation json objects)
 */
function storeMessages(jsonObject) {
    var conversation = jsonObject[THREAD_ID];
    var key = MESSAGES + conversation;
    var jsonStorage = sessionStorage.getItem(key);
    if (jsonStorage == null) {
        jsonStorage = JSON.stringify({});
    }
    jsonStorage = JSON.parse(jsonStorage);
    var jsonConvoMessages = jsonObject[conversation];
    for (var i in jsonConvoMessages) {
        var tempKey = Object.keys(jsonConvoMessages[i])[0];
        jsonStorage[tempKey] = jsonConvoMessages[i][tempKey];
    }
    //TODO may need to get rid of sorting after depending?
    // const ordered = {};
    // Object.keys(jsonStorage).sort().forEach(function(key) {
    //         ordered[key] = jsonStorage[key];
    //     });

    sessionStorage.setItem(key, JSON.stringify(jsonStorage));
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

/**
 * Returns array of numbers for convo
 * @param convo_id
 * @returns {Array}
 */
function getNumbers(convo_id) {
    var numbers = [];
    var recipients = retrieveConversation(convo_id)[RECIPIENTS];
    for (var i in recipients) {
        var number =
            {
                "number" : recipients[i][PHONE_NUMBER]
            };
        numbers.push(number);
    }
    return numbers;
}

/**
 * Used for storing temp message id's
 * @param temp_message_id
 */
function storeTempId(temp_message_id, convo_id, body) {
    var tempMessageIdsArr = tempIdArr;
    if (tempMessageIdsArr == null) {
        tempMessageIdsArr = [];
    }
    tempMessageIdsArr.push(JSON.stringify({
        "temp_message_id":temp_message_id,
        "convo_id":convo_id,
        "body":body,
    }));
}

/**
 * Used for storing temp message id's
 * @param temp_message_id
 */
function storeTempIdArr(tempIdArr) {
    sessionStorage.setItem(TEMP_MESSAGE_ID, JSON.stringify(tempIdArr));
}

/**
 * Used for retreiving temp message ids
 * @param temp_message_id
 * @returns {boolean}
 */
function retrieveTempIdArr() {
    return tempIdArr;
}

/**
 * Store the scroll top for convo_id
 * @param convo_id
 */
function storeScrollTop(convo_id, scrollTop) {
    sessionStorage.setItem(SCROLL_TOP + convo_id, scrollTop);
}

/**
 * Retreive scroll top
 * @param convo_id
 */
function retrieveScrollTop(convo_id) {
    return sessionStorage.getItem(SCROLL_TOP + convo_id);
}