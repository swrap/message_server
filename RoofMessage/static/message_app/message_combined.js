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

var DEFAULT_GET_MESSAGES = 15;
var DEFAULT_GET_MESSAGES_AFTER = 20;

var BODY = "body";
var MESSAGE_TYPE = "message_type";
var THREAD_ID = "thread_id";
var ID = "ID";
var TYPE = "type";
var MMS = "mms";
var TYPE_INBOX = 1;
var TYPE_SENT = 2;
var PARTS = "parts";
var _DATA = "_data";
var DATE_RECIEVED = "date_recieved";
var CONTACT_ID = "contact_id";
var ADDRESS = "address";
var PART_ID = "part_id";
var DATALOAD = "DATALOAD";

var TEXT = "TEXT";
var CONTENT_TYPE = "CONTENT_TYPE";
var CONTENT_TYPE_TEXT_PLAIN = "text/plain";
var CONTENT_TYPE_IMAGE = "image";

var TYPE_LOCAL_SEND = 20; //waiting to see if successfully sent

var CLASS_POINTER = "pointer"; //used for pointer class
var CLASS_POINTER_NEW_MESSAGE = "new_message_pointer"; //used for pointer class

var MESSAGE_COUNT = "message_count";

var MESSAGE_BACKGROUND_COLOR_ME_SENT = "#C77FFF";
var MESSAGE_BACKGROUND_COLOR_RECEIVED = "#52CC82";
var MESSAGE_BACKGROUND_COLOR_WAITING = "#FF7FE5";
var MESSAGE_TEXT_COLOR = "white";

var CONVO_BACKGROUND_COLOR = "#FFFFFF";
var CONVO_BACKGROUND_COLOR_SELECTED = "#B697FA";
var CONVO_BACKGROUND_COLOR_MESSAGE_RECEIVED = "#8EE6B7";
var CONVO_BACKGROUND_MESSAGE_COUNT = "#8347B2";

var CONVO = "convo";

var CONTACT_BACKGROUND_COLOR = "#FFFFFF";
var CONTACT_BACKGROUND_COLOR_SELETED = "#FF7FE5";

var CLASS_SELECTED_CONTACT = "selected_contact";
var CLASS_REMOVE_SHIFT_SELECT = "remove_shift_select";

var CLASS_RECIPIENTS = "new_message_recipients";
var RECIPIENT_LIST = "RECIPIENT_LIST";

var sendingNewMessage = false;


/**
 * Adds all contacts in the conversations_key_array to the ui display = none
 */
function uiAddAllConversations() {
    $("slt_conversation").empty();
    var jsonArray = retrieveConversations();
    var keys = Object.keys(jsonArray);
    var slt_conversation = $('#slt_conversation');
    $.each(jsonArray, function (index, value) {
        var key = Object.keys(value)[0];
        var recip = value[key][RECIPIENTS];
        var text = recip.length;
        var namesAndNumbers = [];
        for (var r in recip) {
            if (recip[r][FULL_NAME] != null) {
                // text += " [" + recip[r][FULL_NAME] + "]";
                namesAndNumbers.push(recip[r][FULL_NAME] + " " +
                    getPhoneNumberFormat(recip[r][PHONE_NUMBER]));
            } else {
                // text += " [" + recip[r][PHONE_NUMBER] + "]";
                namesAndNumbers.push(getPhoneNumberFormat(recip[r][PHONE_NUMBER]));
            }
        }
        var convoIdDiv = $('#' + CONVERSATIONS + key);
        //if exists create and add div
        if (convoIdDiv.length == 0) {
            var createdConvo = createConversationDiv(namesAndNumbers, key, value[key][MESSAGE_COUNT]);

            //set color selected back to the correct selected color
            var convoIdVal = $('#convo_id').val();
            if (convoIdVal == key) {
                createdConvo.css("background-color", CONVO_BACKGROUND_COLOR_SELECTED);
            }

            createdConvo.on("click",function () {
                var convo_id = $('#convo_id');
                var convo_id_val = convo_id.val();

                var selectedConvo = $(this);
                var id = getNumbersFromString(selectedConvo.attr('id'));

                //selected id does not equal convo id currently on
                if(id != convo_id_val) {
                    if (id != convo_id_val) {
                        //reset the background color to white
                        $('#' + CONVERSATIONS + convo_id_val).css("background-color", "");
                        storeScrollTop(convo_id_val, getRMAdjustedScrollTop());
                    }

                    convo_id.attr("value",id);

                    if (!uiAddConversationMessages(id)) {
                        //no messages found, sending request for more
                        webSocketCon.send(getMessagesJSON(id,DEFAULT_GET_MESSAGES,-1,0/*before*/));
                    } else {
                        //convo messages were found hide current convo messages
                        $('#' + CONVO + convo_id_val).hide();
                    }
                    setTimeout(function() {
                        uiScrollTop(retrieveScrollTop(id));
                    }, 300);
                }
                selectedConvo.css("background-color",CONVO_BACKGROUND_COLOR_SELECTED);
            });
            slt_conversation.append(createdConvo);
        } else {
            //updating div if already exists
            var span = convoIdDiv.children("span")[0];
            span.innerText = span.textContent = value[key][MESSAGE_COUNT];
            slt_conversation.append(convoIdDiv);
        }
    });
}

