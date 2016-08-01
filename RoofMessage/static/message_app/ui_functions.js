
/**
 * Adds all contacts in the conversations_key_array to the ui display = none
 */
function uiAddAllConversations() {
    $("slt_conversation").empty();
    var jsonArray = retrieveConversations();
    var keys = Object.keys(jsonArray);
    $.each(jsonArray, function (index, value) {
        var key = Object.keys(value)[0];
        var recip = value[key][RECIPIENTS];
        var text = recip.length;
        for (var r in recip) {
            if (recip[r][FULL_NAME] != null) {
                text += " [" + recip[r][FULL_NAME] + "]";
            } else {
                text += " [" + recip[r][PHONE_NUMBER] + "]";
            }
        }
        uiAddConversation(text,key);
    });
}

/**
 * Adds a single conversation to the ui
 * @param text  html text of option item
 * @param value value att of option item
 */
function uiAddConversation(text,value) {
    var slt_conversation = document.getElementById("slt_conversation");

    var option = new Option(text,value);
    slt_conversation.options[slt_conversation.options.length] = option;
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

var DEFAULT_GET_MESSAGES = 15;

var BODY = "body";
var MESSAGE_TYPE = "message_type";
var THREAD_ID = "thread_id";
var ID = "ID";
var TYPE_INBOX = 1;
var TYPE_SENT = 2;

var TYPE_LOCAL_SEND = 20; //waiting to see if successfully sent

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

var BACKGROUND_COLOR_ME_SENT = "#ffff00";
var BACKGROUND_COLOR_RECEIVED = "#CDF0FF";
var BACKGROUND_COLOR_WAITING = "#7C26CB";

function uiPrependMessage(convo_id,jsonMessageArr) {
    var messageArea = $('#rm_messageArea');
    var divScroll = $('#'+messageArea.children()[0].id);
    $.each(jsonMessageArr, function (index, message) {
        $.each(message, function (index, messageInfo) {
            messageArea.prepend(createMessageDiv(messageInfo[BODY],
                index,
                messageInfo[MESSAGE_TYPE]
                ));
        });
    });
    var margin = parseInt(divScroll.css("margin-top"))*2;
    var offsetTop = parseInt(divScroll.offset()["top"]);
    var special = parseInt(offsetTop-margin);
    messageArea.scrollTop(special);
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
            "background-color": BACKGROUND_COLOR_RECEIVED,
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
            "background-color": BACKGROUND_COLOR_ME_SENT,
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
            "background-color": BACKGROUND_COLOR_WAITING,
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
 * Changes the color of message div when it is sent by device
 * @param temp_id
 * @param id
 */
function uiUpdateMessage(temp_id, id) {
    var messageDiv = $('#' + TEMP_MESSAGE_ID + temp_id);
    if (messageDiv != null) {
        messageDiv.children("span").css("background-color",
            BACKGROUND_COLOR_ME_SENT);
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