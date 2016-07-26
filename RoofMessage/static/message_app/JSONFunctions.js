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
 * The thread_id = conversation_id to query the messages for
 * @param thread_id
 */
function getMessages(thread_id, amount, offset) {
    var json = {
        "action" : "get_messages",
        "thread_id" : thread_id,
        "amount" : amount,
        "offset" : offset
    };
    return JSON.stringify(json);
}

/**
 * 
 * @param body              The text message that will be sent.
 * @param data              NOT USED (but will be image data/etc)  
 * @param numbers           Array of numbers (only one number implemented on backend)
 * @param temp_message_id   The temporary id of the message before getting actual id
 */
function sendMessages(body, data, numbers, temp_message_id) {
    var json = {
        "action" : "send_messages",
        "body" : body,
        "data" : data,
        "temp_message_id" : temp_message_id,
        "numbers" : []
    };
    for (var i in numbers) {
        var number = numbers[i];
        json.numbers.push({
            "number" : number
        })
    }
    return JSON.stringify(json);
}