/**
 * Adds all contacts in the contacts_key_array to the ui display = none
 */
function uiAddAllContacts() {
    var contacts = $("#slt_contact");
    var jsonArray = retrieveContacts();
    for (var i in jsonArray) {
        var key = Object.keys(jsonArray[i])[0];
        var contact = $('#' + CONTACTS + key);
        //if does not exists create new field
        if (contact.length == 0) {
            contact = createContactDiv(jsonArray[i][key][FULL_NAME],
                key,
                getPhoneNumberFormat(jsonArray[i][key][PHONE_NUMBER])
            );
        }
        contacts.append(contact);
    }
}

/**
 * Removes current messages display and displays the new ones or sends request
 * @param convo_id
 */
function uiAddConversationMessages(convo_id) {
    var messagesArray = retrieveMessages(convo_id);
    if (messagesArray !== null) {
        var rmArea = $('#rt_messageArea');
        var tempMessageIdArr = retrieveMessageTempIdArr().slice();
        var convoDiv = $('#' + CONVO + convo_id).show();

        //adds convo to rmArea if not already existed
        if (convoDiv.length == 0) {
            convoDiv = $('<div id="' + CONVO + convo_id + '">').show();
            rmArea.append(convoDiv);
        }

        //conversation does not exist, add all messages
        $.each(messagesArray, function (index, jsonObject) {
            var key = Object.keys(jsonObject)[0];

            var messageDiv = $('#' + MESSAGES + key);
            if (messageDiv.length == 0) {
                uiAppendMessage(jsonObject[key], key, convoDiv, convo_id);
            } else {
                //if the message does exist then just append it do not recreate div
                convoDiv.append(messageDiv);
            }

            //if same id then add temp_message right after
            var tempIdArr = retrieveMessageTempIdArr();
            for (var i in tempIdArr) {
                var jsonTemp = JSON.parse(tempIdArr[i]);
                if (jsonTemp[TEMP_MESSAGE_ID] == key) {
                    uiAppendMessage(jsonTemp[TEMP_MESSAGE_ID], key, convoDiv, convo_id);
                }
            }
        });
    } else {
        return false;
    }
    return true;
}

/**
 * Prepends messages.
 * @param convo_id
 * @param jsonMessageArr
 * @param convoId - conversation to add messages to
 */
function uiPrependMessage(convo_id,jsonMessageArr,convoId) {
    var convoDiv = convoDivExists(convo_id);
    var rmArea = $('#rt_messageArea');
    var divScroll = -1;
    if (convoDiv == null) {
        //convo div does not exist create it and append it
        convoDiv = $('<div id="' + CONVO + convoId + '">');
        $('#rt_messageArea').append(convoDiv);
    } else {
        divScroll = rmArea.scrollTop()-rmArea.offset().top;
    }
    $.each(jsonMessageArr, function (index, message) {
        $.each(message, function (index, messageInfo) {
            //check if message already exists
            if ($('#' + MESSAGES + index).length == 0 ) {
                convoDiv.prepend(createMessageDiv(messageInfo, index, convoId));
            }
        });
    });
    if (divScroll >= 0) {
        divScroll += (rmArea.offset().top*2);
    }
    uiScrollTop(divScroll);
}

/**
 * Appends messages to the message area
 * @param id - id of message
 * @param convoDiv - conversation to add messages to
 */
function uiAppendMessage(jsonObject, id, convoDiv, convoId) {
    var messageRowDiv = createMessageDiv(jsonObject, id, convoId);
    convoDiv.append(messageRowDiv);
}

/**
 * Creates and returns a message div
 * @param jsonObject
 * @param id - message id
 * @param convoId
 * @returns {*|void}
 */
