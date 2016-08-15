var DEFAULT_GET_MESSAGES = 15;

var BODY = "body";
var MESSAGE_TYPE = "message_type";
var THREAD_ID = "thread_id";
var ID = "ID";
var TYPE_INBOX = 1;
var TYPE_SENT = 2;

var TYPE_LOCAL_SEND = 20; //waiting to see if successfully sent'


var MESSAGE_BACKGROUND_COLOR_ME_SENT = "#ffff00";
var MESSAGE_BACKGROUND_COLOR_RECEIVED = "#CDF0FF";
var MESSAGE_BACKGROUND_COLOR_WAITING = "#7C26CB";
var CONVO_BACKGROUND_COLOR = "#E3D8D5";
var CONVO_MESSAGE_RECEIVED_COLOR = "#FF5733";
var CONVO_CLASS = "convoClass";


/**
 * Adds all contacts in the conversations_key_array to the ui display = none
 */
function uiAddAllConversations() {
    $("slt_conversation").empty();
    var jsonArray = retrieveConversations();
    var keys = Object.keys(jsonArray);
    var slt_conversation = $('#slt_conversation');
    slt_conversation.empty();
    $.each(jsonArray, function (index, value) {
        var key = Object.keys(value)[0];
        var recip = value[key][RECIPIENTS];
        var text = recip.length;
        var namesAndNumbers = [];
        for (var r in recip) {
            if (recip[r][FULL_NAME] != null) {
                // text += " [" + recip[r][FULL_NAME] + "]";
                namesAndNumbers.push(recip[r][FULL_NAME] + " " +
                    recip[r][PHONE_NUMBER]);
            } else {
                // text += " [" + recip[r][PHONE_NUMBER] + "]";
                namesAndNumbers.push(recip[r][PHONE_NUMBER]);
            }
        }
        var createdConvo = createConversationDiv(namesAndNumbers, key);
        createdConvo.on("click",function () {
            var convo_id = $('#convo_id');
            var convo_id_val = convo_id.val();
            var selectedConvo = $(this);

            var match =  (/(.*?)([0-9]+)/g).exec(selectedConvo.attr('id'));

            var id = match[2];
            if (id != convo_id_val) {
                storeScrollTop(convo_id_val, $('#rm_messageArea').scrollTop());
            }
            console.log(id + " " + selectedConvo.attr('id'));
            convo_id.attr("value",id);
            if (!uiAddConversationMessages(id)) {
                webSocketCon.send(getMessagesJSON(id,DEFAULT_GET_MESSAGES,0));
            }
            uiScrollTop(retrieveScrollTop(id));
            selectedConvo.css("background-color",CONVO_BACKGROUND_COLOR);
        });
        slt_conversation.append(createdConvo);
    });
}

/**
 * Adds all contacts in the contacts_key_array to the ui display = none
 */
function uiAddAllContacts() {
    $("slt_contact").find('option').remove().end();
    var jsonArray = retrieveContacts();
    var contact_keys = contacts_key_array.slice();
    for (var i in jsonArray) {
        uiAddContact(jsonArray[i][FULL_NAME],CONTACTS + contact_keys[i]);
    }
}

/**
 * Adds a single contact to the ui
 * @param text  html text of option item
 * @param value value att of option item
 */
function uiAddContact(text,value) {
    var slt_contact = document.getElementById("slt_contact");
    var option = new Option(text,value);
    slt_contact.options[slt_contact.options.length] = option;
}

/**
 * Removes current messages display and displays the new ones or sends request
 * @param convo_id
 */
function uiAddConversationMessages(convo_id) {
    var messagesArray = retrieveMessages(convo_id);
    console.log("Adding messages from [" + convo_id + "]");
    if (messagesArray !== null) {
        var rmArea = $('#rm_messageArea');
        rmArea.empty();
        var tempMessageIdArr = retrieveTempIdArr().slice();
        $.each(messagesArray, function (index, message) {
            uiAppendMessage(message[BODY],
                index,
                message[MESSAGE_TYPE]
            );

            //if same id then add temp_message right after
            var tempIdArr = retrieveTempIdArr();
            for (var i in tempIdArr) {
                var jsonTemp = JSON.parse(tempIdArr[i]);
                if (jsonTemp[TEMP_MESSAGE_ID] == index) {
                    uiAppendMessage(message[BODY],
                        jsonTemp[TEMP_MESSAGE_ID],
                        TYPE_LOCAL_SEND
                    );
                }
            }
        });
    } else {
        console.log("Null value for conversation.");
        return false;
    }
    return true;
}

