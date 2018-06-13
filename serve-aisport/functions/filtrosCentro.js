

exports.listarAbiertos = function(data,context,admin){
    const text = data.text;
    admin.database().ref('/messages').push({
        text: text,        
    }).then(() => {
        console.log('New Message written');
        console.log(text)        
        return { text: text };
    }).catch((error) => {        
        throw new functions.https.HttpsError('unknown', error.message, error);
    });
    return { text: text };
}