function createMessageDiv(jsonObject, id, convoId) {
    var body,
        type,
        data = false,
        mms = (jsonObject[TYPE] == MMS),
        multi = retrieveConversation(convoId)[RECIPIENTS].length > 1;

    if (mms) {
        body = getTextFromParts(jsonObject[PARTS]);
        data = hasDataFromParts(jsonObject[PARTS]);
        type = jsonObject[MESSAGE_TYPE];
    } else {
        body = jsonObject[BODY];
        type = jsonObject[MESSAGE_TYPE];
    }
    var messageRowDiv;
    var messageTextSpan;
    var messageDataDiv;
    if (type == TYPE_INBOX) {
        messageRowDiv = $('<div>').css({
            "margin": "4px 6px",
            "width":"100%",
            "float":"right",
        });
        if(data) {
            messageDataDiv = $('<div>');
            $.each(jsonObject[PARTS], function (index, value) {
                if (value[CONTENT_TYPE] != "text/plain") {
                    var messageDataSpan = $('<span>').html("Click me to load image!")
                        .addClass("data")
                        .css({
                            "float": "left",
                            "display": "block",
                            "clear": "left",
                        })
                        .attr("id",DATA+value['id'])
                        .attr("val",value[CONTENT_TYPE]);
                    messageDataSpan.on("click",function () {
                        if(!retrieveDataLoad($(this).attr('id'))) {
                            var id = getNumbersFromString($(this).attr('id'));
                            var content_type = $(this).attr('val');
                            var messageId = getNumbersFromString($(this).parent().parent().attr('id'));
                            webSocketCon.send(prepareGetData(id,content_type,messageId));
                            $(this).html("  Loading...");
                            $(this).prepend($('<span>').addClass("glyphicon glyphicon-refresh spinning"));
                            $(this).attr('id', DATALOAD + id);
                        }
                    });
                    messageDataDiv.append(messageDataSpan);
                }
            });
        }
        if((mms && body != "") || !mms) {
            messageTextSpan = $('<span>').html(body).css({
                "float": "left",
                "padding": "6px 12px",
                "background-color": MESSAGE_BACKGROUND_COLOR_RECEIVED,
                "border-radius": "20px",
                "max-width":"45%",
                "word-wrap":"break-word",
                "color":MESSAGE_TEXT_COLOR,
                "display":"inline-block",
                "word-break":"break-word",
                "clear":"left",
                "font-size": "16px",
            });
        }
        if (multi) {
            if (messageTextSpan != undefined) {
                messageTextSpan.html(messageTextSpan.html() + "<br>");
                var contactTextSpan = $('<span>').html(matchAddressFromConvo(convoId,jsonObject[ADDRESS])).css({
                    "word-wrap":"break-word",
                    "display":"inline-block",
                    "word-break":"break-word",
                    "font-size":"13px",
                });
                messageTextSpan.append(contactTextSpan);
            }
        }
        messageRowDiv.attr("id",MESSAGES+id);
    } else if (type == TYPE_SENT) {
        messageRowDiv = $('<div>').css({
            "margin": "4px 6px",
            "width": "100%",
            "float": "left", //todo tabindex for the right things
        });//todo xss protection

        if(data) {
            messageDataDiv = $('<div>');
            $.each(jsonObject[PARTS], function (index, value) {
                if (value[CONTENT_TYPE] != "text/plain") {
                    var messageDataSpan = $('<span>').html("Click me to load image!")
                        .addClass("data")
                        .css({
                            "float": "right",
                            "display": "block",
                            "clear": "right",
                        })
                        .attr("id",DATA+value['id'])
                        .attr("val",value[CONTENT_TYPE]);
                    messageDataSpan.on("click",function () {
                        if(!retrieveDataLoad($(this).attr('id'))) {
                            var id = getNumbersFromString($(this).attr('id'));
                            var content_type = $(this).attr('val');
                            var messageId = getNumbersFromString($(this).parent().parent().attr('id'));
                            webSocketCon.send(prepareGetData(id,content_type,messageId));
                            $(this).html("  Loading...");
                            $(this).prepend($('<span>').addClass("glyphicon glyphicon-refresh spinning"));
                            $(this).attr('id', DATALOAD + id);
                        }
                    });
                    messageDataDiv.append(messageDataSpan);
                }
            });
        }
        if((mms && body != "") || !mms) {
            messageTextSpan = $('<span>').html(body).css({
                "float": "right",
                "padding": "6px 12px",
                "background-color": MESSAGE_BACKGROUND_COLOR_ME_SENT,
                "border-radius": "20px",
                "max-width": "45%",
                "word-wrap": "break-word",
                "color":MESSAGE_TEXT_COLOR,
                "display":"inline-block",
                "word-break":"break-word",
                "clear":"right",
                "font-size": "16px",
            });
        }
        messageRowDiv.attr("id",MESSAGES+id); //todo obsfucate
    } else if (type == TYPE_LOCAL_SEND) { //todo add more descriptive documentation
        messageTextSpan = $('<span>').html(body).css({
            "float": "right",
            "padding": "6px 12px",
            "background-color": MESSAGE_BACKGROUND_COLOR_WAITING,
            "border-radius": "20px",
            "max-width":"45%",
            "word-wrap":"break-word",
            "display":"inline-block",
            "word-break":"break-word",
            "color":MESSAGE_TEXT_COLOR,
            "font-size": "16px",
        });
        messageRowDiv = $('<div>').css({
            "margin": "4px 6px",
            "width":"100%",
            "float":"left",
        });
        messageRowDiv.attr("id",TEMP_MESSAGE_ID+id);
    } else {
        messageTextSpan = $('<span>').html(body).css({
            "float":"left",
            "padding":"6px 12px",
            "background-color":"#800080",
            "border-radius":"20px",
            "max-width":"45%",
            "word-wrap":"break-word",
            "display":"inline-block",
            "word-break":"break-word",
            "color":MESSAGE_TEXT_COLOR,
            "font-size": "16px",
        });
        messageRowDiv = $('<div>').css({
            "margin":"4px 6px",
            "width":"100%",
            "float":"left",
        });
        messageRowDiv.attr("id",MESSAGES+id);
    }

    messageRowDiv.append(messageTextSpan);
    if(messageDataDiv != null) {
        messageRowDiv.append(messageDataDiv);
    }
    return messageRowDiv;
}

