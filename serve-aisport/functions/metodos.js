/**
 * METODO PARA OBTENER DISTANCIA ENTRE 2 PUNTOS
 * @param {Coordenadas de ubicacion 1} coords1 
 * @param {Coordenadas de ubicacion 2} coords2 
 */
exports.distancia_entre_puntos = function (coords1, coords2) {
            
    function toRad(x) {
        return x * Math.PI / 180;
    }

    var dLat = toRad(coords2.latitude - coords1.latitude);
    var dLon = toRad(coords2.longitude - coords1.longitude)

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coords1.latitude)) * 
        Math.cos(toRad(coords2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    return 12742 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

exports.abieroCerrado = function (hora_inicio, hora_fin) {

}

exports.formatoJsonCentroDepotivo = function (id,datos,clienteCoors) {    
    var datosNuevos= {};
    datosNuevos['pk']= id;
    datosNuevos['nombres']= datos.nombre;
    datosNuevos['foto_perfil']= this.urlDocFireBase(datos.foto_perfil._referencePath.segments);
    datosNuevos['direccion']= datos.direccion;
    datosNuevos['distance']= this.distancia_entre_puntos(clienteCoors,datos.direccion.ubicacion);
    datosNuevos['abierto']= 0;
    return datosNuevos
}

exports.urlDocFireBase = function (datosFoto) {    
    var urlCompleta = ''
    for(var i=0;i<datosFoto.length;i++){        
        urlCompleta += "/"+datosFoto[i];
    }        
    return urlCompleta;
}