function uiPrependMessage(convo_id,jsonMessageArr) {
    var messageArea = $('#rm_messageArea');
    var divScroll = retrieveScrollTop(convo_id);
    storeScrollTop(convo_id,"");
    if (divScroll == null || divScroll == "") {
        divScroll = $('#'+messageArea.children()[0].id);
    }
    $.each(jsonMessageArr, function (index, message) {
        $.each(message, function (index, messageInfo) {
            messageArea.prepend(createMessageDiv(messageInfo[BODY],
                index,
                messageInfo[MESSAGE_TYPE]
                ));
        });
    });
    var finalTop;
    if (divScroll instanceof jQuery) {
        var margin = parseInt(divScroll.css("margin-top"))*2;
        var offsetTop = parseInt(divScroll.offset()["top"]);
        finalTop = parseInt(offsetTop-margin);
    } else {
        finalTop = divScroll;
    }
    messageArea.scrollTop(finalTop);
}

/**
 * Appends messages to the message area
 * @param body
 * @param id
 * @param type
 */
function uiAppendMessage(body, id, type) {
    var messageRowDiv = createMessageDiv(body, id, type);
    $('#rm_messageArea').append(messageRowDiv);
}

/**
 * Creates and returns a message div
 * @param body
 * @param id
 * @param type
 * @returns {*|void}
 */
function createMessageDiv(body, id, type) {
    var messageRowDiv;
    var messageTextSpan;
    if (type == TYPE_INBOX) {
        messageTextSpan = $('<span>').html(body).css({
            "float": "left",
            "padding": "6px 12px",
            "background-color": MESSAGE_BACKGROUND_COLOR_RECEIVED,
            "border-radius": "20px",
            "max-width":"45%",
            "word-wrap":"break-word",
        });
        messageRowDiv = $('<div>').css({
            "margin": "4px 6px",
            "width":"100%",
            "float":"left",
        });
        messageRowDiv.attr("id",MESSAGES+id);
    } else if (type == TYPE_SENT) {
        messageTextSpan = $('<span>').html(body).css({
            "float": "right",
            "padding": "6px 12px",
            "background-color": MESSAGE_BACKGROUND_COLOR_ME_SENT,
            "border-radius": "20px",
            "max-width":"45%",
            "word-wrap":"break-word",
        });
        messageRowDiv = $('<div>').css({
            "margin": "4px 6px",
            "width":"100%",
            "float":"left",
        });
        messageRowDiv.attr("id",MESSAGES+id);
    } else if (type == TYPE_LOCAL_SEND) {
        messageTextSpan = $('<span>').html(body).css({
            "float": "right",
            "padding": "6px 12px",
            "background-color": MESSAGE_BACKGROUND_COLOR_WAITING,
            "border-radius": "20px",
            "max-width":"45%",
            "word-wrap":"break-word",
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
        });
        messageRowDiv = $('<div>').css({
            "margin":"4px 6px",
            "width":"100%",
            "float":"left",
        });
        messageRowDiv.attr("id",MESSAGES+id);
    }
    return messageRowDiv.append(messageTextSpan);
}

/**
 * Creates a Conversatin div
 * @param names {array} of names
 * @param id    id of conversation
 * @returns {*|jQuery}
 */
function createConversationDiv(names, id) {
    var convoRowDiv = $('<div>').css({
            "margin": "5px 5px 5px 5px",
            "border": "1px solid black",
            "background-color": CONVO_BACKGROUND_COLOR,
        });
    convoRowDiv.attr("id",CONVERSATIONS+id);
    var convoAmountSpan = $('<span>').html(names.length).css({
            "width": "100%",
            "display": "block",
        });
    convoRowDiv.append(convoAmountSpan);
    for (var n in names) {
        var convoNameSpan = $('<span>').html(names[n]).css({
                "display": "block",
            });
        convoRowDiv.append(convoNameSpan)
    }
    convoRowDiv.addClass(CONVO_CLASS);
    convoRowDiv.set
    return convoRowDiv;
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
        console.log("Updated message with id [" + id + "]");
    } else {
        console.log("Error updating color.");
    }
}

/**
 * Scrolls to location, if < 0 or null than scrolls to bottom
 * @param location
 * @return location used for chaining
 */
function uiScrollTop(location) {
    var rmArea = $('#rm_messageArea');
    if (location < 0 || location == null) {
        location = rmArea[0].scrollHeight;
    }
    rmArea.scrollTop(location);
    return location;
}

/**
 * Changes color of conversation to color of received message
 * @param convoId
 */
function uiConversationNewMesssage(convoId) {
    var convo = $('#' + CONVERSATIONS + convoId);
    convo.css('background-color', CONVO_MESSAGE_RECEIVED_COLOR);
    var convos = $('#slt_conversation');
    convos.prepend(convo);
}