/**
 * Creates a Conversation div
 * @param names {array} of names
 * @param id    id of conversation
 * @returns {*|jQuery}
 */
function createConversationDiv(names, id, message_count) {
    var fullString = "";
    // fullString += names.length + "<br>";
    for (var n in names) {
        fullString += (names[n]);
        if (n != names.length) {
             fullString += "<br>";
        }
    }

    var convoRowDiv = $('<div>').attr({
            "class": "list-group-item list-group-item-action",
            "id":CONVERSATIONS+id,
            "data-toggle": "tooltip",
            "data-placement": "right",
            "data-html": true,
            "title": fullString,
        }).css({
        "width": "100%",
        // "height": "100%",
        "text-overflow": "ellipsis",
        "text-align": "left",
    });

    var convoNameSpan = $('<span>').html(fullString).css({
        "float": "left",
        "display": "block",
    });

    var convoMessageCountSpan = $('<span>').html(
        getNumberCommaFormatted(message_count))
            .css({
                "display": "block",
                "float": "right",
                "color": "white",
                "padding": "3px 3px",
                "border-radius": "20px",
                "background-color": CONVO_BACKGROUND_MESSAGE_COUNT,
            });
    convoRowDiv.append(convoMessageCountSpan);
    convoRowDiv.append(convoNameSpan);
    convoRowDiv.addClass(CLASS_POINTER);
    convoRowDiv.tooltip();
    return convoRowDiv;
}

/**
 * Creates a Contacts div
 * @param full_name string name associated with contact
 * @param id    id of conversation
 * @param phone_number number associated with name of contact
 * @returns {*|jQuery}
 */
function createContactDiv(full_name, id, phone_number) {
    var contactsRowDiv = $('<div>').attr({
            "class": "list-group-item list-group-item-action pointer " + CLASS_REMOVE_SHIFT_SELECT,
            "id":CONTACTS+id,
            "data-toggle": "tooltip",
            "data-placement": "right",
            "title": phone_number,
        }).css({
        "width": "100%",
    });
    contactsRowDiv.on("click", function (e) {
        //used to tell if sending new message
        if (!sendingNewMessage) {
            if(!e.shiftKey) {
                $("#slt_contact").children().removeClass(CLASS_SELECTED_CONTACT);
                $("#recipientList").empty();
            }
            var contact = $(this);
            contact.addClass(CLASS_SELECTED_CONTACT);
            //open new message modal
            var new_message_container = $('#new_message_container');
            if (!new_message_container.isShown) {
                $('#new_message_container').show();
            }
            var recipientList = $('#recipientList');
            if ($('#' + RECIPIENT_LIST + id).length == 0) {
                recipientList.append(createRecipientDiv(contact.text().trim(), id));
            } else {
                $('#' + RECIPIENT_LIST + id).remove();
                contact.removeClass(CLASS_SELECTED_CONTACT);
            }
        }
    });
    var convoNameSpan = $('<span>').html(full_name).attr("id", CONTACTS + id);
    contactsRowDiv.append(convoNameSpan);
    contactsRowDiv.tooltip();
    return contactsRowDiv;
}

/**
 * Div containing recipients for a new message. //TODO MAKE scrollable list
 * //TODO MAKE MAX SIZE for text area
 * //TODO Make count for chars in text area
 * @param recipient_name
 * @param id
 * @returns {*|jQuery}
 */
function createRecipientDiv(recipient_name, id) {
    var recipientUl = $('<ul>').attr({
        "class": "list-group-item " + CLASS_RECIPIENTS,
    });
    recipientUl.attr("id", RECIPIENT_LIST + id);
    var removeDiv = $('<div>').attr({
        "class": "glyphicon glyphicon-remove " + CLASS_POINTER_NEW_MESSAGE,
        "float": "right",
    });
    removeDiv.on("click", function () {
        var removeDiv = $(this);
        removeDiv.parent().remove();
        var key = getNumbersFromString(removeDiv.parent().attr("id"));
        $('#' + CONTACTS + key).removeClass(CLASS_SELECTED_CONTACT);
    });
    recipientUl.append($('<div>').text(recipient_name).attr("float","left"));
    recipientUl.append(removeDiv);
    return recipientUl;
}

/**
 * Changes the color of message div when it is sent by device
 * @param temp_id
 * @param id
 */
function uiUpdateMessage(temp_id, id) {
    var messageDiv = $('#' + TEMP_MESSAGE_ID + temp_id);
    if (messageDiv != null) {
        messageDiv.children("span").css("background-color",
            MESSAGE_BACKGROUND_COLOR_ME_SENT);
        messageDiv.attr(ID,MESSAGES + id);
    } else {
    }
}

