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
function getMessagesJSON(thread_id, amount, offset, period) {
    if (thread_id == null) {
        return false;
    }

    // if (parseInt(offset) < 0) {
    //     var keys = Object.keys(retrieveMessages(thread_id));
    //     offset = keys.length;
    // }
    var json = {
        "action" : "get_messages",
        "thread_id" : thread_id,
        "amount" : amount,
        "offset" : offset,
        "period" : period
    };
    return JSON.stringify(json);
}

/**
 * **************NOTE [TEMP_MESSAGE_ID] COULD BE A CONVO ID************
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
var TEMP_CONVO_ID = "temp_convo_id";
var MESSAGE_ID = "message_id";
var MESSAGE = "message";
var DATE = "date";
var CONVO_ID = "convo_id";
var NUMBER = "number";
var KEY = "key";

var temp_convo_id_count = 0;

var TRUE = "true";

//Used for sending a message to send.
var messageTempIdArr = [];
//Used for convos that do not exist
var convoTempIdArr = [];

/**
 * Used to store all contacts into session storage
 *
 * @param jsonObject    json contacts arraylist (contains contact json objects)
 */
function storeContacts(jsonObject) {
    var jsonStorage = sessionStorage.getItem(CONTACTS);
    var jsonContacts = jsonObject[CONTACTS];
    if (jsonStorage == null) {
        var contacts = jsonContacts.sort(function (a, b) {
            var num = 0;
            if (a[Object.keys(a)[0]][FULL_NAME] > b[Object.keys(b)[0]][FULL_NAME]) {
                num = 1;
            } else if (a[Object.keys(a)[0]][FULL_NAME] < b[Object.keys(b)[0]][FULL_NAME]) {
                num = -1;
            }
            return  num;
        });
        sessionStorage.setItem(CONTACTS, JSON.stringify(contacts));
    } else {
        jsonStorage = JSON.parse(jsonStorage);
        var contacts = jsonContacts.sort(function (a, b) {
            var num = 0;
            if (a[Object.keys(a)[0]][FULL_NAME] > b[Object.keys(b)[0]][FULL_NAME]) {
                num = 1;
            } else if (a[Object.keys(a)[0]][FULL_NAME] < b[Object.keys(b)[0]][FULL_NAME]) {
                num = -1;
            }
            return  num;
        });

        contacts = contacts.filter(function(item, pos, ary) {
            return !pos || Object.keys(item)[0] != Object.keys(ary[pos - 1])[0];
        });
        sessionStorage.setItem(CONTACTS, JSON.stringify(contacts));
    }
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
 */
function retrieveContact(id) {
    var contacts_array = JSON.parse(sessionStorage.getItem(CONTACTS));
    for(var i = 0; i < contacts_array.length; i++) {
        var value = contacts_array[i];
        var key = Object.keys(value)[0];
        if (key == id) {
            return value[key];
        }
    }
    return null;
}


/**
 * Used to retrieve a complete arraylist of json contact objects
 *
 * @param id id of the contact object to retrieve
 */
function retrieveContactName(id) {
    var contacts_array = JSON.parse(sessionStorage.getItem(CONTACTS));
    $.each(contacts_array, function (index, value) {
        var key = Object.keys(value)[0];
        if (key == id) {
            return value[key][FULL_NAME];
        }
    });
    return "UNKNOWN";
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
        sessionStorage.setItem(key, JSON.stringify(jsonObject[conversation].sort(function (a, b) {
            return a[Object.keys(a)[0]][DATE_RECIEVED]-b[Object.keys(b)[0]][DATE_RECIEVED];
        })
    ));
    } else {
        var jsonConvoMessages = jsonObject[conversation];
        jsonStorage = JSON.parse(jsonStorage);

        var messages = jsonConvoMessages.concat(jsonStorage).sort(function (a, b) {
            return a[Object.keys(a)[0]][DATE_RECIEVED]-b[Object.keys(b)[0]][DATE_RECIEVED];
        });
        messages = messages.filter(function(item, pos, ary) {
            return !pos || Object.keys(item)[0] != Object.keys(ary[pos - 1])[0];
        });
        sessionStorage.setItem(key, JSON.stringify(messages));
    }
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
function storeMessageTempIdArr(temp_message_id, convo_id, body) {
    var tempMessageIdsArr = messageTempIdArr;
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
 * Used for retrieving temp message ids
 * @returns {array}
 */
function retrieveMessageTempIdArr() {
    return messageTempIdArr;
}

/**
 * Used for storing temp convo id's
 * @param temp_message_id
 */
function storeConvoTempId(temp_convo_id) {
    convoTempIdArr.push(temp_convo_id);
}

/**
 * Returns the convoTempIdArr
 * @returns {Array}
 */
function retrieveConvoTempIdArr() {
    return convoTempIdArr;
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

/**
 * Returns stringified json version of data you want to retrieve
 *
 * @param partId       part_id for the part data you want to get
 * @param content_type      content type for the location
 * @param messageID      id of the message
 */
function prepareGetData(partId, content_type, messageId) {
    var json = {
        "action" : "get_data",
        "message_id" : messageId,
        "part_id" : partId,
        "content_type" : content_type,
    };
    return JSON.stringify(json);
}

/**
 * Returns whether or not the current data is being loaded or has been loaded
 * @param message_id
 */
function retrieveDataLoad(message_id) {
    return sessionStorage.getItem(DATA + message_id + DATA);
}