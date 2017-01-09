var DEFAULT_GET_MESSAGES = 15;
//set to 100 because we want all the way to start
var DEFAULT_GET_MESSAGES_AFTER = 1000;

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

var LOAD_BTN_LOAD_MORE = "Load More Messages";
var LOAD_BTN_NO_MORE = "No More to Messages to Load";

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
        var names = [];
        var numbers = [];
        for (var r in recip) {
            if (recip[r][FULL_NAME] != null) {
                // text += " [" + recip[r][FULL_NAME] + "]";
                names.push(recip[r][FULL_NAME]);
                numbers.push(getPhoneNumberFormat(recip[r][PHONE_NUMBER]));
            } else {
                names.push("");
                numbers.push(getPhoneNumberFormat(recip[r][PHONE_NUMBER]));
            }
        }
        var convoIdDiv = $('#' + CONVERSATIONS + key);
        //if exists create and add div
        if (convoIdDiv.length == 0) {
            var createdConvo = createConversationDiv(names, numbers, key, value[key][MESSAGE_COUNT]);

            //set color selected back to the correct selected color
            var convoIdVal = $('#convo_id').val();
            if (convoIdVal == key) {
                createdConvo.css("background-color", CONVO_BACKGROUND_COLOR_SELECTED);
            }

            createdConvo.on("click",function () {
                var convo_id = $('#convo_id');
                var convo_id_val = convo_id.val();

                var selectedConvo = $(this);
                var selectedId = getNumbersFromString(selectedConvo.attr('id'));

                //selected id does not equal convo id currently on
                if(selectedId != convo_id_val) {
                    if (selectedId != convo_id_val) {
                        //reset the background color to white
                        $('#' + CONVERSATIONS + convo_id_val).css("background-color", "");
                        storeScrollTop(convo_id_val, getRMAdjustedScrollTop());
                    }

                    console.log(selectedId + " " + selectedConvo.attr('id'));
                    convo_id.attr("value",selectedId);

                    if (!uiAddConversationMessages(selectedId)) {
                        //no messages found, sending request for more
                        webSocketCon.send(getMessagesJSON(selectedId,DEFAULT_GET_MESSAGES,-1,0/*before*/));
                    }
                    setTimeout(function() {
                        uiScrollTop(retrieveScrollTop(selectedId));
                    }, 300);
                    //convo messages were found hide current convo messages
                    $('#' + CONVO + convo_id_val).hide();
                }
                selectedConvo.css("background-color",CONVO_BACKGROUND_COLOR_SELECTED);

                //handle load more bar
                uiUpdateLoadMoreBar(selectedId);
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
    console.log("Adding messages from [" + convo_id + "]");
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
        console.log("Null value for conversation.");
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
            "float":"left",
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
                        var id = getNumbersFromString($(this).attr('id'));
                        var content_type = $(this).attr('val');
                        var messageId = getNumbersFromString($(this).parent().parent().attr('id'));
                        webSocketCon.send(prepareGetData(id,content_type,messageId));
                        $(this).html("  Loading...");
                        $(this).prepend($('<span>').addClass("glyphicon glyphicon-refresh spinning"));
                        $(this).attr('id', DATALOAD + id);
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
            "float": "right", //todo tabindex for the right things
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
                        var id = getNumbersFromString($(this).attr('id'));
                        var content_type = $(this).attr('val');
                        var messageId = getNumbersFromString($(this).parent().parent().attr('id'));
                        webSocketCon.send(prepareGetData(id,content_type,messageId));
                        $(this).html("  Loading...");
                        $(this).prepend($('<span>').addClass("glyphicon glyphicon-refresh spinning"));
                        $(this).attr('id', DATALOAD + id);
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
function createConversationDiv(names, numbers, id, message_count) {
    var numberString = "";
    for (var n in names) {
        numberString += (numbers[n]);
        if (n != numbers.length) {
             numberString += "<br>";
        }
    }

    var nameString = "";
    var notEmpty = false;
    for (n in names) {
        nameString += (names[n]);
        if (names[n] != "" && !notEmpty) {
            notEmpty = true;
        }
        if (n != names.length) {
             nameString += "<br>";
        }
    }
    if (!notEmpty) {
        nameString = numberString;
    }

    var convoRowDiv = $('<div>').attr({
            "class": "list-group-item list-group-item-action",
            "id":CONVERSATIONS+id,
            "data-toggle": "tooltip",
            "data-placement": "right",
            "data-html": true,
            "title": numberString,
        }).css({
        "width": "100%",
        // "height": "100%",
        "text-overflow": "ellipsis",
        "text-align": "left",
    });

    var convoNameSpan = $('<span>').html(nameString).css({
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
        if (address.indexOf(value[PHONE_NUMBER]) >= 0) {
            return value[FULL_NAME];
        }
    }
    return "UNKNOWN";
}

/**
 * Load more updates the load more to display load more based off of given id
 */
function uiUpdateLoadMoreBar(id) {
    var loadMore = retrieveLoadMore(id);
    if (loadMore == null || (loadMore != null && loadMore == "f")) {
        //if load more is not null or it is false than assume t and display new text
        $('#rt_loadBtn').html(LOAD_BTN_LOAD_MORE)
            .removeClass("loadBtnNM")
            .addClass("loadBtnLM");
    } else {
        $('#rt_loadBtn').html(LOAD_BTN_NO_MORE)
            .removeClass("loadBtnLM")
            .addClass("loadBtnNM");
    }
}