/**
 * Scrolls to location, if < 0 or null than scrolls to bottom
 * @param location
 * @return location used for chaining
 */
function uiScrollTop(tag) {
    var rmArea = $('#rt_messageArea');
    if (tag == null || tag < 0) {
        //if less < 0 or null than will choose newest element
        // var children = rmArea.children();
        // tag = $('#' + children[children.length-1].id).offset().top;
        tag = 1000000;
    }
    var location = tag-rmArea.offset().top;
    rmArea.animate({
        scrollTop: location
    });
    return location;
}

/**
 * Changes color of conversation to color of received message
 * @param convoId
 */
function uiConversationNewMesssage(convoId) {
    var convo = $('#' + CONVERSATIONS + convoId);
    convo.css('background-color', CONVO_BACKGROUND_COLOR_MESSAGE_RECEIVED);
    var convos = $('#slt_conversation');
    convos.prepend(convo);
}

/**
 * Returns text from mms
 * @param {array} parts
 * @returns {*}
 */
function getTextFromParts(parts) {
    for (var i in parts) {
        if (parts[i][CONTENT_TYPE] == CONTENT_TYPE_TEXT_PLAIN) {
            return parts[i][TEXT];
        }
    }
    return "";
}

/**
 * Returns data from mms
 * @param {array} parts
 * @returns {*}
 */
function hasDataFromParts(parts) {
    for (var i in parts) {
        if (parts[i][CONTENT_TYPE].includes(CONTENT_TYPE_IMAGE)) {
            return true
        }
    }
    return false;
}


/**
 * Formats the phone number to be presentable for front-end user end
 * @param phone_number number to be formatted
 */
function getPhoneNumberFormat(phone_number) {
    var formatted_number = "";
    var raw_number = phone_number.replace(/\D/g,"");
    if (raw_number.length == 10) {
        formatted_number += "(";
        formatted_number += raw_number.substr(0,3);
        formatted_number += ")-";
        formatted_number += raw_number.substr(3,3);
        formatted_number += "-";
        formatted_number += raw_number.substr(6,4);
    } else if (raw_number.length==11){
        formatted_number += "+";
        formatted_number += raw_number.substr(0,1);
        formatted_number += "(";
        formatted_number += raw_number.substr(1,3);
        formatted_number += ")-";
        formatted_number += raw_number.substr(4,3);
        formatted_number += "-";
        formatted_number += raw_number.substr(7,4);
    } else {
        formatted_number = phone_number;
    }
    return formatted_number;
}

/**
 * Formats a number to output with commos
 * @param phone_number
 * @returns {string}
 */
