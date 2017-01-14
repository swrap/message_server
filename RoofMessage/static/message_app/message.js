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

$('#lsb_searchBarContacts').on("input", function () {
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
    $("#new_message_textArea").val("");
    $("#lsb_newMessageBtn").show();
});

$("#new_message_sendBtn").on("click", function() {
    var text = $('#new_message_textArea').val();
    if (text.length > 0) {
        var numbersJson = [];
        var children = $('#lsb_searchContactName').children();
        for (var i = 0; i < children.length; i++) {
            var contactId = getNumbersFromString(children[i].id);
            var number = getNumbersFromString($("#" + CONTACTS + contactId).attr("data-original-title"));
            numbersJson.push({
                "number": number
            });
        }
        //TODO DOCUMENTATION
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
        console.log('shift+enter')
        return true;
    }
    if (e.keyCode == 13) {
        console.log('enter')
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
        CONNECTED_REPLY = "connected_reply",
        CONNECTED = "connected",
        DISCONNECTED = "disconnected",
        RECEIVED_MESSAGE = "received_message",
        POST_DATA = "post_data";
var DATA = "data";
var END = "end";

var android_connected = false;
var sent_connected = false;

var active_json;
var conversations;
var contacts;

var DEFAULT_TITLE = "RoofText";
var MESSAGE_TITLE = "RoofText";
var titleInterval;

var webOnMessage = function(e) {
    active_json = JSON.parse(e.data);
    console.log(active_json[ACTION]);
    switch (active_json[ACTION]) {
        case POST_CONTACTS:
                //contacts received, populate contacts section
                storeContacts(active_json);
                uiAddAllContacts();
                console.log("Added contacts.");
            break;
        case POST_CONVERSATIONS:
                //conversations received, populate conversations section
                storeConversations(active_json);
                uiAddAllConversations();
                console.log("Added conversations.");
            break;
        case POST_MESSAGES:
                console.log(active_json[THREAD_ID]);
                //messages received, populate conversations section
                storeMessages(active_json);
                var jsonConvoId = active_json[THREAD_ID];

                //tells whether or not to load more
                if (active_json[END] == "t") {
                    storeLoadMore(jsonConvoId, "t");
                } else {
                    storeLoadMore(jsonConvoId, "f");
                }
                storeLoadingMoreMessages(active_json[THREAD_ID],"f");

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

                    //update load more if convo_id matches
                    uiUpdateLoadMoreBar(convoIdVal);

                    //hide glyph for loading
                    uiShowHideLoadingMessages(false);
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
                if (android_connected == false && sent_connected == true) {
                    sendConnected();
                    sent_connected = true;
                    android_connected = true;
                }
            break;
        case CONNECTED_REPLY:
                android_connected = true;
                console.log("Is android connected [" + android_connected + "]");
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
                sent_connected = false;
                console.log("Is android connected [" + android_connected + "]");
                $('#connect_waiting').modal('show').focus();
                //TODO fix backend to not send disconnect on wifi reconnect disconnect
                sendConnected();
                sent_connected = true;
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
                console.log("POST DATA! [" + active_json['id'] + "]");

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

                    if(active_json[END] == "t"){
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
    sent_connected = true;
};

var webOnErrorClose = function(){
        android_connected = false;
        $('#connect_waiting').modal({
            backdrop: 'static',
            show:true,
            keyboard: false
        });
        setTimeout(function(){
            console.log("Starting loop");
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
        console.log("Temp id message [" + temp_id + "]");
        var body = rm_message_input.text();
        var messageObjectString = prepareMessages(body, "", getNumbers(convo_id_val), temp_id);
        rm_message_input.html("");
        console.log(messageObjectString);
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

$('#rt_loadBtn').on("click", function () {
    var convoIdVal = $('#convo_id').val();
    if (convoIdVal !== null && convoIdVal) {
        var ret = retrieveLoadingMoreMessages(convoIdVal);
        if ($('#rt_loadBtn > span').text() == LOAD_BTN_LOAD_MORE &&  ret != "t") {
            var rmArea = $('#rt_messageArea');
            var key = Object.keys(retrieveMessages(convoIdVal)[0]);
            var offset = retrieveMessages(convoIdVal)[0][key][DATE_RECIEVED];
            webSocketCon.send(getMessagesJSON(convoIdVal,DEFAULT_GET_MESSAGES,offset,0/*before*/));
            storeLoadingMoreMessages(convoIdVal, "t");
            uiShowHideLoadingMessages(true);
        }
    }
});

window.onload = function () {
    $('#slt_contact').hide();

    $('#connect_waiting').modal({
        backdrop: 'static',
        show:true,
        keyboard: false
    });

    $('#lsb_conversationsTab').click();
};

function sendConnected() {
    webSocketCon.send(JSON.stringify( {
        "action" : CONNECTED
    }));
    console.log("Sending Connected");
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
    console.log("In focus.");
});

$(window).blur(function() {
    inFocus = 0;
    console.log("Out of focus.");
});

$('#lsb_newMessageBtn').on('click', function () {
    $(this).hide();
    $('#new_message_container').show()
});