$("#lsb_contactsTab").on("click",function(){$("#lsb_contactsTab").css({"background-color":"white","border-top":"solid black 1px","border-bottom":"solid transparent 1px"});$("#lsb_conversationsTab").css({"background-color":"#C77FFF","border-top":"solid black 1px","border-bottom":"solid black 1px"});$("#slt_contact").show();$("#slt_conversation").hide()});$("#lsb_conversationsTab").on("click",function(){$("#lsb_conversationsTab").css({"background-color":"white","border-top":"solid black 1px","border-bottom":"solid transparent 1px"});$("#lsb_contactsTab").css({"background-color":"#C77FFF","border-top":"solid black 1px","border-bottom":"solid black 1px"});$("#slt_conversation").show();$("#slt_contact").hide()});$("#lsb_searchBar").on("input",function(){$("#lsb_contactsTab").click();var a=$(this).first().val();if(a.length>0){var b=$("#slt_contact").children();$.each(b,function(c,e){var d=$(e);if(d.text().toUpperCase().indexOf(String(a).toUpperCase())>-1){d.show()}else{d.hide()}})}else{$("#slt_contact").children().show()}});$("#new_message_cancelBtn").on("click",function(){$("#new_message_container").hide();$("#slt_contact").children().removeClass(CLASS_SELECTED_CONTACT);$("#recipientList").empty();$("#new_message_textArea").val("")});$("#new_message_sendBtn").on("click",function(){var d=$("#recipientList").children();var g=$("#new_message_textArea").val();if(g.length>0&&d.length>0){var e=[];for(var c=0;c<d.length;c++){var a=retrieveContact(getNumbersFromString(d[c].id));var f=getNumbersFromString(a[PHONE_NUMBER]);e.push({number:f})}temp_convo_id_count++;storeConvoTempId(temp_convo_id_count);uiSendingNewMessage(true);var b=prepareMessages(g,"",e,temp_convo_id_count);webSocketCon.send(b)}});var messageInput=$("#rm_messageInput");messageInput.keydown(function(a){if(a.keyCode==16&&a.keyCode==13){console.log("shift+enter");return true}if(a.keyCode==13){console.log("enter");$("#rm_sendBtn").click();return false}});messageInput.bind("DOMSubtreeModified",function(){$("#rm_charCount").html(getNumberCommaFormatted($(this).text().length))});var sent_message_temp_id=[];const ACTION="action",POST_CONTACTS="post_contacts",POST_CONVERSATIONS="post_conversations",POST_MESSAGES="post_messages",SENT_MESSAGES="sent_messages",SENT_MESSAGES_FAILED="sent_messages_failed",CONNECTED="connected",DISCONNECTED="disconnected",RECEIVED_MESSAGE="received_message",POST_DATA="post_data";var DATA="data";var android_connected=true;var active_json;var conversations;var contacts;var initial_connect_conversations=true;var DEFAULT_TITLE="RoofText";var MESSAGE_TITLE="RoofText";var titleInterval;var webOnMessage=function(r){active_json=JSON.parse(r.data);console.log(active_json[ACTION]);switch(active_json[ACTION]){case POST_CONTACTS:storeContacts(active_json);uiAddAllContacts();console.log("Added contacts.");break;case POST_CONVERSATIONS:storeConversations(active_json);uiAddAllConversations();if(initial_connect_conversations){var n=retrieveConversations();var h=0;for(var q in n){var u=Object.keys(n[q])[0];console.log("Sending for messages ["+u+"]");var g=retrieveMessages(u);if(g==null){webSocketCon.send(getMessagesJSON(u,DEFAULT_GET_MESSAGES,-1,0))}else{webSocketCon.send(getMessagesJSON(u,DEFAULT_GET_MESSAGES_AFTER,g[0][Object.keys(g[0])][DATE_RECIEVED],1))}if(h>10){break}h++}initial_connect_conversations=false}console.log("Added conversations.");break;case POST_MESSAGES:console.log(active_json[THREAD_ID]);storeMessages(active_json);var d=active_json[THREAD_ID];var m=$("#convo_id").val();if(d==m){var k=convoDivExists(m);if(k==null){uiAddConversationMessages(m)}else{uiPrependMessage(d,active_json[d],m)}}if($("#"+CONVERSATIONS+d).length==0){webSocketCon.send(getConversations())}break;case SENT_MESSAGES:var f=retrieveConvoTempIdArr();for(var q in f){if(f[q]==active_json[TEMP_MESSAGE_ID]){f.splice(q,1);if(retrieveConversation(active_json[THREAD_ID])==null){webSocketCon.send(getConversations());webSocketCon.send(getMessagesJSON(active_json[THREAD_ID],DEFAULT_GET_MESSAGES,-1,1))}else{$("#slt_conversation").prepend($("#"+CONVERSATIONS+active_json[THREAD_ID]))}uiSendingNewMessage(false)}}f=retrieveMessageTempIdArr();for(var q in f){var c=JSON.parse(f[q]);if(c[TEMP_MESSAGE_ID]==active_json[TEMP_MESSAGE_ID]){uiUpdateMessage(active_json[TEMP_MESSAGE_ID],active_json[MESSAGE_ID]);f.splice(q,1)}}storeMessages(active_json);break;case SENT_MESSAGES_FAILED:break;case CONNECTED:android_connected=true;console.log("Is android connected ["+android_connected+"]");startUpCalls();$("#loading_label").css("background-color","#52CC82");$("#loading_text").html("Loading Content..");setTimeout(function(){$("#connect_waiting").modal("hide");$("#loading_label").css("background-color","#C77FFF");$("#loading_text").html("Waiting to connect...")},1500);break;case DISCONNECTED:android_connected=false;console.log("Is android connected ["+android_connected+"]");$("#connect_waiting").modal("show").focus();sendConnected();break;case RECEIVED_MESSAGE:var t=active_json;var b=$("#convo_id").val();var d=active_json[THREAD_ID];var k=convoDivExists(d);if(k!=null&&b==d){var j=active_json[d];for(var q in j){var u=Object.keys(j[q])[0];uiAppendMessage(j[q][u],u,k,b)}storeScrollTop(d,-1)}storeMessages(active_json);uiConversationNewMesssage(d);if(!retrieveConversation(b)){webSocketCon.send(getConversations())}if(!inFocus){MESSAGE_TITLE="You have a message.";if(titleInterval==null){titleInterval=setInterval(function(){var e=document.title;document.title=(e==DEFAULT_TITLE?MESSAGE_TITLE:DEFAULT_TITLE)},750)}}break;case POST_DATA:console.log("POST DATA! ["+active_json.id+"]");var o="fail";if(active_json[o]){$("#"+DATA+active_json[PART_ID]).removeClass().off("click").addClass("data_fail").html("Error loading. Currently only support images data.")}else{var a="image";var v=$("#"+DATA+active_json[PART_ID]+a);var s=$("#"+DATALOAD+active_json[PART_ID]);if(v.length==0){var l=$("<a>").attr("href","#").attr("class","imageTop");v=$('<img id="'+DATA+active_json[PART_ID]+a+'">').attr("src","data:image/png;base64,").css("clear","left").hide().addClass("img_area").css("float",$("#"+DATA+active_json[MESSAGE_ID]).css("float")).css("clear",$("#"+DATA+active_json[MESSAGE_ID]).css("clear"));l.append(v);l.insertAfter(s)}v.attr("src",v.attr("src")+active_json[DATA]);var p="finish";if(active_json[p]){v.show();s.remove()}}break}};var webOnOpen=function(){sendConnected()};var webOnErrorClose=function(){$("#connect_waiting").modal({backdrop:"static",show:true});setTimeout(function(){console.log("Starting loop");webSocketCon=start(URL)},7500)};var webSocketCon=start();function start(){ws=new WebSocket(URL);ws.onopen=webOnOpen;ws.onmessage=webOnMessage;ws.onclose=webOnErrorClose;return ws}$("#rm_sendBtn").click(function(){var h=$("#rm_messageInput");var c=$("#convo_id").val();if(h.html().length>0&&c!=""){var f=$("#rm_messageArea");var b=getNumbersFromString(f.children().last().attr("id"));console.log("Temp id message ["+b+"]");var a=h.text();var d=prepareMessages(a,"",getNumbers(c),b);h.html("");console.log(d);webSocketCon.send(d);var e=JSON.parse(d);e[MESSAGE_TYPE]=TYPE_LOCAL_SEND;var g=$("#"+CONVO+c);uiAppendMessage(e,b,g,c);$("#slt_conversation").prepend($("#"+CONVERSATIONS+c).css("background-color",CONVO_BACKGROUND_COLOR_SELECTED));storeMessageTempIdArr(b,c,a);storeScrollTop(c,uiScrollTop(-1))}});$(document).on("click","a.imageTop",function(){$("#imageModalIMG").attr("src",$(this).find("img").attr("src"));$("#imageModal").modal("show")});$("#rm_messageArea").on("scroll",function(){if($(this).offset().top==0){var b=$("#convo_id").val();var a=retrieveMessages(b)[0];var c=a[Objects.key(a)[0]][DATE_RECIEVED];webSocketCon.send(getMessagesJSON(b,DEFAULT_GET_MESSAGES,c,0))}});var loadWait=true,loadWaitTime=1000;$("#rm_loadBtn").on("click",function(){if(loadWait){var a=$("#convo_id").val();if(a!==null&&a){var c=$("#rm_messageArea");var b=Object.keys(retrieveMessages(a)[0]);var d=retrieveMessages(a)[0][b][DATE_RECIEVED];webSocketCon.send(getMessagesJSON(a,DEFAULT_GET_MESSAGES,d,0))}loadWait=false;setTimeout(function(){loadWait=true},loadWaitTime)}});window.onload=function(){$("#slt_contact").hide();$("#connect_waiting").modal({backdrop:"static",show:true});$("#lsb_conversationsTab").click()};function startUpCalls(){console.log(ACTION);webSocketCon.send(getContacts());webSocketCon.send(getConversations());console.log("Sent for all")}function sendConnected(){webSocketCon.send(JSON.stringify({action:CONNECTED}));console.log("Connected")}var inFocus=1;$(window).focus(function(){inFocus=1;if(titleInterval!=null){clearInterval(titleInterval);titleInterval=null}document.title=DEFAULT_TITLE;console.log("In focus.")});$(window).blur(function(){inFocus=0;console.log("Out of focus.")});