function getNumberCommaFormatted(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Returns integers of id from a string
 * @param id
 * @returns {string|XML|void|*}
 */
function getNumbersFromString(id) {
    return id.replace(/\D/g,"");
}

/**
 * Updates the UI sending screen
 * @param boolean_val
 */
function uiSendingNewMessage(boolean_val) {
    sendingNewMessage = boolean_val;
    if (sendingNewMessage) {
        $('#new_message_btns').hide();
        $('#sending_div').show();
        $('#new_message_textArea').prop("disabled", true);
        $('.new_message_pointer').hide();
    } else {
        $('#new_message_btns').show();
        $('#sending_div').hide();
        $('#new_message_textArea').prop("disabled", false);
        $('#new_message_cancelBtn').click();
        $('.new_message_pointer').show();
    }
}

/**
 * Returns adjusted scroll top for container
 */
function getRMAdjustedScrollTop() {
    var rmArea = $('#rt_messageArea');
    return rmArea.offset().top+rmArea.scrollTop();
}

/**
 * Returns a new convo and adds it to the message area (rmArea)
 * or it returns an already created div
 * @param convoId
 */
function convoDivExists(convoId) {
    var convoDiv = $('#' + CONVO + convoId);
    if (convoDiv.length == 0) {
        return null;
    }
    return convoDiv;
}

/**
 * Takes in a convoId and an address, looks through convo and matches
 * any address's that equal the given address, returns name
 * @param convoId
 * @param address
 * @returns {string}
 */
function matchAddressFromConvo(convoId, address) {
    var recipients = retrieveConversation(convoId)[RECIPIENTS];
    for(var i = 0; i < recipients.length; i++) {
        var value = recipients[i];
        var key = Object.keys(value)[0];
        if (address == value[PHONE_NUMBER]) {
            return value[FULL_NAME];
        }
    }
    return "UNKNOWN";
}

// Listeners
$('#lsb_contactsTab').on("click", function(){
    $('#lsb_contactsTab').css({"background-color":"white",
                        "border-top":"solid black 1px",
                        "border-bottom":"solid transparent 1px",});
    $('#lsb_conversationsTab').css({"background-color":"#C77FFF",
                      "border-top":"solid black 1px",
                      "border-bottom":"solid black 1px",});
    //displaying contacts
    $('#slt_contact').show();
    $('#slt_conversation').hide();
});

$('#lsb_conversationsTab').on("click", function(){
    $('#lsb_conversationsTab').css({"background-color":"white",
                      "border-top":"solid black 1px",
                      "border-bottom":"solid transparent 1px",});
    $('#lsb_contactsTab').css({"background-color":"#C77FFF",
                        "border-top":"solid black 1px",
                        "border-bottom":"solid black 1px",});
    $('#slt_conversation').show();
    $('#slt_contact').hide();
});

$('#lsb_searchBar').on("input", function () {
    $('#lsb_contactsTab').click();
    var searchText = $(this).first().val();
    if (searchText.length > 0) {
        var siblings = $('#slt_contact').children();
        $.each(siblings, function (index, value) {
            var tempValue = $(value);
            if (tempValue.text().toUpperCase().indexOf(String(searchText).toUpperCase()) > -1) {
                tempValue.show();
            } else {
                tempValue.hide();
            }
        });
    } else {
        $('#slt_contact').children().show();
    }
});

$("#new_message_cancelBtn").on("click", function () {
    $("#new_message_container").hide();
    $("#slt_contact").children().removeClass(CLASS_SELECTED_CONTACT);
    $("#recipientList").empty();
    $("#new_message_textArea").val("");
});

$("#new_message_sendBtn").on("click", function() {
    var children = $("#recipientList").children();
    var text = $('#new_message_textArea').val();
    if (text.length > 0 && children.length > 0) {
        var numbersJson = [];
        for (var i = 0; i < children.length; i++) {
            var contact = retrieveContact(getNumbersFromString(children[i].id));
            var number = getNumbersFromString(contact[PHONE_NUMBER]);
            numbersJson.push({
                "number": number
            });
        }//TODO DOCUMENTATION
        //TODO HAVE TO REINVENT HOW TO SEND NEW MESSAGES

        temp_convo_id_count++;

        storeConvoTempId(temp_convo_id_count);

        //update sending message
        uiSendingNewMessage(true);

        var messageObjectString = prepareMessages(text,
                "",
                numbersJson,
                temp_convo_id_count); //TODO redo temp id
        webSocketCon.send(messageObjectString);
    }
});

var messageInput = $('#rt_messageInput');
messageInput.keydown(function(e) {
    if (e.keyCode == 16 && e.keyCode == 13) {
        return true;
    }
    if (e.keyCode == 13) {
        $('#rt_sendBtn').click();
        return false;
    }
});

messageInput.bind("DOMSubtreeModified",function() {
    $('#rm_charCount').html(getNumberCommaFormatted($(this).text().length));
});
// ***************************************************


var sent_message_temp_id = [];
const ACTION = "action",
        POST_CONTACTS = "post_contacts",
        POST_CONVERSATIONS = "post_conversations",
        POST_MESSAGES = "post_messages",
        SENT_MESSAGES = "sent_messages",
        SENT_MESSAGES_FAILED = "sent_messages_failed",
        CONNECTED = "connected",
        DISCONNECTED = "disconnected",
        RECEIVED_MESSAGE = "received_message",
        POST_DATA = "post_data";
var DATA = "data";

var android_connected = true;

var active_json;
var conversations;
var contacts;
var initial_connect_conversations = true;

var DEFAULT_TITLE = "RoofText";
var MESSAGE_TITLE = "RoofText";
var titleInterval;

var webOnMessage = function(e) {
    active_json = JSON.parse(e.data);
    switch (active_json[ACTION]) {
        case POST_CONTACTS:
                //contacts received, populate contacts section
                storeContacts(active_json);
                uiAddAllContacts();
            break;
        case POST_CONVERSATIONS:
                //conversations received, populate conversations section
                storeConversations(active_json);
                uiAddAllConversations();
                //initial connect ask for messages from convo
                if (initial_connect_conversations) {
                    var convos = retrieveConversations();
                    var count = 0;
                    for (var i in convos) {
                        var key = Object.keys(convos[i])[0];
                        var convo = retrieveMessages(key);
                        if (convo == null) {
                            webSocketCon.send(getMessagesJSON(key,
                            DEFAULT_GET_MESSAGES,
                            -1 /*offset*/,
                            0 /*before*/));
                        } else {
                            webSocketCon.send(getMessagesJSON(key,
                            DEFAULT_GET_MESSAGES_AFTER,
                             convo[0][Object.keys(convo[0])][DATE_RECIEVED]/*offset*/,
                            1 /*after*/));
                        }
                        if (count > 10) {
                            break;
                        }
                        count++;
                    }
                    initial_connect_conversations = false;
                }
            break;
        case POST_MESSAGES:
                //messages received, populate conversations section
                storeMessages(active_json);
                var jsonConvoId = active_json[THREAD_ID];
                var convoIdVal = $('#convo_id').val();
                if (jsonConvoId == convoIdVal) {
                    //convoDiv empty for specific convo then addAllMessages
                    var convoDiv = convoDivExists(convoIdVal);
                    if (convoDiv == null) {
                        //problems if click on convo before loaded
                        //should append in this case
                        //was making conversation appear backwards
                        uiAddConversationMessages(convoIdVal)
                    } else {
                        uiPrependMessage(jsonConvoId,active_json[jsonConvoId],convoIdVal);
                    }
                }

                //if convo for message does not exist then ask for update of all messages
                if ($('#' + CONVERSATIONS + jsonConvoId).length == 0) {
                    webSocketCon.send(getConversations());
                }
            break;
        case SENT_MESSAGES:
                //message successfully sent, ??Change color of message bubble???

                //UPDATING CONVO ID FOR NEW_MESSAGE_SENT (USED FOR CONVOS THAT DO NOT EXIST)
                var tempIdArr = retrieveConvoTempIdArr();
                for (var i in tempIdArr) {
                    if (tempIdArr[i] == active_json[TEMP_MESSAGE_ID]) { //TODO RENAME TEMP_MESSAGE_ID to TEMP_ID
                        tempIdArr.splice(i,1);
                        //get convo if not already have
                        if (retrieveConversation(active_json[THREAD_ID]) == null) {
                            webSocketCon.send(getConversations()); //TODO WAISTEFUL, MAKE JSON TO REQUEST ONE CONVO
                            webSocketCon.send(getMessagesJSON(active_json[THREAD_ID],
                                    DEFAULT_GET_MESSAGES,
                                    -1, /*offset*/
                                    1 /*period*/));
                        } else {
                            $('#slt_conversation').prepend($('#' + CONVERSATIONS + active_json[THREAD_ID]));
                        }

                        //update sending msg
                        uiSendingNewMessage(false);
                    }
                }

                //UPDATING TEMP ID FOR MESSAGE SENT
                tempIdArr = retrieveMessageTempIdArr();
                for (var i in tempIdArr) {
                    var jsonTemp = JSON.parse(tempIdArr[i]);
                    if (jsonTemp[TEMP_MESSAGE_ID] == active_json[TEMP_MESSAGE_ID]) {
                        uiUpdateMessage(active_json[TEMP_MESSAGE_ID],
                            active_json[MESSAGE_ID]);
                        tempIdArr.splice(i,1);
                    }
                }

                storeMessages(active_json);
            break;
        case SENT_MESSAGES_FAILED:
                //message failed to send, ??Change color of message bubble???
            break;
        case CONNECTED:
                //android connected
                android_connected = true;
                startUpCalls();
                $('#loading_label').css("background-color", "#52CC82");
                $('#loading_text').html("Loading Content..");
                setTimeout(function () {
                    $('#connect_waiting').modal('hide');
                    $('#loading_label').css("background-color", "#C77FFF");
                $('#loading_text').html("Waiting to connect...");
                }, 1500);
            break;
        case DISCONNECTED:
                //android disconnected
                android_connected = false;
                $('#connect_waiting').modal('show').focus();
                //TODO fix backend to not send disconnect on wifi reconnect disconnect
                sendConnected();
            break;
        case RECEIVED_MESSAGE:
                //received a message check to add to ui
                var tempJson = active_json;
                var convo_id_val = $('#convo_id').val();
                var jsonConvoId = active_json[THREAD_ID];

                var convoDiv = convoDivExists(jsonConvoId);
                if (convoDiv != null && convo_id_val == jsonConvoId) {
                    //if the convoDiv exists update date the div by appending the messages
                    //only updates ui with same convoid with json id
                    var jsonObject = active_json[jsonConvoId];
                    for (var i in jsonObject) {
                        var key = Object.keys(jsonObject[i])[0];
                        uiAppendMessage(jsonObject[i][key],key,convoDiv,convo_id_val);
                    }
                    storeScrollTop(jsonConvoId, -1);
                }

                storeMessages(active_json);
                //update the conversation color to state that it has a new message
                uiConversationNewMesssage(jsonConvoId);
                //if conversation is not here then load it
                if (!retrieveConversation(convo_id_val)) {
                    //TODO will need to change to send a new convo and push to top of queue and change color
                    //NEED TO LOAD SPECIFIC CONVERSATIONS
                    //FOR NOW USING GENERAL LOAD
                    webSocketCon.send(getConversations());
                }

                //if not in focus change title of tab
                if (!inFocus) {
                    MESSAGE_TITLE = "You have a message.";
                    if (titleInterval == null) {
                        //if null then do not create a new one
                        titleInterval = setInterval(function(){
                            var title = document.title;
                            document.title = (title == DEFAULT_TITLE ? MESSAGE_TITLE : DEFAULT_TITLE);
                        }, 750);
                    }
                }
            break;
        case POST_DATA:
                //received data call

                //storeData(active_json[MESSAGE_ID], active_json[DATA]);

                //attempts to find image
                var FAIL = "fail";
                if (active_json[FAIL]) {
                    $('#' + DATA + active_json[PART_ID])
                            .removeClass()
                            .off('click')
                            .addClass("data_fail")
                            .html('Error loading. Currently only support images data.');
                } else {
                    var IMG = "image";
                    var img = $('#'+DATA + active_json[PART_ID] + IMG);
                    var dataLoad = $('#' + DATALOAD + active_json[PART_ID]);
                    if(img.length == 0) {
                        //if image is not found then create new image object
                        var tempH = $('<a>')
                                .attr("href","#")
                                .attr("class","imageTop");
                        img = $('<img id="' + DATA + active_json[PART_ID] + IMG + '">')
                                .attr('src','data:image/png;base64,')
                                .css("clear","left")
                                .hide()
                                .addClass("img_area")
                                //HEY YOU****************************************************
                                //YOU NEED TO INCLUDE MESSAGE_ID ****************************
                                //OR ITLL BE A PROBLEM
                                .css("float",dataLoad.css("float"))
                                .css("clear",dataLoad.css("clear"));
                        tempH.append(img);
                        tempH.insertAfter(dataLoad);
                    }
                    //append to img
                    img.attr('src', img.attr('src') + active_json[DATA]);

                    var FINISH = "finish";
                    if(active_json[FINISH]){
                        //if it is the last section then notify gui to update
                        img.show();
                        dataLoad.remove();
                    }
                }
            break;
    }
};

var webOnOpen = function() {
    sendConnected();
};

var webOnErrorClose = function(){
        $('#connect_waiting').modal({
            backdrop: 'static',
            show:true
        });
        setTimeout(function(){
            webSocketCon = start(URL);
        }, 7500);
    };

var webSocketCon = start();

function start(){
    ws = new WebSocket(URL);
    ws.onopen = webOnOpen;
    ws.onmessage = webOnMessage;
    //ws.onerror = webOnErrorClose;
    ws.onclose = webOnErrorClose;
    return ws;
}

$('#rt_sendBtn').click(function(){
    var rm_message_input = $('#rt_messageInput');
    var convo_id_val = $('#convo_id').val();
    if (rm_message_input.html().length > 0 && convo_id_val != "") {
        var rmArea = $('#rt_messageArea');
        var temp_id = getNumbersFromString(rmArea.children().last().attr('id'));
        var body = rm_message_input.text();
        var messageObjectString = prepareMessages(body, "", getNumbers(convo_id_val), temp_id);
        rm_message_input.html("");
        //append to ui
        webSocketCon.send(messageObjectString);
        var messageObject = JSON.parse(messageObjectString)
        messageObject[MESSAGE_TYPE] = TYPE_LOCAL_SEND;
        var convoDiv = $('#' + CONVO + convo_id_val);
        uiAppendMessage(messageObject, temp_id, convoDiv, convo_id_val);
        $('#slt_conversation').prepend(
                $('#' + CONVERSATIONS + convo_id_val)
                        .css("background-color",CONVO_BACKGROUND_COLOR_SELECTED));
        //store for future reference
        storeMessageTempIdArr(temp_id, convo_id_val, body);
        storeScrollTop(convo_id_val,uiScrollTop(-1));
    }
});

$(document).on("click", "a.imageTop",function(){
    $('#imageModalIMG').attr('src', $(this).find('img').attr('src'));
    $('#imageModal').modal("show");
});

//scrolling query more messages
$('#rt_messageArea').on("scroll",function(){
    if($(this).offset().top == 0) {
        var convo_id = $('#convo_id').val();
        var messageZero = retrieveMessages(convo_id)[0];
        var offset = messageZero[Objects.key(messageZero)[0]][DATE_RECIEVED];
        webSocketCon.send(getMessagesJSON(convo_id,DEFAULT_GET_MESSAGES,offset,0/*before*/));
    }
});

var loadWait = true,
        loadWaitTime = 1000;

$('#rt_loadBtn').on("click", function () {
    if (loadWait) {
        var convoIdVal = $('#convo_id').val();
        if (convoIdVal !== null && convoIdVal) {
            var rmArea = $('#rt_messageArea');
            var key = Object.keys(retrieveMessages(convoIdVal)[0]);
            var offset = retrieveMessages(convoIdVal)[0][key][DATE_RECIEVED];
            webSocketCon.send(getMessagesJSON(convoIdVal,DEFAULT_GET_MESSAGES,offset,0/*before*/));
        }
        loadWait = false;
        setTimeout(function() { loadWait = true }, loadWaitTime);
    }
});

window.onload = function () {
    $('#slt_contact').hide();

    $('#connect_waiting').modal({
        backdrop: 'static',
        show:true
    });

    $('#lsb_conversationsTab').click();
};

function startUpCalls() {
    //loads contacts
    webSocketCon.send(getContacts());
    //loads top conversations
    webSocketCon.send(getConversations());
}

function sendConnected() {
    webSocketCon.send(JSON.stringify( {
        "action" : CONNECTED
    }));
}

//used to keep track if window is in focus or not
var inFocus = 1;
$(window).focus(function() {
    inFocus = 1;
    if (titleInterval != null) {
        clearInterval(titleInterval);
        titleInterval = null;
    }
    document.title = DEFAULT_TITLE;
});

$(window).blur(function() {
    inFocus = 0;
});
