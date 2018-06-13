const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
/**
 * VARIABLES GLOBALES DE LIBRERIAS
 */
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const sanitizer = require('./filtrosCentro');
const metodos = require('./metodos');

/**
 * VARIABLES GLOBALES DE COLECCIONES FIREBASE
 */
const centroDeportivo = db.collection('centro_deportivo').limit(25);
const distancia = 4;
const paginate_limit= 25


exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest((req, res) => {
    // Grab the text parameter.
    const original = req.query.text;
    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    return admin.database().ref('/messages').push({ original: original }).then((snapshot) => {
        // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
        return res.redirect(303, snapshot.ref.toString());
    });
});

exports.makeUppercase = functions.database.ref('/messages/{pushId}/original')
    .onCreate((snapshot, context) => {
        // Grab the current value of what was written to the Realtime Database.
        const original = snapshot.val();
        console.log('Uppercasing', context.params.pushId, original);
        const uppercase = original.toUpperCase();
        // You must return a Promise when performing asynchronous tasks inside a Functions such as
        // writing to the Firebase Realtime Database.
        // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
        return snapshot.ref.parent.child('uppercase').set(uppercase);
    });

/** ACTIVADORES PARA FIRESTORE */
exports.createUser = functions.firestore
    .document('messages/{userId}')
    .onCreate((snap, context) => {
        // Get an object representing the document
        // e.g. {'name': 'Marie', 'age': 66}
        const newValue = snap.data();

        // access a particular field as you would any JS property
        const name = newValue.name;

        // perform desired operations ...
        console.log('SE HA ACTIVADO ACTIVADOR')
        console.log(snap.data())
        return 0
    });

exports.helloError = functions.https.onRequest((request, response) => {
    // This will be reported to Stackdriver Error Reporting
    throw new Error('epic fail');
    });

exports.cloudFunctionExternal = functions.https.onCall((data, context) => {
    // [START_EXCLUDE]
    // [START readMessageData]
    // Message text passed from the client.
    const text = data.text;
    console.log(data)
    // [END readMessageData]
    // [START messageHttpsErrors]
    // Checking attribute.
    if (!(typeof text === 'string') || text.length === 0) {
        // Throwing an HttpsError so that the client gets the error details.
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
            'one arguments "text" containing the message text to add.');
    }
    // Checking that the user is authenticated.
    /**
    if (!context.auth) {
        // Throwing an HttpsError so that the client gets the error details.
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called ' +
            'while authenticated.');
    }
     */
    // [START returnMessageAsync]
    // Saving the new message to the Realtime Database.
    //const sanitizedMessage = sanitizer.sanitizeText(text); // Sanitize the message.
    return admin.database().ref('/messages').push({
        text: text,
        //author: { uid, name, picture, email },
    }).then(() => {
        console.log('New Message written');
        // Returning the sanitized message to the client.
        return { text: text };
    })
    // [END returnMessageAsync]
    .catch((error) => {
        // Re-throwing the error as an HttpsError so that the client gets the error details.
        throw new functions.https.HttpsError('unknown', error.message, error);
    });
  // [END_EXCLUDE]
});


exports.CFListaAbiertos = functions.https.onCall((data, context) => {
    var text = sanitizer.listarAbiertos(data,context,admin)
    console.log(text)  
    return text;  
});

/** 
 * METODO: CFFiltroCercanos
 * Filtro para ubicar a centros deportivos mas cercanos 
 * */
exports.CFFiltroCercanos = functions.https.onCall((data,context)=> {        
    datosCliente = {
        latitude : data.latitude,
        longitude: data.longitude
    }    
    return centroDeportivo.limit(paginate_limit).get().
    then((querySnapshot) => {
        var datos = [];
        querySnapshot.forEach((doc) => {
            if (metodos.distancia_entre_puntos(datosCliente,doc.data().direccion.ubicacion) <=distancia){
                datos.push(metodos.formatoJsonCentroDepotivo(doc.id,doc.data(),datosCliente))
            }            
        });          
        return { datos: datos };
    }).catch((error) => {        
        throw new functions.https.HttpsError('unknown', error.message, error);
    });    
});

/**
 * METODO CFFiltroCercanos
 * Filtro para ordenar centros por puntuaciones de mayor a menor
 */
exports.CFFiltroPuntuacion = functions.https.onCall((data,context)=> {            
    datosCliente = {
        latitude : data.latitude,
        longitude: data.longitude
    }            
    return centroDeportivo.orderBy("likes", "desc").limit(paginate_limit).get().
    then((querySnapshot) => {
        var datos = [];                
        querySnapshot.forEach((doc) => {            
            datos.push(metodos.formatoJsonCentroDepotivo(doc.id,doc.data(),datosCliente))
        });                
        return { datos: datos };
    }).catch((error) => {        
        throw new functions.https.HttpsError('unknown', error.message, error);
    });    
});

/**
 * METODO CFAbiertoCerrado
 * Filtro para centros deportivos abiertos y cerrados
 */
exports.CFAbiertoCerrado = functions.https.onCall((data,context)=> {            
    datosCliente = {
        latitude : data.latitude,
        longitude: data.longitude
    }    
    return centroDeportivo.limit(paginate_limit).get().
    then((querySnapshot) => {
        var datos = [];        
        querySnapshot.forEach((doc) => {
            datos.push(doc.data())            
        });                
        return { datos: datos };
    }).catch((error) => {        
        throw new functions.https.HttpsError('unknown', error.message, error);
    });    
});

/**
 * METODO FiltrosCentrosDeportivos
 * Filtro para centros deportivos abiertos y cerrados
 */
exports.FiltrosCentrosDeportivos = functions.https.onCall((data, context)=>{
    claves = {
        cercanos : data.cercanos,
        puntuacions: data.puntuacions,
        abiertos: data.abiertos
    }    
    
})