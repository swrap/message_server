var DEFAULT_GET_MESSAGES = 15;

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

                var match =  (/(.*?)([0-9]+)/g).exec(selectedConvo.attr('id'));

                var id = match[2];
                if (id != convo_id_val) {
                    //reset the background color to white
                    $('#' + CONVERSATIONS + convo_id_val).css("background-color", CONVO_BACKGROUND_COLOR);
                    storeScrollTop(convo_id_val, getRMAdjustedScrollTop());
                }
                console.log(id + " " + selectedConvo.attr('id'));
                convo_id.attr("value",id);
                if (!uiAddConversationMessages(id)) {
                    //no messages found, sending request for more
                    webSocketCon.send(getMessagesJSON(id,DEFAULT_GET_MESSAGES,-1,0/*before*/));
                }
                setTimeout(function(){
                    uiScrollTop(retrieveScrollTop(id));
                }, 300);
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
        var contact = $('#' + CONTACTS + jsonArray[i][KEY]);
        //if does not exists create new field
        if (contact.length == 0) {
            contact = createContactDiv(i,
                jsonArray[i][KEY],
                getPhoneNumberFormat(jsonArray[i][PHONE_NUMBER])
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
    console.log("Adding messages from [" + convo_id + "]");
    if (messagesArray !== null) {
        var rmArea = $('#rm_messageArea');
        rmArea.empty();
        var tempMessageIdArr = retrieveMessageTempIdArr().slice();
        $.each(messagesArray, function (index, message) {
            uiAppendMessage(message, index);
            //if same id then add temp_message right after
            var tempIdArr = retrieveMessageTempIdArr();
            for (var i in tempIdArr) {
                var jsonTemp = JSON.parse(tempIdArr[i]);
                if (jsonTemp[TEMP_MESSAGE_ID] == index) {
                    uiAppendMessage(jsonTemp[TEMP_MESSAGE_ID], index);
                }
            }
        });
    } else {
        console.log("Null value for conversation.");
        return false;
    }
    return true;
}

/**
 * Prepends messages.
 * @param convo_id
 * @param jsonMessageArr
 */
function uiPrependMessage(convo_id,jsonMessageArr) {
    var messageArea = $('#rm_messageArea');
    // var divScroll = retrieveScrollTop(convo_id);
    // storeScrollTop(convo_id,"-1");
    // if (divScroll == null || divScroll == "") {
    //     divScroll = $('#'+messageArea.children()[0].id);
    // }
    $.each(jsonMessageArr, function (index, message) {
        $.each(message, function (index, messageInfo) {
            //check if message already exists
            if ($('#' + MESSAGES + index).length == 0 ) {
                messageArea.prepend(createMessageDiv(messageInfo, index));
            }
        });
    });
    // var finalTop;
    // if (divScroll instanceof jQuery) {
    //     var margin = parseInt(divScroll.css("margin-top"))*2;
    //     var offsetTop = parseInt(divScroll.offset()["top"]);
    //     finalTop = parseInt(offsetTop-margin);
    // } else {
    //     finalTop = divScroll;
    // }
    // messageArea.scrollTop(finalTop);
}

/**
 * Appends messages to the message area
 * @param body
 * @param id
 * @param type
 */
function uiAppendMessage(jsonObject, id) {
    var messageRowDiv = createMessageDiv(jsonObject, id);
    $('#rm_messageArea').append(messageRowDiv);
}

/**
 * Creates and returns a message div
 * @param body
 * @param id
 * @param type
 * @returns {*|void}
 */
function createMessageDiv(jsonObject, id) {
    var body, type, data = false, mms = (jsonObject[TYPE] == MMS);
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
    var messageDataSpan;
    if (type == TYPE_INBOX) {
        messageRowDiv = $('<div>').css({
            "margin": "4px 6px",
            "width":"100%",
            "float":"left",
        });
        if(data) {
            messageDataSpan = $('<span>').html("Click me to load image!")
                .addClass("data")
                .css({
                    "float": "left",
                    "display": "block",
                    "clear": "left",
                })
                .attr("id",DATA+id);
            messageDataSpan.on("click",function () {
                if(!retrieveDataLoad($(this).attr('id'))) {
                    var num = getNumbersFromString($(this).attr('id'));
                    webSocketCon.send(prepareGetData(num));
                    $(this).html("  Loading...");
                    $(this).prepend($('<span>').addClass("glyphicon glyphicon-refresh spinning"));
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
                "display":"block",
                "clear":"left",
            });
        }
        messageRowDiv.attr("id",MESSAGES+id);
    } else if (type == TYPE_SENT) {
        messageRowDiv = $('<div>').css({
            "margin": "4px 6px",
            "width": "100%",
            "float": "left", //todo tabindex for the right things
        });//todo xss protection
        if(data) {
            messageDataSpan = $('<span>').html("Click me to load image!")
                .addClass("data")
                .css({
                    "float": "right",
                    "display": "block",
                    "clear": "right",
                })
                .attr("id",DATA+id);
            messageDataSpan.on("click",function () {
                if(!retrieveDataLoad($(this).attr('id'))) {
                    var num = getNumbersFromString($(this).attr('id'));
                    webSocketCon.send(prepareGetData(num));
                    $(this).html("  Loading...");
                    $(this).prepend($('<span>').addClass("glyphicon glyphicon-refresh spinning"));
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
                "display":"block",
                "clear":"right",
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
            "color":MESSAGE_TEXT_COLOR,
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
            "color":MESSAGE_TEXT_COLOR,
        });
        messageRowDiv = $('<div>').css({
            "margin":"4px 6px",
            "width":"100%",
            "float":"left",
        });
        messageRowDiv.attr("id",MESSAGES+id);
    }

    messageRowDiv.append(messageTextSpan);
    if(messageDataSpan != null) {
        messageRowDiv.append(messageDataSpan);
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
function uiScrollTop(tag) {
    var rmArea = $('#rm_messageArea');
    if (tag == null || location < 0) {
        //if less < 0 or null than will choose newest element
        var children = rmArea.children();
        tag = $('#' + children[children.length-1].id).offset().top;
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
    var rmArea = $('#rm_messageArea');
    return rmArea.offset().top+rmArea.scrollTop();
}