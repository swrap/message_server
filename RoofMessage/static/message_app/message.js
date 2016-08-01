// //makes it so ready function is fired on back button
// history.navigationMode = 'compatible';
//
// $(document).ready(function() {
//     //in event that back button is hit reload data
//     //get the selection list
//     var selected_list = $('#scroll_data');
//     //clear the selection list
//     selected_list.empty()
// });
//
// $(".tab_menus").change(function() {
//
//     //get the selection list
//     var selected_list = $('#scroll_data');
//     //clear the selection list
//     selected_list.empty()
//
//     if($( "#list_selected option:selected" ).text() == "Contacts") {
//
//         $("#all_or_none").show()
//
//         if($( "#all_or_none option:selected" ).text() == "My Contacts")
//         {
//             //make the query for the data
//             jQuery.ajax({
//                 url: '{% url 'MessageApp:user_contacts' %}',
//                 type: 'POST',
//                 dataType: 'json',
//                 success: function (data) {
//                     //success iterate throuh the data and put into the contacts
//                     $.each(data, function(i, item){
//                         console.log("HERE");
//                         selected_list.append($("<option></option>").val(this).html(item.username));
//                     });
//                     },
//                 failure: function (data) {
//                     selected_list.append($("<option></option>").val(this).html("Unable to load"));
//                 }
//             });
//         }
//         else
//         {
//             //make the query for the data
//             jQuery.ajax({
//                 url: '{% url 'MessageApp:all_contacts' %}',
//                 type: 'POST',
//                 dataType: 'json',
//                 success: function (data) {
//                     //success iterate throuh the data and put into the contacts
//                     $.each(data, function(i, item){
//                         console.log("no here");
//                         selected_list.append($("<option></option>").val(this).html(item.username));
//                     });
//                     },
//                 failure: function (data) {
//                     selected_list.append($("<option></option>").val(this).html("Unable to load"));
//                 }
//             });
//         }
//     }
//     else{
//         $("#all_or_none").hide()
//     }
//   });
// //can get rid of this. It was simply to test if I could add to the messages
// //its a nice helper function tho
// add_to_message("message_ul", "right", "yo");
// add_to_message("message_ul", "left", "no");
// function add_to_message (message_ul_id, align_side, message_text) {
//     var mess_ul = document.getElementById(message_ul_id);
//     var new_li = document.createElement("li");
//     new_li.setAttribute("align",align_side)
//     new_li.appendChild(document.createTextNode(message_text));
//     mess_ul.appendChild(new_li);
// }
//
// /*CONVERSATION Testing functions
// var user_ids = [];
// user_ids.push(1);
// user_ids.push(2);
// create_conversation(user_ids,null);
// create_conversation(user_ids,"name");
// create_conversation(user_ids,12);
// get_conversations(17)
// */
//
//
// /**
//  * Used for creating conversations
//  *
//  * @param user_id   int []      user ids for the newely created conversation
//  * @param title     string      title for conversation or null will provide default title
//  *
//  * @return conversation object, NOT_MESSAGES
//  */
// function create_conversation(user_ids, title) {
//     var jsonObj = {'csrfmiddlewaretoken': $('input[name="csrfmiddlewaretoken"]').val()};
//     jsonObj.user_ids = user_ids;
//     jsonObj.title = title;
//     console.log(jsonObj);
//     $.ajax({
//         url: '{% url 'MessageApp:create_conversation' %}',
//         type: 'POST',
//         dataType: 'json',
//         traditional: true,
//         data: jsonObj,
//         success: function (data) {
//             console.log(data);
//             return data;
//         },
//         error: function (data) {
//             console.log(data);
//             return data;
//         },
//     });
// }
//
// /**
//  * Used for getting conversations
//  *
//  * @param conversation_id   int     id of conversation, enter null for all conversation for users. Enter int to
//  * receive a specific conversation.
//  *
//  * @return conversation object, NOT_MESSAGES
//  */
// function get_conversations (conversation_id) {
//     var jsonObj = {'csrfmiddlewaretoken': $('input[name="csrfmiddlewaretoken"]').val()};
//     jsonObj.conversation_id = conversation_id;
//     console.log(jsonObj);
//     $.ajax({
//         url: '{% url 'MessageApp:get_conversations' %}',
//         type: 'POST',
//         dataType: 'json',
//         traditional: true,
//         data: jsonObj,
//         success: function (data) {
//             console.log(data);
//             return data;
//         },
//         error: function (data) {
//             console.log(data);
//             return data;
//         },
//     });
// }
//
// /*
// MESSAGE Testing functions
// create_message(21, "Hello!");
// create_message(21, "How are you?");
// create_message(21, "I am well and you?");
// create_message("a", "SHOULD NOT RECEIVE TEXT");
// create_message(16, 1);
// create_message(23, 1);
// get_messages(23,null);
// get_messages(21,null);
// get_messages(21,1);*/
//
// /**
//  * Used for getting messages for a conversation. Returns message objects.
//  *
//  * @param conversation_id   int     id of conversation
//  * @param text              string  text for message
//  *
//  * @return newely created message for related conversation id
//  */
// function create_message(conversation_id,text) {
//     var jsonObj = {'csrfmiddlewaretoken': $('input[name="csrfmiddlewaretoken"]').val()};
//     jsonObj.conversation_id = conversation_id;
//     jsonObj.text = text;
//     console.log(jsonObj);
//     $.ajax({
//         url: '{% url 'MessageApp:create_message' %}',
//         type: 'POST',
//         dataType: 'json',
//         traditional: true,
//         data: jsonObj,
//         success: function (data) {
//             console.log(data);
//             return data;
//         },
//         error: function (data) {
//             console.log(data);
//             return data;
//         },
//     });
// }
//
// /**
//  * Used for getting messages for a conversation. Returns message objects.
//  * ***NOTE: Start at highest id/pk(AKA the newest) when returning objects.***
//  *
//  * @param conversation_id   int     id of conversation
//  * @param offset            int     message offset to return from
//  *
//  * @return messages for related conversation id
//  */
// function get_messages(conversation_id, offset){
//     var jsonObj = {'csrfmiddlewaretoken': $('input[name="csrfmiddlewaretoken"]').val()};
//     jsonObj.conversation_id = conversation_id;
//     jsonObj.offset = offset;
//     console.log(jsonObj);
//     $.ajax({
//         url: '{% url 'MessageApp:get_messages' %}',
//         type: 'POST',
//         dataType: 'json',
//         traditional: true,
//         data: jsonObj,
//         success: function (data) {
//             console.log(data);
//             return data;
//         },
//         error: function (data) {
//             console.log(data);
//             return data;
//         },
//     });
// }