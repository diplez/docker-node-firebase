import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as moment from 'moment';

const firebase = admin.initializeApp();


const gcs = require('@google-cloud/storage')();
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

const firestore = admin.firestore()

const PATH_SPORT_CENTER="centro_deportivo"
const PATH_TABLE_TIME="horario"
const tamanioMin = 600000;     //EQUIVALENTE A 600.00 kb
const tamanioMax = 6000000;    //EQUIVALENTE A 6.00 MG


export const buscar_centro_deportivo_por_nombre = functions.https.onCall((data, context) => {
    //console.log("que mas v" + data.query);
    return firestore.collection(PATH_SPORT_CENTER).get().then(value => {
        const array = [];
        value.docs.forEach(it => {
            const nombre = it.data().nombre.toLowerCase();
            if(nombre.startsWith(data.query.toLowerCase())){
                const d=it.data();

                //console.log("object",d);
                
                const a={
                    pk:it.id,
                    nombre:d.nombre,
                    foto_perfil:d.foto_perfil,
                };
               // console.log("object",a);
                array.push(a);
            }
        })
        return array;
    })
        .catch(error => {
            return error;
        });
});



export const filtro_cercanos_centro_deportivo= functions.https.onCall((data, context) => {
    console.log("que mas v" + data.latitude + " " + data.longitude);

     return firestore.collection(PATH_SPORT_CENTER).get().then(value => {
        const array = [];
        value.docs.forEach(it => {

            const latitud_center_sport = it.data().direccion.latitud
            const longitud_center_sport = it.data().direccion.longitud

            console.log("lat "+ latitud_center_sport)
            const a={
                pk:it.id,
                nombre:it.data().nombre,
                foto_perfil:it.data().foto_perfil,
                distancia:getDistance(data.latitude,data.longitude,latitud_center_sport,longitud_center_sport)
            };

            array.push(a);
        })
        return array;
    })
        .catch(error => {
            return error;
        });
   
});

function getDistance(lat1:number,lon1:number,lat2:number,lon2:number){
    const R =  6371; // km
    const dLat = toRad(lat1-lat2);
    const dLon = toRad(lon1-lon2);

    let a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

  function toRad (num) {
    return num * Math.PI / 180
  }


export const  filtro_abierto_centro_deportivo = functions.https.onCall((data, context) => {
    return getCenterSportOpen().then(v=>{
        console.log("bien");
        return v;
    }).catch(e=>{
        console.log("mal");
        return e;
    });
   
});


async function getCenterSportOpen(){
    const date=moment().utc().subtract(5,'hours',).toDate();
    const dia=getDay(date);
    const hora=getHora(date);
    console.log(dia,hora);

    try {
        const array = [];
        /*Obtengo todos los centros deportivos*/
        const cs= await firestore.collection(PATH_SPORT_CENTER).get()

        //Recorro todos los centros deportivos
        for (let entry of cs.docs) {

            //Obtener cada directamente el horario del dia al que correponde , le envio el dia como paremttros
            const data= await firestore.collection(PATH_SPORT_CENTER).doc(entry.id).collection(PATH_TABLE_TIME).doc(dia).get();

            const inicio=data.data().hora_inicio;
            const fin=data.data().hora_fin;

            if(hora>=inicio && hora<=fin){
                
                console.log("abierto")

                /*
                const dire= {
                    pais : value.direccion.pais,
				    provincia :value.direccion.provincia,
				    ciudad :value.direccion.ciudad,
				    latitud :value.direccion.latitud,
				    longitud:value.direccion.longitud,
				    referencia:value.direccion.referencia
                }
                */

                const centro_deportivo={
                    pk:entry.id,
                    nombre:entry.data().nombre,
                    foto_perfil:entry.data().foto_perfil,
                    me_gustas:entry.data().me_gustas,
                    abierto:true,
                    direccion:entry.data().direccion
                };
                array.push(centro_deportivo);    
            }else{

                console.log("cerrado")

            }
        }
        return array;
    } catch (error) {

        throw (error);

    }
}

function getHora(date:Date):Number{
    return date.getHours();
}


 function getDay(date:Date):string{
    
    const diaCode = date.getDay();

    switch(diaCode){
        case 0:
            return "domingo"
        case 1:
            return"lunes"
        case 2:
            return"martes"
        case 3:
            return "miercoles"
        case 4:
            return "jueves"
        case 5:
            return "viernes"
        case 6:
            return "sabado"
    }
    return "";
 }


/**
 * METODO PARA REDUCIR TAMAÑOS DE LA IMAGEN 
 * ADVERTENCIA: AUN SE CREA BUCLE INFINITO EN FIREBASE
 */
exports.reducirImagenes = functions.storage.object().onFinalize((object) => {
    const fileBucket = object.bucket; // The Storage bucket that contains the file.
    const filePath = object.name; // File path in the bucket.
    const contentType = object.contentType; // File content type.
    //let resourceState = object.resourceState; // The resourceState is 'exists' or 'not_exists' (for file/folder deletions).
    //const metageneration = object.metageneration;
    const fileName = path.basename(filePath);
    const bucket = gcs.bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const metadata = {
        contentType: contentType,
        'compresion': true
    };

    console.log(object.size)

    if (!object.contentType.startsWith('image/')) {
        console.log('El archivo subido no es imagen');
        return null;
    }

    if (parseFloat(object.size) < tamanioMin ) {
        console.log('Ya se ha bajado la calidad de la imagen');
        return null;
    }

    return bucket.file(filePath).download({
        destination: tempFilePath,
    }).then(() => {
        console.log('IMAGEN SE HA DESCARGADO');
        return spawn('convert', [tempFilePath, '-strip', '-quality', '10', tempFilePath]);
    }).then(() => {
        bucket.file(filePath).delete().then(function () {            
            const thumbFilePath = tempFilePath;                      
        }).catch(function (error) {
            console.log('ERROR AL ELIMINAR')
        });
        return bucket.upload(tempFilePath, {
            destination: path.join(path.dirname(filePath), fileName),
            metadata: metadata,
        });
    }).then(
        () => fs.unlinkSync(tempFilePath)
    );
});

/**
 * METODO AGREGAR CAMPO EXTRA DE EDICION
 * ESTE METODO SE USA PARA PERMITIR SER VISIBLE EN APP MOVIL
*/
exports.crearCuentaPrimeraVez = functions.firestore
    .document('centro_deportivo/{centroId}')
    .onCreate((change, context) => {
        console.log("CREAR USUARIO POR PRIMERA VEZ")

        return change.ref.set({
            activo_visible: false
        }, { merge: true });
    });

exports.actidarPorDatosCompletos = functions.firestore
    .document('centro_deportivo/{centroId}/cancha/{canchaId}')
    .onCreate((change, context) => {
        console.log("CREAR CANCHA POR PRIMERA VEZ")
        
        const storageRef = firebase.firestore().doc('centro_deportivo/'+context.params.centroId)        
        storageRef.set({
            activo_visible: true,
        }, { merge: true }).then(() => console.log('EDITADO'))
        .catch(() => 'obligatory catch');
        return null;
    });
